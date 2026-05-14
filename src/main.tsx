import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "@/app/store";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { QueryProvider } from "@/app/providers/query-provider";

import "./index.css";
import "@/app/themes/theme.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./navigation/routes";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryProvider>
        <ThemeProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
        </ThemeProvider>
      </QueryProvider>
    </Provider>
  </React.StrictMode>,
);
