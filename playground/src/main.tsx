import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import { ThemeProvider, Toaster } from "@/components/ui";
import { App } from "./App.tsx";

// biome-ignore lint/style/noNonNullAssertion: it definitely exists
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
);
