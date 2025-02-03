import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Properties from "./pages/Properties";
import EditProperty from "./pages/EditProperty";
import Tenants from "./pages/Tenants";
import Payments from "./pages/Payments";
import MaintenanceRequests from "./pages/MaintenanceRequests";
import Settings from "./pages/Settings";
import PrivateRoute from "./components/PrivateRoute";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
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
              path="/properties/:propertyId/edit"
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
                  <MaintenanceRequests />
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
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;