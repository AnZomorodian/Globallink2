import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useWebSocket } from "@/hooks/use-websocket";
import { storage } from "@/lib/user";
import AuthPage from "@/pages/auth";
import SignUpPage from "@/pages/signup";
import HomePage from "@/pages/home";
import type { User } from "@shared/schema";

const queryClient = new QueryClient();

type AuthMode = 'login' | 'signup';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Initialize WebSocket connection when user is logged in
  useWebSocket(user?.id || undefined);

  useEffect(() => {
    // Check for stored user data on app start
    const storedUser = storage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    storage.setUser(userData);
    setUser(userData);
  };

  const handleSignUp = (userData: User) => {
    storage.setUser(userData);
    setUser(userData);
  };

  const handleLogout = () => {
    storage.removeUser();
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
        ) : authMode === 'login' ? (
          <AuthPage 
            onLogin={handleLogin} 
            onSwitchToSignUp={() => setAuthMode('signup')}
          />
        ) : (
          <SignUpPage 
            onSignUp={handleSignUp}
            onBackToLogin={() => setAuthMode('login')}
          />
        )}
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}