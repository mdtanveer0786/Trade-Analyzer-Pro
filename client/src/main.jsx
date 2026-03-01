import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

const root = ReactDOM.createRoot(document.getElementById('root'))

const AppContent = (
    <React.StrictMode>
        {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here' ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <App />
            </GoogleOAuthProvider>
        ) : (
            <App />
        )}
    </React.StrictMode>
)

root.render(AppContent)
