import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './components/AuthContext'
import { BrowserRouter } from 'react-router-dom'   

ReactDOM.createRoot(document.getElementById('root')).render(

     <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
)
