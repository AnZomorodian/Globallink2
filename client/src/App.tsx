
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useWebSocket } from "@/hooks/use-websocket";
import { sessionManager } from "@/lib/session-manager";
import UnifiedAuthPage from "@/pages/unified-auth";
import HomePage from "@/pages/home";
import type { User } from "@shared/schema";
import { RingtoneService } from "@/lib/ringtone";
import { storage } from "@/lib/user";
import { getInitials } from "@/lib/utils";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ringtoneService] = useState(() => new RingtoneService());

  // WebSocket hook
  const { isConnected, addMessageHandler, disconnect } = useWebSocket(user?.id);

  useEffect(() => {
    // Check for stored session on app start
    try {
      const storedUser = sessionManager.getSession();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
      // Clear corrupted data
      sessionManager.clearSession();
      storage.removeUser();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!user) return;

    const cleanup: (() => void)[] = [];

    // Handle incoming call
    cleanup.push(addMessageHandler('incoming_call', (data) => {
      console.log('Incoming call received:', data);
      
      const incomingCallData = {
        callId: data.callId,
        callerName: data.callerInfo?.displayName || 'Unknown',
        callerInitials: getInitials(data.callerInfo?.displayName || 'Unknown'),
        callerId: data.callerId
      };

      // Play ringtone if needed
      if (data.shouldPlayRingtone) {
        ringtoneService.startIncomingCallRingtone();
      }

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Incoming Call', {
          body: `${incomingCallData.callerName} is calling you`,
          icon: '/favicon.ico'
        });
      }
    }));

    // Handle call events
    cleanup.push(addMessageHandler('call_ringing', () => {
      ringtoneService.startOutgoingCallRingtone();
    }));

    cleanup.push(addMessageHandler('call_accepted', () => {
      ringtoneService.stopRingtone();
      ringtoneService.playCallConnectedSound();
    }));

    cleanup.push(addMessageHandler('call_ended', () => {
      ringtoneService.stopRingtone();
    }));

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [user, addMessageHandler, ringtoneService]);

  const handleLogin = (userData: User) => {
    try {
      sessionManager.saveSession(userData);
      setUser(userData);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleLogout = () => {
    try {
      // Disconnect WebSocket
      disconnect();

      // Stop any playing sounds
      ringtoneService.stopRingtone();

      // Clear all data
      storage.removeUser();
      sessionManager.clearSession();

      // Reset state
      setUser(null);

      // Optional: Force reload for clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      // Force reload even if there's an error
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Globalink...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        {user ? (
          <HomePage 
            user={user} 
            onLogout={handleLogout}
            isConnected={isConnected}
          />
        ) : (
          <UnifiedAuthPage onLogin={handleLogin} />
        )}
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
