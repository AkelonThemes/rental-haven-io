import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import EditProperty from "@/pages/EditProperty";
import Tenants from "@/pages/Tenants";
import EditTenant from "@/pages/EditTenant";
import Payments from "@/pages/Payments";
import LandlordMaintenance from "@/pages/LandlordMaintenance";
import Account from "@/pages/Account";
import Settings from "@/pages/Settings";
import PrivateRoute from "@/components/PrivateRoute";
import TenantDashboard from "@/pages/TenantDashboard";
import TenantMaintenance from "@/pages/TenantMaintenance";
import TenantPayments from "@/pages/TenantPayments";
import NotFound from "@/pages/NotFound";

// Create a client
const queryClient = new QueryClient();

// Create router with future flags
const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/properties",
    element: (
      <PrivateRoute>
        <Properties />
      </PrivateRoute>
    ),
  },
  {
    path: "/properties/:id/edit",
    element: (
      <PrivateRoute>
        <EditProperty />
      </PrivateRoute>
    ),
  },
  {
    path: "/tenants",
    element: (
      <PrivateRoute>
        <Tenants />
      </PrivateRoute>
    ),
  },
  {
    path: "/tenants/:id/edit",
    element: (
      <PrivateRoute>
        <EditTenant />
      </PrivateRoute>
    ),
  },
  {
    path: "/payments",
    element: (
      <PrivateRoute>
        <Payments />
      </PrivateRoute>
    ),
  },
  {
    path: "/landlord-maintenance",
    element: (
      <PrivateRoute>
        <LandlordMaintenance />
      </PrivateRoute>
    ),
  },
  {
    path: "/tenant-dashboard",
    element: (
      <PrivateRoute>
        <TenantDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/tenant-maintenance",
    element: (
      <PrivateRoute>
        <TenantMaintenance />
      </PrivateRoute>
    ),
  },
  {
    path: "/tenant-payments",
    element: (
      <PrivateRoute>
        <TenantPayments />
      </PrivateRoute>
    ),
  },
  {
    path: "/account",
    element: (
      <PrivateRoute>
        <Account />
      </PrivateRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <PrivateRoute>
        <Settings />
      </PrivateRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;