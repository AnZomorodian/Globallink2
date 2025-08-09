import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, Copy, PhoneCall, History, Check, Settings, Volume2, VolumeX, Video, VideoOff, MessageCircle, Mail, Bell, Keyboard, Activity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { ActiveCallModal } from "@/components/active-call-modal";
import { IncomingCallModal } from "@/components/incoming-call-modal";
import { UserSettingsModal } from "@/components/user-settings-modal";
import { MessagingPanel } from "@/components/messaging-panel";
import { DirectMessaging } from "@/components/direct-messaging";
import { InboxModal } from "@/components/inbox-modal";

import { Footer } from "@/components/footer";
import { ActivityFeed } from "@/components/activity-feed";
import { StatusWidgets } from "@/components/status-widgets";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

import { CallService } from "@/lib/call-service";
import { WebRTCService } from "@/lib/webrtc-service";
import { RingtoneService } from "@/lib/ringtone";
import { z } from "zod";
import type { User } from "@shared/schema";

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

const callFormSchema = z.object({
  recipientId: z.string().min(1, "Please enter a Voice ID"),
});

export default function HomePage({ user: initialUser, onLogout }: HomePageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(initialUser);
  const [copiedVoiceId, setCopiedVoiceId] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; name: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const webRTCRef = useRef<WebRTCService | null>(null);
  const ringtoneRef = useRef<RingtoneService | null>(null);
  
  // Call states
  const [activeCall, setActiveCall] = useState<{
    callId: string;
    callerName: string;
    callerInitials: string;
    callerId: string;
    isConnected: boolean;
  } | null>(null);
  
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    callerName: string;
    callerInitials: string;
    callerId: string;
  } | null>(null);

  const { isConnected, sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket(user.id);

  // Initialize WebRTC and Ringtone services
  useEffect(() => {
    webRTCRef.current = new WebRTCService(sendMessage);
    ringtoneRef.current = new RingtoneService();
    return () => {
      if (webRTCRef.current) {
        webRTCRef.current.endCall();
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.stopRingtone();
      }
    };
  }, [sendMessage]);

  const form = useForm({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      recipientId: "",
    },
  });

  // Get call history
  const { data: callHistory = [], refetch: refetchHistory } = useQuery({
    queryKey: ['/api/calls/history', user.id],
    enabled: !!user.id,
  }) as { data: any[], refetch: () => void };

  // Check for unread messages
  useEffect(() => {
    if (user) {
      const checkUnreadMessages = () => {
        const inboxKey = `globalink_inbox_${user.id}`;
        const messages = JSON.parse(localStorage.getItem(inboxKey) || '[]');
        const unread = messages.filter((msg: any) => !msg.isRead).length;
        setUnreadCount(unread);
      };
      
      checkUnreadMessages();
      const interval = setInterval(checkUnreadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      if (isCtrlOrCmd && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen(true);
      } else if (isCtrlOrCmd && e.key === 'i') {
        e.preventDefault();
        setIsInboxOpen(true);
      } else if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault();
        setIsSettingsOpen(true);
      } else if (isCtrlOrCmd && e.key === 'c' && !selectedRecipient) {
        e.preventDefault();
        handleCopyVoiceId();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecipient]);

  // WebSocket message handlers
  useEffect(() => {
    addMessageHandler('incoming_call', (message) => {
      const callerInitials = message.callerInfo?.displayName
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || 'UN';
      
      setIncomingCall({
        callId: message.callId,
        callerName: message.callerInfo?.displayName || 'Unknown',
        callerInitials,
        callerId: message.callerInfo?.voiceId || message.callerId,
      });

      // Start incoming call ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.startIncomingCallRingtone();
      }
    });

    addMessageHandler('call_accepted', async (message) => {
      if (activeCall && webRTCRef.current && ringtoneRef.current) {
        try {
          ringtoneRef.current.stopRingtone();
          await webRTCRef.current.startCall(message.callId);
          setActiveCall({
            ...activeCall,
            callId: message.callId,
            isConnected: true
          });
          
          // Play call connected sound
          ringtoneRef.current.playCallConnectedSound();
          
          toast({
            title: "Call Connected",
            description: "Voice call is now active!",
          });
        } catch (error: any) {
          toast({
            title: "Audio Error",
            description: error.message || "Could not access microphone",
            variant: "destructive",
          });
        }
      }
    });

    addMessageHandler('call_declined', () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stopRingtone();
      }
      setActiveCall(null);
      toast({
        title: "Call Declined",
        description: "The user declined your call",
        variant: "destructive",
      });
    });

    addMessageHandler('call_ended', () => {
      if (webRTCRef.current) {
        webRTCRef.current.endCall();
      }
      if (ringtoneRef.current) {
        ringtoneRef.current.stopRingtone();
        ringtoneRef.current.playCallEndedSound();
      }
      setActiveCall(null);
      setIncomingCall(null);
      setIsMuted(false);
      setIsDeafened(false);
      refetchHistory();
      toast({
        title: "Call Ended",
        description: "Voice call has ended",
      });
    });

    addMessageHandler('call_signal', async (message) => {
      if (webRTCRef.current && message.signal) {
        try {
          await webRTCRef.current.handleSignal(message.signal);
        } catch (error) {
          console.error('Error handling WebRTC signal:', error);
        }
      }
    });

    addMessageHandler('call_failed', (message) => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stopRingtone();
      }
      setActiveCall(null);
      toast({
        title: "Call Failed",
        description: message.reason || "Unable to connect",
        variant: "destructive",
      });
    });

    addMessageHandler('new_message', (message) => {
      console.log('Received new message via WebSocket:', message);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Show notification
      toast({
        title: "New Message",
        description: `From ${message.messageData?.senderName || 'Unknown'}`,
      });
      
      // If inbox is open, refresh it
      if (isInboxOpen) {
        // Force refresh the inbox modal
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    });

    return () => {
      removeMessageHandler('incoming_call');
      removeMessageHandler('call_accepted');
      removeMessageHandler('call_declined');
      removeMessageHandler('call_ended');
      removeMessageHandler('call_failed');
    };
  }, [addMessageHandler, removeMessageHandler, activeCall, refetchHistory, toast]);

  const handleCopyVoiceId = async () => {
    try {
      await navigator.clipboard.writeText(user.voiceId);
      setCopiedVoiceId(true);
      toast({
        title: "Voice ID Copied",
        description: "Your Voice ID has been copied to clipboard",
      });
      setTimeout(() => setCopiedVoiceId(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy Voice ID",
        variant: "destructive",
      });
    }
  };

  const handleInitiateCall = async (data: { recipientId: string }) => {
    try {
      // Check if recipient exists
      const recipient = await CallService.getUserByVoiceId(data.recipientId);
      
      const recipientInitials = recipient.displayName
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || 'UN';
      
      // Set up active call state
      setActiveCall({
        callId: '', // Will be set by WebSocket response
        callerName: recipient.displayName,
        callerInitials: recipientInitials,
        callerId: data.recipientId,
        isConnected: false
      });

      // Start outgoing call ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.startOutgoingCallRingtone();
      }

      // Send call initiation message
      sendMessage({
        type: 'initiate_call',
        callerId: user.id,
        recipientId: recipient.id
      });

      form.reset();
      
      toast({
        title: "Calling...",
        description: `Calling ${recipient.displayName}`,
      });
    } catch (error: any) {
      toast({
        title: "Call Failed",
        description: error.message === "404: User not found" 
          ? "User with this Voice ID not found" 
          : "Unable to initiate call",
        variant: "destructive",
      });
    }
  };

  const handleAcceptCall = async () => {
    if (incomingCall && webRTCRef.current && ringtoneRef.current) {
      try {
        ringtoneRef.current.stopRingtone();
        await webRTCRef.current.answerCall(incomingCall.callId);
        
        sendMessage({
          type: 'accept_call',
          callId: incomingCall.callId
        });

        setActiveCall({
          ...incomingCall,
          isConnected: true
        });
        setIncomingCall(null);
        
        // Play call connected sound
        ringtoneRef.current.playCallConnectedSound();
        
        toast({
          title: "Call Accepted",
          description: "Voice call is now active!",
        });
      } catch (error: any) {
        toast({
          title: "Audio Error",
          description: error.message || "Could not access microphone",
          variant: "destructive",
        });
        handleDeclineCall();
      }
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall) {
      if (ringtoneRef.current) {
        ringtoneRef.current.stopRingtone();
      }
      sendMessage({
        type: 'decline_call',
        callId: incomingCall.callId
      });
      setIncomingCall(null);
    }
  };

  const handleEndCall = (duration: string) => {
    if (webRTCRef.current) {
      webRTCRef.current.endCall();
    }
    
    if (ringtoneRef.current) {
      ringtoneRef.current.stopRingtone();
      ringtoneRef.current.playCallEndedSound();
    }
    
    if (activeCall) {
      sendMessage({
        type: 'end_call',
        callId: activeCall.callId,
        duration
      });
    }
    setActiveCall(null);
    setIsMuted(false);
    setIsDeafened(false);
    refetchHistory();
  };

  const handleToggleMute = () => {
    if (webRTCRef.current && activeCall) {
      const newMutedState = webRTCRef.current.toggleMute();
      setIsMuted(newMutedState);
      toast({
        title: newMutedState ? "Microphone Muted" : "Microphone Unmuted",
        description: newMutedState ? "You are now muted" : "You are now unmuted",
      });
    }
  };

  const handleToggleDeafen = () => {
    if (webRTCRef.current && activeCall) {
      const newDeafenedState = webRTCRef.current.toggleDeafen();
      setIsDeafened(newDeafenedState);
      toast({
        title: newDeafenedState ? "Audio Deafened" : "Audio Restored",
        description: newDeafenedState ? "You cannot hear the other person" : "You can now hear the other person",
      });
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    // Update localStorage
    localStorage.setItem('globalink_user', JSON.stringify(updatedUser));
    // Force re-render of avatar in header
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getGradientClass = (initials: string) => {
    const gradients = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-blue-500 to-purple-500',
      'bg-gradient-to-br from-green-500 to-blue-500',
      'bg-gradient-to-br from-pink-500 to-orange-500'
    ];
    const index = initials.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Phone className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Globalink</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Status Indicator */}
              <div className="flex items-center space-x-2 bg-success/10 text-success px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Online' : 'Connecting...'}
                </span>
              </div>

              {/* Keyboard Shortcuts Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => setIsShortcutsOpen(true)}
                title="Keyboard shortcuts (Ctrl+/)"
              >
                <Keyboard className="h-4 w-4" />
              </Button>

              {/* Inbox Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 relative"
                onClick={() => {
                  setIsInboxOpen(true);
                  setUnreadCount(0);
                }}
              >
                <Mail className="h-4 w-4" />
                {/* Notification Badge */}
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </Button>
              
              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {user.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-8 h-8 ${getGradientClass(getInitials(user.displayName))} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-medium">
                      {getInitials(user.displayName)}
                    </span>
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                  <div className="text-xs text-gray-500">ID: {user.voiceId}</div>
                </div>
                
                {/* Settings Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        
        {/* Status Widgets */}
        <StatusWidgets isConnected={isConnected} currentUserId={user.id} />
        
        {/* User ID Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Voice ID</h2>
                <p className="text-gray-600 text-sm">Share this ID with others to receive calls</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 px-4 py-2 rounded-xl">
                  <span className="font-mono text-lg font-semibold text-gray-900">
                    {user.voiceId}
                  </span>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="px-4 py-2 rounded-xl"
                  onClick={handleCopyVoiceId}
                >
                  {copiedVoiceId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Make Call Panel */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <PhoneCall className="text-primary mr-3 h-5 w-5" />
                Make a Call
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleInitiateCall)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recipientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Recipient Voice ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter Voice ID (e.g., VC-1234)"
                            className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        type="submit" 
                        className="bg-success hover:bg-success/90 py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                        disabled={!isConnected}
                      >
                        <Phone className="h-4 w-4" />
                        <span>Voice</span>
                      </Button>
                      <Button 
                        type="button"
                        className="bg-primary hover:bg-primary/90 py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                        disabled={!isConnected}
                        onClick={() => {
                          setIsVideoEnabled(true);
                          form.handleSubmit(handleInitiateCall)();
                        }}
                      >
                        <Video className="h-4 w-4" />
                        <span>Video</span>
                      </Button>
                    </div>
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full py-3 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-gray-50"
                      disabled={!form.watch("recipientId")}
                      onClick={() => {
                        const recipientId = form.watch("recipientId");
                        if (recipientId) {
                          setSelectedRecipient({ id: recipientId, name: recipientId });
                        }
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Message</span>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>



          {/* Call History */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <History className="text-primary mr-3 h-5 w-5" />
                Call History
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {callHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No call history yet</p>
                ) : (
                  callHistory.slice(0, 5).map((call: any) => {
                    const otherPerson = call.callerId === user.id ? call.recipientInfo : call.callerInfo;
                    const otherPersonInitials = otherPerson?.displayName
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase() || 'UN';
                    
                    return (
                      <div key={call.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors duration-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${getGradientClass(otherPersonInitials)} rounded-full flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-medium">
                              {otherPersonInitials}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {otherPerson?.displayName || 'Unknown User'}
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Phone className={`h-3 w-3 ${
                                call.status === 'ended' ? 'text-success' : 
                                call.status === 'missed' ? 'text-destructive' : 'text-gray-400'
                              }`} />
                              <span>
                                {call.callerId === user.id ? 'Outgoing' : 'Incoming'} • {CallService.formatTimeAgo(call.startTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {call.duration || '--'}
                          </div>
                          <div className={`text-xs ${
                            call.status === 'ended' ? 'text-success' :
                            call.status === 'missed' ? 'text-destructive' : 'text-gray-500'
                          }`}>
                            {call.status === 'ended' ? 'Completed' : 
                             call.status === 'missed' ? 'Missed' : call.status}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {callHistory.length > 5 && (
                  <Button variant="ghost" className="w-full mt-4 text-primary">
                    View All History
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed Row */}
        <div className="mt-8">
          <ActivityFeed currentUserId={user.id} limit={6} />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Direct Messaging */}
      {selectedRecipient && (
        <div className="fixed bottom-4 right-4 z-50">
          <DirectMessaging
            currentUserId={user.id}
            recipientId={selectedRecipient.id}
            recipientName={selectedRecipient.name}
            onClose={() => setSelectedRecipient(null)}
            onVoiceCall={(voiceId) => {
              form.setValue("recipientId", voiceId);
              form.handleSubmit(handleInitiateCall)();
            }}
            onVideoCall={(voiceId) => {
              setIsVideoEnabled(true);
              form.setValue("recipientId", voiceId);
              form.handleSubmit(handleInitiateCall)();
            }}
          />
        </div>
      )}

      {/* Modals */}
      <ActiveCallModal
        isOpen={!!activeCall}
        onClose={() => setActiveCall(null)}
        callData={activeCall}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleDeafen={handleToggleDeafen}
        isMuted={isMuted}
        isDeafened={isDeafened}
      />

      <IncomingCallModal
        isOpen={!!incomingCall}
        callData={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      <InboxModal
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        currentUserId={user.id}
        onReply={(recipientId, recipientName) => {
          setSelectedRecipient({ id: recipientId, name: recipientName });
          setIsInboxOpen(false);
        }}
      />

      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onLogout={onLogout}
        onUserUpdate={handleUserUpdate}
      />

      <KeyboardShortcuts
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
