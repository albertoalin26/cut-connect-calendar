
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import AppLayout from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";
import Appointments from "@/pages/Appointments";
import NewAppointment from "@/pages/NewAppointment";
import Clients from "@/pages/Clients";
import Services from "@/pages/Services";
import WorkingHours from "@/pages/WorkingHours";
import Auth from "@/pages/Auth";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments/new" element={<NewAppointment />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/services" element={<Services />} />
              <Route path="/working-hours" element={<WorkingHours />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
