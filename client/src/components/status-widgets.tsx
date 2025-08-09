
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Signal, Battery, Clock, Globe, Zap, Users, TrendingUp, Phone } from "lucide-react";

interface StatusWidgetsProps {
  isConnected: boolean;
  currentUserId: string;
}

export function StatusWidgets({ isConnected, currentUserId }: StatusWidgetsProps) {
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [onlineUsers, setOnlineUsers] = useState(127);
  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'maintenance'>('operational');
  const [uptime, setUptime] = useState('99.9%');

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="h-4 w-4 text-red-500" />;
    return connectionQuality === 'excellent' ? 
      <Wifi className="h-4 w-4 text-green-500" /> : 
      <Signal className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'maintenance':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Connection Status */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connection</p>
              <p className="text-lg font-semibold capitalize">
                {isConnected ? connectionQuality : 'Disconnected'}
              </p>
            </div>
            {getConnectionIcon()}
          </div>
        </CardContent>
      </Card>

      {/* Online Users */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online</p>
              <p className="text-lg font-semibold">{onlineUsers.toLocaleString()}</p>
            </div>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(systemStatus)}`}></div>
                <p className="text-sm font-medium capitalize">{systemStatus}</p>
              </div>
            </div>
            <Globe className="h-4 w-4 text-purple-500" />
          </div>
        </CardContent>
      </Card>

      {/* Uptime */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold">{uptime}</p>
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
