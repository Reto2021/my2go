import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import HomePage from "./pages/HomePage";
import RewardsPage from "./pages/RewardsPage";
import RewardDetailPage from "./pages/RewardDetailPage";
import CodePage from "./pages/CodePage";
import PartnerPage from "./pages/PartnerPage";
import PartnerDetailPage from "./pages/PartnerDetailPage";
import FAQPage from "./pages/FAQPage";
import SettingsPage from "./pages/SettingsPage";
import AuthPage from "./pages/AuthPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import MyRedemptionsPage from "./pages/MyRedemptionsPage";
import RedemptionDetailPage from "./pages/RedemptionDetailPage";
import ReferralPage from "./pages/ReferralPage";
import NotFound from "./pages/NotFound";
import BadgesPage from "./pages/BadgesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LegalTermsPage from "./pages/LegalTermsPage";
import ImpressumPage from "./pages/ImpressumPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminAirDrops from "./pages/admin/AdminAirDrops";
import AdminBadges from "./pages/admin/AdminBadges";
import AdminRadioTiers from "./pages/admin/AdminRadioTiers";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerRewards from "./pages/partner/PartnerRewards";
import PartnerRedemptions from "./pages/partner/PartnerRedemptions";
import PartnerReviews from "./pages/partner/PartnerReviews";
import { ReviewRequestTrigger } from "./components/reviews/ReviewRequestTrigger";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ReviewRequestTrigger />
          <Routes>
            {/* Auth pages with layout but no login required */}
            <Route element={<AppLayout />}>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            
            {/* Admin pages with admin layout and guard */}
            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<AdminDashboard />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="badges" element={<AdminBadges />} />
              <Route path="radio" element={<AdminRadioTiers />} />
              <Route path="airdrops" element={<AdminAirDrops />} />
            </Route>
            
            {/* Partner portal with partner layout and guard */}
            <Route path="/partner-portal" element={<PartnerGuard><PartnerLayout /></PartnerGuard>}>
              <Route index element={<PartnerDashboard />} />
              <Route path="rewards" element={<PartnerRewards />} />
              <Route path="redemptions" element={<PartnerRedemptions />} />
              <Route path="reviews" element={<PartnerReviews />} />
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
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-redemptions" element={<MyRedemptionsPage />} />
              <Route path="/my-redemptions/:id" element={<RedemptionDetailPage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/badges" element={<BadgesPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/agb" element={<LegalTermsPage />} />
              <Route path="/impressum" element={<ImpressumPage />} />
              <Route path="/datenschutz" element={<PrivacyPolicyPage />} />
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
