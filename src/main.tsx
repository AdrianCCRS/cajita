import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { applyCachedAppTheme } from "./shared/utils/themeColor";
import { applyCachedThemeMode } from "./shared/utils/themeMode";
import "./app/styles.css";

applyCachedThemeMode();
applyCachedAppTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
