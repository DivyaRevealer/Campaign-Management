// import 'antd/dist/reset.css'; 
// import 'antd/dist/antd.css';

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Get the root element safely with correct TypeScript typing
const rootElement = document.getElementById("root") as HTMLElement;

if (!rootElement) {
  throw new Error("Root element not found. Make sure your index.html has a <div id='root'></div>");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
