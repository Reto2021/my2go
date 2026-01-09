import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import RewardsPage from "./pages/RewardsPage";
import RewardDetailPage from "./pages/RewardDetailPage";
import CodePage from "./pages/CodePage";
import PartnerPage from "./pages/PartnerPage";
import PartnerDetailPage from "./pages/PartnerDetailPage";
import FAQPage from "./pages/FAQPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAirDrops from "./pages/admin/AdminAirDrops";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth page without layout */}
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Admin pages with admin layout and guard */}
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<AdminDashboard />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="airdrops" element={<AdminAirDrops />} />
            </Route>
            
            {/* All other pages with layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/rewards" element={<RewardsPage />} />
              <Route path="/rewards/:id" element={<RewardDetailPage />} />
              <Route path="/code" element={<CodePage />} />
              <Route path="/partner" element={<PartnerPage />} />
              <Route path="/partner/:id" element={<PartnerDetailPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
