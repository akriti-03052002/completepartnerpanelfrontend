import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { recoverPageUpdate } from './utils/recoverPageUpdate.mjs'

window.addEventListener('vite:preloadError', (event) => {
  if (recoverPageUpdate(event.payload)) event.preventDefault()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
