import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useWebSocket } from "@/hooks/use-websocket";
import { sessionManager } from "@/lib/session-manager";
import UnifiedAuthPage from "@/pages/unified-auth";
import HomePage from "@/pages/home";
import type { User } from "@shared/schema";

const queryClient = new QueryClient();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize WebSocket connection when user is logged in
  useWebSocket(user?.id || undefined);

  useEffect(() => {
    // Check for stored session on app start
    const storedUser = sessionManager.getSession();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    sessionManager.saveSession(userData);
    setUser(userData);
  };

  const handleLogout = () => {
    sessionManager.clearSession();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {user ? (
          <HomePage user={user} onLogout={handleLogout} />
        ) : (
          <UnifiedAuthPage onLogin={handleLogin} />
        )}
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}