import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/index.css";
import { Toaster } from "@/components/ui/sonner.tsx";
import { ThemeProvider } from "@/components/ui/theme-provider.tsx";
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
