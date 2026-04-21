import './App.css'
import RegisterPage from './pages/RegeisterPage/RegisterPage.jsx'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PageOne, PageTwo } from './components/GenPages/GenPages.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="one" element={<PageOne />} />
        <Route path="two" element={<PageTwo />} />
        <Route path="auth" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
