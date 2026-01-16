import { lazy, Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { OnlineStatusProvider } from "@/contexts/OnlineStatusContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PartnerGuard } from "@/components/partner/PartnerGuard";
import { PartnerLayout } from "@/components/partner/PartnerLayout";
import { GoLayout } from "@/components/go/GoLayout";
import { ReviewRequestTrigger } from "./components/reviews/ReviewRequestTrigger";
import { InstallPrompt } from "./components/ui/install-prompt";
import { FunnelLayout } from "./components/funnel/FunnelLayout";
import { RouteLoader } from "./components/ui/route-loader";
import { useRadioStore } from "./lib/radio-store";

import { OfflinePrefetchProvider } from "./hooks/useOfflinePrefetch";

// Core pages - loaded immediately
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";

// Auth pages - lazy loaded
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

// Main app pages - lazy loaded
const RewardsPage = lazy(() => import("./pages/RewardsPage"));
const RewardDetailPage = lazy(() => import("./pages/RewardDetailPage"));
const CodePage = lazy(() => import("./pages/CodePage"));
const PartnerPage = lazy(() => import("./pages/PartnerPage"));
const PartnerDetailPage = lazy(() => import("./pages/PartnerDetailPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
// MyRedemptionsPage removed - now integrated in RewardsPage as tab
const MyQRPage = lazy(() => import("./pages/MyQRPage"));
const RedemptionDetailPage = lazy(() => import("./pages/RedemptionDetailPage"));
const ReferralPage = lazy(() => import("./pages/ReferralPage"));
const BadgesPage = lazy(() => import("./pages/BadgesPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const LegalTermsPage = lazy(() => import("./pages/LegalTermsPage"));
const ImpressumPage = lazy(() => import("./pages/ImpressumPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));

// Admin pages - lazy loaded (rarely accessed)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminGHLStatus = lazy(() => import("./pages/admin/AdminGHLStatus"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminAirDrops = lazy(() => import("./pages/admin/AdminAirDrops"));
const AdminBadges = lazy(() => import("./pages/admin/AdminBadges"));
const AdminRadioTiers = lazy(() => import("./pages/admin/AdminRadioTiers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminCronJobs = lazy(() => import("./pages/admin/AdminCronJobs"));
const AdminPartnerApplications = lazy(() => import("./pages/admin/AdminPartnerApplications"));
const AdminLiveEvents = lazy(() => import("./pages/admin/AdminLiveEvents"));

// Partner portal pages - lazy loaded
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));
const PartnerScanPage = lazy(() => import("./pages/partner/PartnerScanPage"));
const PartnerRewards = lazy(() => import("./pages/partner/PartnerRewards"));
const PartnerRedemptions = lazy(() => import("./pages/partner/PartnerRedemptions"));
const PartnerReviews = lazy(() => import("./pages/partner/PartnerReviews"));
const PartnerSettingsPage = lazy(() => import("./pages/partner/PartnerSettings"));

// Go Funnel Pages (B2B Partner Sales) - lazy loaded
const PartnerLandingPage = lazy(() => import("./pages/go/PartnerLandingPage"));
const PartnerPricingPage = lazy(() => import("./pages/go/PartnerPricingPage"));
const PartnerCheckoutPage = lazy(() => import("./pages/go/PartnerCheckoutPage"));
const PartnerThankYouPage = lazy(() => import("./pages/go/PartnerThankYouPage"));
const PartnerOnboardingPage = lazy(() => import("./pages/go/PartnerOnboardingPage"));
const PartnerFAQPage = lazy(() => import("./pages/go/PartnerFAQPage"));
const PartnerPosPage = lazy(() => import("./pages/go/PartnerPosPage"));
const PartnerRefundPage = lazy(() => import("./pages/go/PartnerRefundPage"));
const GoAGBPage = lazy(() => import("./pages/go/legal/GoAGBPage"));
const GoDatenschutzPage = lazy(() => import("./pages/go/legal/GoDatenschutzPage"));
const GoImpressumPage = lazy(() => import("./pages/go/legal/GoImpressumPage"));

// B2C Acquisition Funnel Pages - lazy loaded
const FunnelEntryPage = lazy(() => import("./pages/funnel/FunnelEntryPage"));
const FunnelDropPage = lazy(() => import("./pages/funnel/FunnelDropPage"));
const FunnelWelcomePage = lazy(() => import("./pages/funnel/FunnelWelcomePage"));
const FunnelPartnerPage = lazy(() => import("./pages/funnel/FunnelPartnerPage"));
const FunnelCampaignPage = lazy(() => import("./pages/funnel/FunnelCampaignPage"));
const FunnelInstallPage = lazy(() => import("./pages/funnel/FunnelInstallPage"));
const FunnelTermsPage = lazy(() => import("./pages/funnel/legal/FunnelTermsPage"));
const FunnelPrivacyPage = lazy(() => import("./pages/funnel/legal/FunnelPrivacyPage"));
const FunnelImprintPage = lazy(() => import("./pages/funnel/legal/FunnelImprintPage"));

const queryClient = new QueryClient();

// Setup Service Worker message listener for push notification handling
function useServiceWorkerMessages() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        console.log('[App] Message from SW:', event.data);
        
        if (event.data?.type === 'REVIEW_REQUEST_CLICKED') {
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

// Auto-resume radio playback after login/navigation
function useRadioAutoResume() {
  useEffect(() => {
    // Check if there's a saved state to resume (e.g., after login)
    const autoResume = useRadioStore.getState().autoResumeIfNeeded;
    autoResume();
  }, []);
}

function AppContent() {
  useServiceWorkerMessages();
  useRadioAutoResume();
  
  return (
    <BrowserRouter>
      <InstallPrompt />
      <ReviewRequestTrigger />
      <Suspense fallback={<RouteLoader />}>
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
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="ghl" element={<AdminGHLStatus />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="badges" element={<AdminBadges />} />
            <Route path="radio" element={<AdminRadioTiers />} />
            <Route path="airdrops" element={<AdminAirDrops />} />
            <Route path="applications" element={<AdminPartnerApplications />} />
            <Route path="live-events" element={<AdminLiveEvents />} />
            <Route path="cron" element={<AdminCronJobs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          {/* Partner portal with partner layout and guard */}
          <Route path="/partner-portal" element={<PartnerGuard><PartnerLayout /></PartnerGuard>}>
            <Route index element={<PartnerDashboard />} />
            <Route path="scan" element={<PartnerScanPage />} />
            <Route path="rewards" element={<PartnerRewards />} />
            <Route path="redemptions" element={<PartnerRedemptions />} />
            <Route path="reviews" element={<PartnerReviews />} />
            <Route path="settings" element={<PartnerSettingsPage />} />
          </Route>
          
          {/* Go Partner Sales Funnel (B2B) */}
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
          
          {/* B2C Acquisition Funnel */}
          <Route path="/u" element={<FunnelLayout />}>
            <Route index element={<FunnelEntryPage />} />
            <Route path="drop" element={<FunnelDropPage />} />
            <Route path="welcome" element={<FunnelWelcomePage />} />
            <Route path="p/:partnerSlug" element={<FunnelPartnerPage />} />
            <Route path="c/:campaignSlug" element={<FunnelCampaignPage />} />
            <Route path="install" element={<FunnelInstallPage />} />
            <Route path="legal/terms" element={<FunnelTermsPage />} />
            <Route path="legal/privacy" element={<FunnelPrivacyPage />} />
            <Route path="legal/imprint" element={<FunnelImprintPage />} />
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
            {/* Redemption detail now under rewards path */}
            <Route path="/rewards/redemption/:id" element={<RedemptionDetailPage />} />
            <Route path="/my-qr" element={<MyQRPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnlineStatusProvider>
          <OfflinePrefetchProvider>
            <OnboardingProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <OnboardingOverlay />
                <AppContent />
              </TooltipProvider>
            </OnboardingProvider>
          </OfflinePrefetchProvider>
        </OnlineStatusProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
