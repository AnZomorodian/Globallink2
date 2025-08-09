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

  // Mock user object for demonstration purposes. In a real app, this would come from context or state.
  const user = userId ? { id: userId } : null;

  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;

      // Send user connection message
      if (ws.readyState === WebSocket.OPEN && user) {
        ws.send(JSON.stringify({
          type: 'user_connected',
          userId: user.id
        }));
      }
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
      wsRef.current = null; // Ensure wsRef is updated

      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = 1000 * Math.pow(2, reconnectAttempts.current);
        console.log(`Reconnecting in ${delay}ms...`);
        setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // The onclose event will handle reconnection logic
    };

    setSocket(ws); // Set the socket state
  }, [userId, user]); // Include user in dependencies

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      // Send disconnect message before closing
      if (wsRef.current.readyState === WebSocket.OPEN && user) {
        wsRef.current.send(JSON.stringify({
          type: 'user_disconnected',
          userId: user.id
        }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [user]); // Include user in dependencies

  useEffect(() => {
    if (userId) {
      connect();
    }

    return cleanup; // Return the cleanup function
  }, [userId, connect, cleanup]); // Include dependencies

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Fallback if socket state is not updated yet but wsRef.current is available
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, [socket]); // Dependency on socket

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