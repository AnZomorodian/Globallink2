
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, MessageCircle, Trash2, MarkAsUnreadIcon } from "lucide-react";
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
}

interface InboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConversation?: (voiceId: string, name: string) => void;
  currentUserId?: string;
  onReply?: (recipientId: string, recipientName: string) => void;
}

export function InboxModal({ isOpen, onClose, onOpenConversation }: InboxModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Map<string, {
    senderName: string;
    senderVoiceId: string;
    latestMessage: Message;
    unreadCount: number;
    messages: Message[];
  }>>(new Map());

  useEffect(() => {
    if (isOpen) {
      loadInboxMessages();
    }
  }, [isOpen]);

  const loadInboxMessages = () => {
    try {
      const currentUser = userManager.getCurrentUser();
      if (!currentUser) {
        console.error('No current user found');
        return;
      }

      const inboxKey = `globalink_inbox_${currentUser.id}`;
      const storedMessages = JSON.parse(localStorage.getItem(inboxKey) || '[]');
      
      console.log('Loading inbox for user:', currentUser.id);
      console.log('Inbox key:', inboxKey);
      console.log('Found messages:', storedMessages.length);

      // Convert stored messages to proper format
      const inboxMessages: Message[] = storedMessages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      // Sort messages by timestamp (newest first)
      inboxMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setMessages(inboxMessages);

      // Group messages by sender
      const conversationMap = new Map();
      
      inboxMessages.forEach(message => {
        const senderId = message.senderVoiceId || message.senderId;
        
        if (!conversationMap.has(senderId)) {
          conversationMap.set(senderId, {
            senderName: message.senderName || 'Unknown User',
            senderVoiceId: message.senderVoiceId || message.senderId,
            latestMessage: message,
            unreadCount: 0,
            messages: []
          });
        }
        
        const conversation = conversationMap.get(senderId);
        conversation.messages.push(message);
        
        if (!message.isRead) {
          conversation.unreadCount++;
        }
        
        // Update latest message if this one is newer
        if (message.timestamp > conversation.latestMessage.timestamp) {
          conversation.latestMessage = message;
        }
      });

      setConversations(conversationMap);
      console.log('Loaded conversations:', conversationMap.size);
    } catch (error) {
      console.error('Error loading inbox messages:', error);
    }
  };

  const markAsRead = (messageId: string) => {
    try {
      const currentUser = userManager.getCurrentUser();
      if (!currentUser) return;

      const inboxKey = `globalink_inbox_${currentUser.id}`;
      const storedMessages = JSON.parse(localStorage.getItem(inboxKey) || '[]');
      
      const updatedMessages = storedMessages.map((msg: any) => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      );
      
      localStorage.setItem(inboxKey, JSON.stringify(updatedMessages));
      loadInboxMessages(); // Reload to update UI
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markConversationAsRead = (senderVoiceId: string) => {
    try {
      const currentUser = userManager.getCurrentUser();
      if (!currentUser) return;

      const inboxKey = `globalink_inbox_${currentUser.id}`;
      const storedMessages = JSON.parse(localStorage.getItem(inboxKey) || '[]');
      
      const updatedMessages = storedMessages.map((msg: any) => 
        (msg.senderVoiceId === senderVoiceId || msg.senderId === senderVoiceId) 
          ? { ...msg, isRead: true } 
          : msg
      );
      
      localStorage.setItem(inboxKey, JSON.stringify(updatedMessages));
      loadInboxMessages(); // Reload to update UI
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const deleteMessage = (messageId: string) => {
    try {
      const currentUser = userManager.getCurrentUser();
      if (!currentUser) return;

      const inboxKey = `globalink_inbox_${currentUser.id}`;
      const storedMessages = JSON.parse(localStorage.getItem(inboxKey) || '[]');
      
      const filteredMessages = storedMessages.filter((msg: any) => msg.id !== messageId);
      localStorage.setItem(inboxKey, JSON.stringify(filteredMessages));
      
      loadInboxMessages(); // Reload to update UI
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleOpenConversation = (senderVoiceId: string, senderName: string) => {
    markConversationAsRead(senderVoiceId);
    if (onOpenConversation) {
      onOpenConversation(senderVoiceId, senderName);
    } else if (onReply) {
      onReply(senderVoiceId, senderName);
    }
    onClose();
  };

  const getTotalUnreadCount = () => {
    let total = 0;
    conversations.forEach(conv => {
      total += conv.unreadCount;
    });
    return total;
  };

  const getSenderInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'UN';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Mail className="h-5 w-5 mr-2" />
            Inbox
            {getTotalUnreadCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getTotalUnreadCount()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-96">
          {conversations.size === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.from(conversations.entries()).map(([senderVoiceId, conversation]) => (
                <div
                  key={senderVoiceId}
                  className={`p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                    conversation.unreadCount > 0 ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleOpenConversation(senderVoiceId, conversation.senderName)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm">
                        {getSenderInitials(conversation.senderName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          conversation.unreadCount > 0 ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {conversation.senderName}
                        </p>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {conversation.latestMessage.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm text-gray-600 truncate ${
                        conversation.unreadCount > 0 ? 'font-medium' : ''
                      }`}>
                        {conversation.latestMessage.text}
                      </p>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        Voice ID: {senderVoiceId}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={loadInboxMessages}>
            Refresh
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
