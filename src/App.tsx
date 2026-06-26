import Admin from "./Admin"
import Dashboard from "./dashboard"
import { Route, Routes } from "react-router-dom"

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Dashboard/>} />
        <Route path="/admin" element={<Admin/>} />
      </Routes>
    </div>
  )
}

export default App
