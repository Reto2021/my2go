import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import RewardsPage from "./pages/RewardsPage";
import RewardDetailPage from "./pages/RewardDetailPage";
import CodePage from "./pages/CodePage";
import PartnerPage from "./pages/PartnerPage";
import PartnerDetailPage from "./pages/PartnerDetailPage";
import FAQPage from "./pages/FAQPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/rewards/:id" element={<RewardDetailPage />} />
            <Route path="/code" element={<CodePage />} />
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/partner/:id" element={<PartnerDetailPage />} />
            <Route path="/faq" element={<FAQPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
