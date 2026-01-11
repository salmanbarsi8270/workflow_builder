import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "./components/theme-provider"
import { PieceProvider } from "./context/PieceContext"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <PieceProvider>
        <App />
      </PieceProvider>
    </ThemeProvider>
  </StrictMode>
)
