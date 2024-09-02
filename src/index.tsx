// src/index.tsx
import React from "react";
import ReactDOM from "react-dom";
import "./index.css"; // Import Tailwind CSS
import App from "./App";
import * as ServiceWorkerRegistration from "../src/service/serviceWorkerRegistration";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root"),
);

ServiceWorkerRegistration.register();
