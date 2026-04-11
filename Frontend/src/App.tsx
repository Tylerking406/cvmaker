import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CvEditor from './pages/CvEditor'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cvs/:id" element={<CvEditor />} />
      </Routes>
    </BrowserRouter>
  )
}
