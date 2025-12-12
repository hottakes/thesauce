import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Admin imports
import { AdminLogin } from "./pages/admin/Login";
import { AdminLayout } from "./components/admin/AdminLayout";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminApplicants } from "./pages/admin/Applicants";
import { AdminSchools } from "./pages/admin/Schools";
import { AdminFormBuilder } from "./pages/admin/FormBuilder";
import { AdminChallenges } from "./pages/admin/Challenges";
import { AdminAmbassadorTypes } from "./pages/admin/AmbassadorTypes";
import { AdminSettings } from "./pages/admin/Settings";

// Portal imports
import { PortalLogin } from "./pages/portal/Login";
import { PortalLayout } from "./components/portal/PortalLayout";
import { PortalProtectedRoute } from "./components/portal/PortalProtectedRoute";
import { PortalDashboard } from "./pages/portal/Dashboard";
import { PortalOpportunities } from "./pages/portal/Opportunities";
import { PortalBoosts } from "./pages/portal/Boosts";
import { PortalProfile } from "./pages/portal/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="applicants" element={<AdminApplicants />} />
              <Route path="schools" element={<AdminSchools />} />
              <Route path="form-builder" element={<AdminFormBuilder />} />
              <Route path="challenges" element={<AdminChallenges />} />
              <Route path="ambassador-types" element={<AdminAmbassadorTypes />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            {/* Portal Routes */}
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal" element={<PortalLayout />}>
              <Route
                index
                element={
                  <PortalProtectedRoute>
                    <PortalDashboard />
                  </PortalProtectedRoute>
                }
              />
              <Route
                path="opportunities"
                element={
                  <PortalProtectedRoute>
                    <PortalOpportunities />
                  </PortalProtectedRoute>
                }
              />
              <Route
                path="boosts"
                element={
                  <PortalProtectedRoute>
                    <PortalBoosts />
                  </PortalProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <PortalProtectedRoute>
                    <PortalProfile />
                  </PortalProtectedRoute>
                }
              />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
