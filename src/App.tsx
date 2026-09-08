import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import FarmManager from './pages/FarmManager'
import Hub from './pages/Hub'
import Report from './pages/Report'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Hub />} />
        <Route path="report" element={<Report />} />
        <Route path="farm-manager" element={<FarmManager />} />
      </Route>
    </Routes>
  )
}
