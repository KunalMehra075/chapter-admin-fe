import {
  createBrowserRouter,
} from "react-router-dom"

import DashboardLayout from "@/layouts/dashboard-layout"

import DashboardPage from "@/pages/dashboard"
import WaitlistPage from "@/pages/waitlist"
// import AnalyticsPage from "@/pages/dashboard/analytics"
// import SettingsPage from "@/pages/dashboard/settings"

import LoginPage from "@/pages/auth/login"

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },

  {
    path: "/",
    element: <DashboardLayout />,

    children: [
      {
        index: true,
        element: <DashboardPage />,
      },

      {
        path: "waitlist",
        element: <WaitlistPage />,
      },

    //   {
    //     path: "analytics",
    //     element: <AnalyticsPage />,
    //   },

    //   {
    //     path: "settings",
    //     element: <SettingsPage />,
    //   },
    ],
  },
])