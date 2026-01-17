import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Explore from "./pages/Explore";
import CreatorProfile from "./pages/CreatorProfile";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorUpload from "./pages/CreatorUpload";
import HowToUpload from "./pages/HowToUpload";
import PackDetail from "./pages/PackDetail";
import Subscriptions from "./pages/Subscriptions";
import Earnings from "./pages/Earnings";
import AdminPayouts from "./pages/AdminPayouts";
import AdminDashboard from "./pages/AdminDashboard";
import Settings from "./pages/Settings";
import Download from "./pages/Download";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Licensing from "./pages/Licensing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/creator/:handle" element={<CreatorProfile />} />
              <Route path="/creator/dashboard" element={<CreatorDashboard />} />
              <Route path="/creator/upload" element={<CreatorUpload />} />
              <Route path="/creator/earnings" element={<Earnings />} />
              <Route path="/how-to-upload" element={<HowToUpload />} />
              <Route path="/pack/:id" element={<PackDetail />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/payouts" element={<AdminPayouts />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/download" element={<Download />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/licensing" element={<Licensing />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;