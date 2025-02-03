import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TenantDashboard from "./pages/TenantDashboard";
import TenantMaintenance from "./pages/TenantMaintenance";
import TenantPayments from "./pages/TenantPayments";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import LandlordMaintenance from "./pages/LandlordMaintenance";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tenant-dashboard" element={<TenantDashboard />} />
        <Route path="/tenant-maintenance" element={<TenantMaintenance />} />
        <Route path="/tenant-payments" element={<TenantPayments />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/landlord-maintenance" element={<LandlordMaintenance />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;