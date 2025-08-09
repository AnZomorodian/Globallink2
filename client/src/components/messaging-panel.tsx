import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle } from "lucide-react";
import userManager from "@/lib/user.js";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderVoiceId: string;
  recipientId: string;
  recipientVoiceId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
  status?: 'sending' | 'delivered' | 'read';
}

interface MessagingPanelProps {
  recipientId: string; // This is the voice ID of the recipient
  recipientName: string;
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (message: Message) => void;
}

export function MessagingPanel({
  recipientId,
  recipientName,
  currentUserId,
  currentUserName,
  onSendMessage
}: MessagingPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [recipientUserId, setRecipientUserId] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [messageStatus, setMessageStatus] = useState<{ [key: string]: 'sending' | 'delivered' | 'read' }>({});

  // Get recipient's actual user ID from voice ID
  useEffect(() => {
    const fetchRecipientUserId = async () => {
      try {
        const response = await fetch(`/api/users/voice/${recipientId}`);
        if (response.ok) {
          const recipientData = await response.json();
          setRecipientUserId(recipientData.id);
        } else {
          console.error('Failed to fetch recipient user ID');
          setRecipientUserId(recipientId); // Fallback
        }
      } catch (error) {
        console.error('Error fetching recipient ID:', error);
        setRecipientUserId(recipientId); // Fallback
      }
    };

    if (recipientId) {
      fetchRecipientUserId();
    }
  }, [recipientId]);

  // Load conversation messages
  useEffect(() => {
    const loadConversation = () => {
      if (!recipientUserId || !currentUserId) return;

      try {
        // Get current user's sent messages
        const sentKey = `globalink_sent_${currentUserId}`;
        const sentMessages = JSON.parse(localStorage.getItem(sentKey) || '[]');

        // Get current user's received messages (inbox)
        const inboxKey = `globalink_inbox_${currentUserId}`;
        const inboxMessages = JSON.parse(localStorage.getItem(inboxKey) || '[]');

        // Filter messages for this conversation
        const sentConversationMessages = sentMessages.filter(
          (msg: Message) => msg.recipientId === recipientUserId || msg.recipientVoiceId === recipientId
        );

        const receivedConversationMessages = inboxMessages.filter(
          (msg: Message) => msg.senderId === recipientUserId || msg.senderVoiceId === recipientId
        );

        // Combine and sort messages
        const allMessages = [...sentConversationMessages, ...receivedConversationMessages];
        allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Remove duplicates based on message ID
        const uniqueMessages = allMessages.filter((msg, index, arr) =>
          arr.findIndex(m => m.id === msg.id) === index
        );

        setMessages(uniqueMessages);
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };

    if (recipientUserId && currentUserId) {
      loadConversation();
    }
  }, [recipientUserId, currentUserId, recipientId]);

  const handleTyping = (value: string) => {
    setMessageText(value);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set typing indicator
    setIsTyping(true);

    // Clear typing indicator after 3 seconds of no typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);

    setTypingTimeout(timeout);
  };

  const sendMessage = async () => {
    if (!messageText.trim()) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentUser = userManager.getCurrentUser();

    if (!currentUser) {
      console.error('No current user found');
      return;
    }

    // Determine the actual recipient user ID
    let actualRecipientId = recipientUserId || recipientId;
    
    // If we don't have a user ID, try to get it from the server
    if (!recipientUserId && recipientId) {
      try {
        const response = await fetch(`/api/users/voice/${recipientId}`);
        if (response.ok) {
          const recipientData = await response.json();
          actualRecipientId = recipientData.id;
          setRecipientUserId(recipientData.id);
        } else {
          // If server lookup fails, use the voice ID as fallback
          actualRecipientId = recipientId;
        }
      } catch (error) {
        console.error('Error fetching recipient ID:', error);
        actualRecipientId = recipientId;
      }
    }

    const newMessage: Message = {
      id: messageId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderVoiceId: currentUser.voiceId,
      recipientId: actualRecipientId,
      recipientVoiceId: recipientId,
      text: messageText.trim(),
      timestamp: new Date(),
      isRead: false,
      status: 'sending',
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageStatus(prev => ({ ...prev, [messageId]: 'sending' }));

    try {
      // Save to sender's sent messages
      const senderKey = `globalink_sent_${currentUserId}`;
      const senderMessages = JSON.parse(localStorage.getItem(senderKey) || '[]');
      senderMessages.push({ ...newMessage, status: 'delivered' });
      localStorage.setItem(senderKey, JSON.stringify(senderMessages));

      // Save to recipient's inbox - this is the key fix
      const recipientKey = `globalink_inbox_${actualRecipientId}`;
      const recipientMessages = JSON.parse(localStorage.getItem(recipientKey) || '[]');
      recipientMessages.push({ ...newMessage, status: 'delivered' });
      localStorage.setItem(recipientKey, JSON.stringify(recipientMessages));

      // Update message status to delivered
      setTimeout(() => {
        setMessageStatus(prev => ({ ...prev, [messageId]: 'delivered' }));
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, status: 'delivered' } : msg
        ));
      }, 500);

      // Send via WebSocket if available
      try {
        const ws = (window as any).globalWebSocket;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'send_message',
            recipientId: actualRecipientId,
            messageData: { ...newMessage, status: 'delivered' }
          }));
        }
      } catch (wsError) {
        console.error('WebSocket send error:', wsError);
      }

      // Trigger callback if provided
      if (onSendMessage) {
        onSendMessage({ ...newMessage, status: 'delivered' });
      }

      console.log('Message sent successfully to recipient:', actualRecipientId);
      console.log('Message saved to inbox key:', recipientKey);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageStatus(prev => ({ ...prev, [messageId]: 'failed' }));
    }

    setMessageText('');
    setIsTyping(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]); // Re-scroll if typing indicator appears

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-primary" />
          Chat with {recipientName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4 pb-4" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    msg.senderId === currentUserId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        msg.senderId === currentUserId
                          ? 'text-primary-foreground/70'
                          : 'text-gray-500'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {msg.senderId === currentUserId && (
                        <div className="flex items-center gap-1">
                          {messageStatus[msg.id] === 'sending' && (
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
                          )}
                          {messageStatus[msg.id] === 'delivered' && (
                            <div className="text-xs opacity-70">✓</div>
                          )}
                          {msg.isRead && (
                            <div className="text-xs opacity-70">✓✓</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-xs lg:max-w-md">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!messageText.trim() || !recipientUserId}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}