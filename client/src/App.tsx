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

const queryClient = new QueryClient();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Added for clarity
  const [incomingCall, setIncomingCall] = useState<any>(null); // Added for call state
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle'); // Added for call state
  const [activeCall, setActiveCall] = useState<any>(null); // Added for active call state
  const [ws, setWs] = useState<WebSocket | null>(null); // Added for WebSocket instance
  const [ringtoneService] = useState(() => new RingtoneService()); // Initialize ringtone service

  // Initialize WebSocket connection when user is logged in
  useWebSocket(user?.id || undefined);

  useEffect(() => {
    // Check for stored session on app start
    const storedUser = sessionManager.getSession();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true); // Set authenticated state
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    sessionManager.saveSession(userData);
    setUser(userData);
    setIsAuthenticated(true); // Set authenticated state on login
  };

  const handleLogout = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }

    // Clear all user data and session information
    storage.removeUser();
    sessionManager.clearSession();

    // Reset all state
    setUser(null);
    setIsAuthenticated(false);
    setIncomingCall(null);
    setActiveCall(null);
    setCallState('idle');

    // Stop any playing ringtones
    ringtoneService.stopRingtone();

    // Force page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Mocking the message handler for the purpose of the provided snippet
  // In a real app, this would be part of the useWebSocket hook or managed globally
  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'incoming_call':
          const incomingCallData = {
            callId: data.callId,
            callerName: data.callerInfo?.displayName || 'Unknown',
            callerInitials: getInitials(data.callerInfo?.displayName || 'Unknown'),
            callerId: data.callerId
          };

          setIncomingCall(incomingCallData);

          // Play incoming ringtone
          if (data.shouldPlayRingtone) {
            ringtoneService.startIncomingCallRingtone();
          }

          // Show browser notification
          if (data.shouldShowNotification && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Incoming Call', {
                body: `${incomingCallData.callerName} is calling you`,
                icon: '/favicon.ico',
                requireInteraction: true
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  new Notification('Incoming Call', {
                    body: `${incomingCallData.callerName} is calling you`,
                    icon: '/favicon.ico',
                    requireInteraction: true
                  });
                }
              });
            }
          }
          break;

        case 'call_ringing':
          // Play outgoing ringtone when call is ringing
          ringtoneService.startOutgoingCallRingtone();
          break;

        case 'call_accepted':
          setCallState('connected');
          setActiveCall(prev => prev ? { ...prev, isConnected: true } : null);
          ringtoneService.stopRingtone();
          ringtoneService.playCallConnectedSound();
          break;

        case 'call_ended':
          setCallState('ended');
          setActiveCall(null);
          ringtoneService.stopRingtone();
          break;

        // Handle other message types as needed
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
    }
  };

  // WebSocket connection is handled by useWebSocket hook
  // Remove the duplicate WebSocket connection logic


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