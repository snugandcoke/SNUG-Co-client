import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { reloadOnce } from './lib/reload'
import { settingsReady } from './lib/settings'
import { startShopperSync } from './lib/shopper'

window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnce()) event.preventDefault()
})

startShopperSync()

const render = () =>
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

// index.html has already asked for the settings; wait briefly for them on the shop (never on admin).
if (location.pathname.startsWith('/admin')) render()
else settingsReady(300).then(render)
