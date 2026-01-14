import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './lib/router'
import { AuthProvider } from './context/AuthContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
