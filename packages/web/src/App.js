import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './lib/router';
import { AuthProvider } from './context/AuthContext';
function App() {
    const [count, setCount] = useState(0);
    return (_jsx(AuthProvider, { children: _jsx(RouterProvider, { router: router }) }));
}
export default App;
