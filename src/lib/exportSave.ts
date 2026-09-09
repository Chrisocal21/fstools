// Writes Farm Manager edits back into the original XML documents and hands the
// result to the browser — either as a download or, on browsers that support the
// File System Access API, straight into a folder the user picks.
//
// Only farms.xml, fields.xml and vehicles.xml are ever rewritten. Every other
// file in the savegame folder is left exactly where it is.

import {
  damageTarget,
  dirtNodes,
  fillSlotElements,
  STORAGE_SELECTOR,
  VEHICLE_FILL_SELECTOR,
  type SaveDocs,
} from './parseSave'
import type { Field, SaveData } from './saveModel'

export type EditRisk = 'safe' | 'risky'

export type PendingChange = {
  file: string
  target: string
  label: string
  from: string
  to: string
  risk: EditRisk
  warning?: string
}

const CROP_WARNING =
  'The crop is also stored in the terrain density map, which this tool never touches. Changing it here can leave the field looking and behaving inconsistently until it is cultivated and re-sown.'

const FIELD_EDITS: {
  key: keyof Field
  label: string
  risk: EditRisk
  warning?: string
}[] = [
  { key: 'growthState', label: 'Growth state', risk: 'safe' },
  { key: 'weedState', label: 'Weeds', risk: 'safe' },
  { key: 'sprayLevel', label: 'Fertiliser', risk: 'safe' },
  { key: 'limeLevel', label: 'Lime', risk: 'safe' },
  { key: 'plowLevel', label: 'Plough', risk: 'safe' },
  { key: 'stoneLevel', label: 'Stones', risk: 'safe' },
  { key: 'waterLevel', label: 'Water', risk: 'safe' },
  { key: 'fruitType', label: 'Crop', risk: 'risky', warning: CROP_WARNING },
  { key: 'groundType', label: 'Ground', risk: 'risky', warning: CROP_WARNING },
  { key: 'plannedFruit', label: 'Planned crop', risk: 'safe' },
]

const LEVEL_KEYS: (keyof Field)[] = [
  'weedState',
  'sprayLevel',
  'limeLevel',
  'plowLevel',
  'stoneLevel',
  'waterLevel',
]

/** Kept for callers that only need to know whether a save uses levels at all. */
export function usesLevels(fields: Field[]): boolean {
  return !fields.some((f) => LEVEL_KEYS.some((key) => Number(f[key]) > 3))
}

export function diffSave(
  original: SaveData,
  edited: SaveData,
  farmId: number,
): PendingChange[] {
  const changes: PendingChange[] = []

  const before = original.farms.find((f) => f.id === farmId)
  const after = edited.farms.find((f) => f.id === farmId)
  if (before && after) {
    for (const key of ['money', 'loan'] as const) {
      if (before[key] !== after[key]) {
        changes.push({
          file: 'farms.xml',
          target: `Farm ${farmId}`,
          label: key === 'money' ? 'Money' : 'Loan',
          from: String(before[key]),
          to: String(after[key]),
          risk: 'safe',
        })
      }
    }
    if (before.name !== after.name) {
      changes.push({
        file: 'farms.xml',
        target: `Farm ${farmId}`,
        label: 'Name',
        from: before.name,
        to: after.name,
        risk: 'safe',
      })
    }
  }

  const originalFields = new Map(original.fields.map((f) => [f.id, f]))
  for (const field of edited.fields) {
    const source = originalFields.get(field.id)
    if (!source) continue
    for (const edit of FIELD_EDITS) {
      if (source[edit.key] === field[edit.key]) continue
      changes.push({
        file: 'fields.xml',
        target: `Field ${field.id}`,
        label: edit.label,
        from: String(source[edit.key] ?? ''),
        to: String(field[edit.key] ?? ''),
        risk: edit.risk,
        warning: edit.warning,
      })
    }
  }

  const originalVehicles = new Map(original.vehicles.map((v) => [v.uniqueId, v]))
  for (const vehicle of edited.vehicles) {
    const source = originalVehicles.get(vehicle.uniqueId)
    if (!source) continue
    if (source.price !== vehicle.price) {
      changes.push({
        file: 'vehicles.xml',
        target: vehicle.name,
        label: 'Value',
        from: String(source.price),
        to: String(vehicle.price),
        risk: 'safe',
      })
    }
    if (source.damage !== vehicle.damage) {
      changes.push({
        file: 'vehicles.xml',
        target: vehicle.name,
        label: 'Condition',
        from: `${Math.round((1 - source.damage) * 100)}%`,
        to: `${Math.round((1 - vehicle.damage) * 100)}%`,
        risk: 'safe',
      })
    }
    if (source.wear !== vehicle.wear) {
      changes.push({
        file: 'vehicles.xml',
        target: vehicle.name,
        label: 'Dirt',
        from: `${Math.round(source.wear * 100)}%`,
        to: `${Math.round(vehicle.wear * 100)}%`,
        risk: 'safe',
      })
    }
    vehicle.fillUnits.forEach((slot, i) => {
      const before = source.fillUnits[i]
      if (!before || before.fillLevel === slot.fillLevel) return
      changes.push({
        file: 'vehicles.xml',
        target: vehicle.name,
        label: slot.fillType,
        from: String(Math.round(before.fillLevel)),
        to: String(Math.round(slot.fillLevel)),
        risk: 'safe',
      })
    })
  }

  const originalPoints = new Map(original.production.map((p) => [p.uniqueId, p]))
  for (const point of edited.production) {
    const source = originalPoints.get(point.uniqueId)
    if (!source) continue
    point.lines.forEach((line, i) => {
      const before = source.lines[i]
      if (!before || before.active === line.active) return
      changes.push({
        file: 'placeables.xml',
        target: `${point.name} — ${line.name}`,
        label: 'Line',
        from: before.active ? 'running' : 'stopped',
        to: line.active ? 'running' : 'stopped',
        risk: 'safe',
      })
    })
    point.storage.forEach((slot, i) => {
      const before = source.storage[i]
      if (!before || before.fillLevel === slot.fillLevel) return
      changes.push({
        file: 'placeables.xml',
        target: point.name,
        label: slot.fillType,
        from: String(Math.round(before.fillLevel)),
        to: String(Math.round(slot.fillLevel)),
        risk: 'safe',
      })
    })
  }

  return changes
}

// --- writing back ------------------------------------------------------

/** Mirrors the read side: a value may live on the element or in a child node. */
function setAttrOrChild(el: Element, name: string, value: string) {
  const child = el.querySelector(`:scope > ${name}`)
  if (!el.hasAttribute(name) && child) child.textContent = value
  else el.setAttribute(name, value)
}

/** Keeps the file's own token convention (FS stores fruit types uppercase). */
function matchCase(existing: string | null, next: string): string {
  if (existing && existing === existing.toUpperCase() && /[A-Z]/.test(existing)) {
    return next.toUpperCase().replace(/\s+/g, '')
  }
  return next
}

function writeField(el: Element, field: Field, source: Field) {
  for (const edit of FIELD_EDITS) {
    const value = field[edit.key]
    // Untouched attributes are left exactly as the game wrote them.
    if (value === source[edit.key] || value === undefined || value === null) continue
    if (typeof value === 'number') {
      setAttrOrChild(el, edit.key, String(value))
    } else {
      const existing = el.getAttribute(edit.key)
      if (existing === null && !el.querySelector(`:scope > ${edit.key}`)) continue
      setAttrOrChild(el, edit.key, matchCase(existing, value))
    }
  }
}

export type ExportFile = { name: string; text: string }

/** Keeps floats readable in the file instead of 0.30000000000000004. */
function trim(value: number): string {
  return String(Number(value.toFixed(6)))
}

/** XMLSerializer drops the newline after the declaration; the game writes one. */
function serialize(serializer: XMLSerializer, doc: Document): string {
  return serializer.serializeToString(doc).replace(/^(<\?xml[^>]*\?>)(?!\n)/, '$1\n')
}

export function applyChanges(
  docs: SaveDocs,
  original: SaveData,
  edited: SaveData,
  farmId: number,
  changes: PendingChange[],
): ExportFile[] {
  const touched = new Set(changes.map((c) => c.file))
  const out: ExportFile[] = []
  const serializer = new XMLSerializer()

  if (touched.has('farms.xml')) {
    const doc = docs.get('farms.xml')
    const farm = edited.farms.find((f) => f.id === farmId)
    if (doc && farm) {
      for (const el of Array.from(doc.querySelectorAll('farm'))) {
        const id = Number(el.getAttribute('farmId') ?? el.getAttribute('id'))
        if (id !== farmId) continue
        setAttrOrChild(el, 'money', String(farm.money))
        setAttrOrChild(el, 'loan', String(farm.loan))
        if (el.hasAttribute('name')) el.setAttribute('name', farm.name)
      }
      out.push({ name: 'farms.xml', text: serialize(serializer, doc) })
    }
  }

  if (touched.has('fields.xml')) {
    const doc = docs.get('fields.xml')
    if (doc) {
      const byId = new Map(edited.fields.map((f) => [f.id, f]))
      const sourceById = new Map(original.fields.map((f) => [f.id, f]))
      for (const el of Array.from(doc.querySelectorAll('field'))) {
        const id = Number(el.getAttribute('id') ?? el.getAttribute('fieldId'))
        const field = byId.get(id)
        const source = sourceById.get(id)
        if (field && source) writeField(el, field, source)
      }
      out.push({ name: 'fields.xml', text: serialize(serializer, doc) })
    }
  }

  if (touched.has('vehicles.xml')) {
    const doc = docs.get('vehicles.xml')
    if (doc) {
      const byId = new Map(edited.vehicles.map((v) => [v.uniqueId, v]))
      const sourceById = new Map(original.vehicles.map((v) => [v.uniqueId, v]))
      for (const el of Array.from(doc.querySelectorAll('vehicle'))) {
        const id = el.getAttribute('uniqueId') ?? el.getAttribute('id') ?? ''
        const vehicle = byId.get(id)
        const source = sourceById.get(id)
        if (!vehicle || !source) continue
        if (vehicle.price !== source.price) setAttrOrChild(el, 'price', String(vehicle.price))
        if (vehicle.damage !== source.damage) {
          const damage = damageTarget(el)
          damage.el.setAttribute(damage.name, trim(vehicle.damage))
        }
        if (vehicle.wear !== source.wear) {
          // Dirt is per-part in the save; setting them all keeps it consistent.
          for (const node of dirtNodes(el)) node.setAttribute('amount', trim(vehicle.wear))
        }
        fillSlotElements(el, VEHICLE_FILL_SELECTOR).forEach((slotEl, i) => {
          const slot = vehicle.fillUnits[i]
          if (slot && slot.fillLevel !== source.fillUnits[i]?.fillLevel) {
            slotEl.setAttribute('fillLevel', trim(slot.fillLevel))
          }
        })
      }
      out.push({ name: 'vehicles.xml', text: serialize(serializer, doc) })
    }
  }

  if (touched.has('placeables.xml')) {
    const doc = docs.get('placeables.xml')
    if (doc) {
      const byId = new Map(edited.production.map((p) => [p.uniqueId, p]))
      const sourceById = new Map(original.production.map((p) => [p.uniqueId, p]))
      for (const el of Array.from(doc.querySelectorAll('placeable'))) {
        const id = el.getAttribute('uniqueId') ?? el.getAttribute('filename') ?? ''
        const point = byId.get(id)
        const source = sourceById.get(id)
        const pp = el.querySelector('productionPoint')
        if (!point || !source || !pp) continue
        Array.from(pp.querySelectorAll('production')).forEach((prodEl, i) => {
          const line = point.lines[i]
          if (!line || line.active === source.lines[i]?.active) return
          // Mirror the reader's own priority (parseSave.ts) so a toggle always lands on
          // whichever attribute the game will actually read back — real saves only ever
          // carry `isEnabled`, but tolerate the older `active`/`status` shapes too.
          if (prodEl.hasAttribute('isEnabled')) prodEl.setAttribute('isEnabled', String(line.active))
          else if (prodEl.hasAttribute('active')) prodEl.setAttribute('active', String(line.active))
          else prodEl.setAttribute('status', line.active ? '1' : '0')
        })
        fillSlotElements(pp, STORAGE_SELECTOR).forEach((slotEl, i) => {
          const slot = point.storage[i]
          if (slot && slot.fillLevel !== source.storage[i]?.fillLevel) {
            slotEl.setAttribute('fillLevel', trim(slot.fillLevel))
          }
        })
      }
      out.push({ name: 'placeables.xml', text: serialize(serializer, doc) })
    }
  }

  return out
}

export function downloadFiles(files: ExportFile[]) {
  for (const file of files) {
    const blob = new Blob([file.text], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    URL.revokeObjectURL(url)
  }
}

type DirectoryPicker = () => Promise<{
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<{ createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }> }>
}>

export function canWriteDirectly(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'
}

/** Chrome-family only. Writes straight into the savegame folder the user picks. */
export async function writeToDirectory(files: ExportFile[]): Promise<void> {
  const picker = (window as unknown as { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker
  if (!picker) throw new Error('This browser cannot write files directly.')
  const dir = await picker()
  for (const file of files) {
    const handle = await dir.getFileHandle(file.name, { create: false })
    const writable = await handle.createWritable()
    await writable.write(file.text)
    await writable.close()
  }
}
