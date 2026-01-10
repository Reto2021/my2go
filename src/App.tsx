import { useEffect } from "react";
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
import { GoLayout } from "@/components/go/GoLayout";
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
import InstallPage from "./pages/InstallPage";
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
import AdminSettings from "./pages/admin/AdminSettings";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerRewards from "./pages/partner/PartnerRewards";
import PartnerRedemptions from "./pages/partner/PartnerRedemptions";
import PartnerReviews from "./pages/partner/PartnerReviews";
import { ReviewRequestTrigger } from "./components/reviews/ReviewRequestTrigger";
import { InstallPrompt } from "./components/ui/install-prompt";
// Go Funnel Pages
import PartnerLandingPage from "./pages/go/PartnerLandingPage";
import PartnerPricingPage from "./pages/go/PartnerPricingPage";
import PartnerCheckoutPage from "./pages/go/PartnerCheckoutPage";
import PartnerThankYouPage from "./pages/go/PartnerThankYouPage";
import PartnerOnboardingPage from "./pages/go/PartnerOnboardingPage";
import PartnerFAQPage from "./pages/go/PartnerFAQPage";
import PartnerPosPage from "./pages/go/PartnerPosPage";
import PartnerRefundPage from "./pages/go/PartnerRefundPage";
import GoAGBPage from "./pages/go/legal/GoAGBPage";
import GoDatenschutzPage from "./pages/go/legal/GoDatenschutzPage";
import GoImpressumPage from "./pages/go/legal/GoImpressumPage";

const queryClient = new QueryClient();

// Setup Service Worker message listener for push notification handling
function useServiceWorkerMessages() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        console.log('[App] Message from SW:', event.data);
        
        if (event.data?.type === 'REVIEW_REQUEST_CLICKED') {
          // Dispatch custom event that ReviewRequestTrigger listens to
          const customEvent = new CustomEvent('openReviewSheet', {
            detail: {
              redemptionId: event.data.redemptionId,
              partnerId: event.data.partnerId,
            }
          });
          window.dispatchEvent(customEvent);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);
}

function AppContent() {
  useServiceWorkerMessages();
  
  return (
    <BrowserRouter>
      <InstallPrompt />
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
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Partner portal with partner layout and guard */}
        <Route path="/partner-portal" element={<PartnerGuard><PartnerLayout /></PartnerGuard>}>
          <Route index element={<PartnerDashboard />} />
          <Route path="rewards" element={<PartnerRewards />} />
          <Route path="redemptions" element={<PartnerRedemptions />} />
          <Route path="reviews" element={<PartnerReviews />} />
        </Route>
        
        {/* Go Partner Sales Funnel */}
        <Route path="/go" element={<GoLayout />}>
          <Route index element={<PartnerLandingPage />} />
          <Route path="partner" element={<PartnerLandingPage />} />
          <Route path="partner/pricing" element={<PartnerPricingPage />} />
          <Route path="partner/checkout" element={<PartnerCheckoutPage />} />
          <Route path="partner/thank-you" element={<PartnerThankYouPage />} />
          <Route path="partner/onboarding" element={<PartnerOnboardingPage />} />
          <Route path="partner/faq" element={<PartnerFAQPage />} />
          <Route path="partner/pos" element={<PartnerPosPage />} />
          <Route path="partner/refund" element={<PartnerRefundPage />} />
          <Route path="legal/agb" element={<GoAGBPage />} />
          <Route path="legal/datenschutz" element={<GoDatenschutzPage />} />
          <Route path="legal/impressum" element={<GoImpressumPage />} />
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
            <Route path="/install" element={<InstallPage />} />
          <Route path="/agb" element={<LegalTermsPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
          <Route path="/datenschutz" element={<PrivacyPolicyPage />} />
        </Route>
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
