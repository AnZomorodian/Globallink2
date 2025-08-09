
import { useEffect, useState, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(userId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messageHandlers = useRef<Map<string, (message: any) => void>>(new Map());
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 3;

  const connect = useCallback(() => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any existing reconnect timer
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Send authentication message
        ws.send(JSON.stringify({
          type: 'user_connected',
          userId: userId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const handler = messageHandlers.current.get(message.type);
          if (handler) {
            handler(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code);
        setIsConnected(false);
        wsRef.current = null;

        // Only attempt reconnection if we haven't exceeded max attempts
        if (reconnectAttempts.current < maxReconnectAttempts && userId) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          
          reconnectTimer.current = setTimeout(() => {
            if (userId) {
              connect();
            }
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [userId]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'user_disconnected',
          userId: userId
        }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, [userId]);

  useEffect(() => {
    if (userId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not connected. Message not sent:', message);
    return false;
  }, []);

  const addMessageHandler = useCallback((type: string, handler: (message: any) => void) => {
    messageHandlers.current.set(type, handler);
    
    return () => {
      messageHandlers.current.delete(type);
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    addMessageHandler,
    disconnect
  };
}
