
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, MessageCircle, Video, UserPlus, Settings, Clock, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: 'call' | 'message' | 'contact_added' | 'settings_changed';
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
    initials: string;
  };
}

interface ActivityFeedProps {
  currentUserId: string;
  limit?: number;
}

export function ActivityFeed({ currentUserId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadActivities();
    
    // Real-time updates - refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const loadActivities = () => {
    const storageKey = `globalink_activities_${currentUserId}`;
    const stored = localStorage.getItem(storageKey);
    const parsedActivities = stored ? JSON.parse(stored) : [];
    
    // Parse timestamps from stored activities
    const processedActivities = parsedActivities.map((activity: any) => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    }));
    
    setActivities(processedActivities.slice(0, limit));
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4 text-green-600" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-600" />;
      case 'contact_added':
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      case 'settings_changed':
        return <Settings className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'call':
        return 'bg-green-50 border-green-200';
      case 'message':
        return 'bg-blue-50 border-blue-200';
      case 'contact_added':
        return 'bg-purple-50 border-purple-200';
      case 'settings_changed':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="text-primary mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className={`p-3 rounded-lg border ${getActivityColor(activity.type)} hover:shadow-sm transition-shadow`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    {activity.user && (
                      <div className="flex items-center mt-2">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                            {activity.user.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-500">{activity.user.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
