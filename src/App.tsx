import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Trends from "./pages/Trends";
import TrendDetail from "./pages/TrendDetail";
import Watchlist from "./pages/Watchlist";
import DailyDigest from "./pages/DailyDigest";
import WeeklyDigest from "./pages/WeeklyDigest";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Predictions from "./pages/Predictions";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/trends" element={<ProtectedRoute><Trends /></ProtectedRoute>} />
      <Route path="/trends/:id" element={<ProtectedRoute><TrendDetail /></ProtectedRoute>} />
      <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
      <Route path="/daily-digest" element={<ProtectedRoute><DailyDigest /></ProtectedRoute>} />
      <Route path="/weekly-digest" element={<ProtectedRoute><WeeklyDigest /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/predictions" element={<ProtectedRoute><Predictions /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
