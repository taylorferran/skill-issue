import { RouterProvider } from 'react-router-dom'
import { router } from './lib/router'
import { AuthProvider } from './context/AuthContext'

function App() {

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
