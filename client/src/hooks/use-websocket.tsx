import { useEffect, useState, useCallback, useRef } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket(userId?: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messageHandlers = useRef<Map<string, (message: any) => void>>(new Map());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Send user connection message
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
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
      setSocket(null);
      
      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        console.log(`Reconnecting in ${1000 * Math.pow(2, reconnectAttempts.current)}ms...`);
        setTimeout(() => {
          connect();
        }, 1000 * Math.pow(2, reconnectAttempts.current));
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [userId, connect]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  const addMessageHandler = useCallback((type: string, handler: (message: any) => void) => {
    messageHandlers.current.set(type, handler);
  }, []);

  const removeMessageHandler = useCallback((type: string) => {
    messageHandlers.current.delete(type);
  }, []);

  return {
    isConnected,
    sendMessage,
    addMessageHandler,
    removeMessageHandler
  };
}
