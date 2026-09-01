import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// StrictMode fuera a propósito: duplica los efectos y rompe el streaming en dev.
createRoot(document.getElementById("root")!).render(<App />);
