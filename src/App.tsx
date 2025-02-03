import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/properties"
              element={
                <PrivateRoute>
                  <Properties />
                </PrivateRoute>
              }
            />
            <Route
              path="/properties/:id/edit"
              element={
                <PrivateRoute>
                  <EditProperty />
                </PrivateRoute>
              }
            />
            <Route
              path="/tenants"
              element={
                <PrivateRoute>
                  <Tenants />
                </PrivateRoute>
              }
            />
            <Route
              path="/tenants/:id/edit"
              element={
                <PrivateRoute>
                  <EditTenant />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <Payments />
                </PrivateRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <PrivateRoute>
                  <LandlordMaintenance />
                </PrivateRoute>
              }
            />
            <Route
              path="/account"
              element={
                <PrivateRoute>
                  <Account />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;