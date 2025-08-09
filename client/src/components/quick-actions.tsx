import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, MessageCircle, Star, Clock, Users, Heart, Zap, Calendar, MapPin } from "lucide-react";
import { ContactsService, type Contact } from "@/lib/contacts-service";
import { PresenceService } from "@/lib/presence-service";

interface QuickAction {
  id: string;
  name: string;
  voiceId: string;
  lastCall?: Date;
  isFavorite: boolean;
  isOnline: boolean;
}

interface QuickActionsProps {
  currentUserId: string;
  onVoiceCall: (voiceId: string) => void;
  onVideoCall: (voiceId: string) => void;
  onMessage: (voiceId: string, name: string) => void;
}

export function QuickActions({ currentUserId, onVoiceCall, onVideoCall, onMessage }: QuickActionsProps) {
  const [quickActions, setQuickActions] = useState<QuickAction[]>(() => {
    const saved = localStorage.getItem(`globalink_quick_actions_${currentUserId}`);
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'Demo User', voiceId: 'VC-1234', isFavorite: true, isOnline: true },
      { id: '2', name: 'Test Contact', voiceId: 'VC-5678', isFavorite: false, isOnline: false },
    ];
  });

  const [favorites, setFavorites] = useState<Contact[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [suggestedContacts, setSuggestedContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadQuickActions();
  }, []);

  const loadQuickActions = () => {
    setFavorites(ContactsService.getFavoriteContacts());
    setRecentContacts(ContactsService.getRecentContacts(3));

    // Smart suggestions based on time and frequency
    const allContacts = ContactsService.getContacts();
    const suggestions = allContacts
      .filter(c => !c.isFavorite && c.contactFrequency > 0)
      .sort((a, b) => b.contactFrequency - a.contactFrequency)
      .slice(0, 2);
    setSuggestedContacts(suggestions);
  };

  const toggleFavorite = (actionId: string) => {
    setQuickActions(prev => {
      const updated = prev.map(action => 
        action.id === actionId ? { ...action, isFavorite: !action.isFavorite } : action
      );
      localStorage.setItem(`globalink_quick_actions_${currentUserId}`, JSON.stringify(updated));
      return updated;
    });
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="text-primary mr-2 h-5 w-5" />
            Quick Actions
          </div>
          <Badge variant="outline" className="text-xs">{PresenceService.getOnlineUserCount()} online</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Favorites</h4>
          {favorites.slice(0, 2).map((action) => (
            <div key={action.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={action.avatarUrl} alt={action.name} />
                  <AvatarFallback className={`${getGradientClass(getInitials(action.name))} text-white`}>
                    {getInitials(action.name)}
                  </AvatarFallback>
                  {PresenceService.isUserOnline(action.id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{action.name}</span>
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {PresenceService.getUserStatus(action.id)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onVoiceCall(action.voiceId)}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onVideoCall(action.voiceId)}>
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => onMessage(action.voiceId, action.name)}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-yellow-500" onClick={() => toggleFavorite(action.id)}>
                  <Heart className="h-4 w-4 fill-current text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Suggestions</h4>
          {suggestedContacts.slice(0, 2).map((action) => (
            <div key={action.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={action.avatarUrl} alt={action.name} />
                  <AvatarFallback className={`${getGradientClass(getInitials(action.name))} text-white`}>
                    {getInitials(action.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{action.name}</span>
                    <Zap className="h-3 w-3 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Scheduled meeting</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onVoiceCall(action.voiceId)}>
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => onMessage(action.voiceId, action.name)}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {quickActions.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No quick actions yet</p>
            <p className="text-xs">Call someone to add them here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}