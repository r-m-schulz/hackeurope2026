//test deployment line
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
