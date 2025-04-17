import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { ThemeProvider } from "./components/ui/theme-provider.tsx";

// biome-ignore lint/style/noNonNullAssertion: it definitely exists
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
