import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertCallSchema, updateUserSchema } from "@shared/schema";
import { z } from "zod";

interface WSClient extends WebSocket {
  userId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<string, WSClient>();

  // User registration (legacy endpoint)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Simple user sign up (simplified for this app)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      // Simple validation schema for basic signup
      const simpleSignupSchema = z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        displayName: z.string().min(2, "Display name must be at least 2 characters"),
      });
      
      const userData = simpleSignupSchema.parse(req.body);
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create simplified user data with defaults
      const userToCreate = {
        username: userData.username,
        displayName: userData.displayName,
        email: `${userData.username}@globalink.local`, // Default email
        password: "default", // No password needed for this simple version
        confirmPassword: "default",
        phoneNumber: null,
        countryCode: null,
        companyName: null,
        jobTitle: null,
        firstName: null,
        lastName: null,
        birthDate: null,
        bio: null
      };

      const user = await storage.createUser(userToCreate);
      
      // Return user without password
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Simple user login (no password required for this version)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "User not found. Please sign up first." });
      }

      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user by voice ID
  app.get("/api/users/voice/:voiceId", async (req, res) => {
    try {
      const user = await storage.getUserByVoiceId(req.params.voiceId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get call history
  app.get("/api/calls/history/:userId", async (req, res) => {
    try {
      const calls = await storage.getCallHistory(req.params.userId);
      // Populate caller/recipient info
      const callsWithUsers = await Promise.all(calls.map(async (call) => {
        const caller = await storage.getUser(call.callerId);
        const recipient = await storage.getUser(call.recipientId);
        return {
          ...call,
          callerInfo: caller,
          recipientInfo: recipient
        };
      }));
      res.json(callsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile
  app.patch("/api/users/:userId", async (req, res) => {
    try {
      const updates = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.params.userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WSClient) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'user_connected':
            ws.userId = message.userId;
            clients.set(message.userId, ws);
            await storage.updateUserOnlineStatus(message.userId, true);
            
            // Broadcast user online status
            broadcast({
              type: 'user_status_changed',
              userId: message.userId,
              isOnline: true
            });
            break;

          case 'initiate_call':
            const { callerId, recipientId } = message;
            
            // Create call record
            const call = await storage.createCall({
              callerId,
              recipientId,
              status: 'calling',
              duration: null
            });

            // Send call request to recipient
            const recipientWs = clients.get(recipientId);
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
              recipientWs.send(JSON.stringify({
                type: 'incoming_call',
                callId: call.id,
                callerId,
                callerInfo: await storage.getUser(callerId)
              }));
            } else {
              // Recipient is offline
              await storage.updateCallStatus(call.id, 'missed');
              ws.send(JSON.stringify({
                type: 'call_failed',
                reason: 'User is offline'
              }));
            }
            break;

          case 'accept_call':
            const acceptCallId = message.callId;
            await storage.updateCallStatus(acceptCallId, 'connected');
            
            const callData = await storage.getCall(acceptCallId);
            if (callData) {
              // Notify caller that call was accepted
              const callerWs = clients.get(callData.callerId);
              if (callerWs && callerWs.readyState === WebSocket.OPEN) {
                callerWs.send(JSON.stringify({
                  type: 'call_accepted',
                  callId: acceptCallId
                }));
              }
            }
            break;

          case 'decline_call':
            const declineCallId = message.callId;
            await storage.updateCallStatus(declineCallId, 'ended');
            
            const declinedCall = await storage.getCall(declineCallId);
            if (declinedCall) {
              // Notify caller that call was declined
              const callerWs = clients.get(declinedCall.callerId);
              if (callerWs && callerWs.readyState === WebSocket.OPEN) {
                callerWs.send(JSON.stringify({
                  type: 'call_declined',
                  callId: declineCallId
                }));
              }
            }
            break;

          case 'end_call':
            const endCallId = message.callId;
            const duration = message.duration || '00:00';
            await storage.updateCallStatus(endCallId, 'ended', new Date(), duration);
            
            const endedCall = await storage.getCall(endCallId);
            if (endedCall) {
              // Notify other participant
              const otherUserId = endedCall.callerId === ws.userId ? endedCall.recipientId : endedCall.callerId;
              const otherWs = clients.get(otherUserId);
              if (otherWs && otherWs.readyState === WebSocket.OPEN) {
                otherWs.send(JSON.stringify({
                  type: 'call_ended',
                  callId: endCallId
                }));
              }
            }
            break;

          case 'call_signal':
            // Relay WebRTC signaling data between call participants
            if (message.callId) {
              const signalCall = await storage.getCall(message.callId);
              if (signalCall) {
                const targetUserId = signalCall.callerId === ws.userId ? signalCall.recipientId : signalCall.callerId;
                const targetWs = clients.get(targetUserId);
                if (targetWs && targetWs.readyState === WebSocket.OPEN) {
                  targetWs.send(JSON.stringify({
                    type: 'call_signal',
                    callId: message.callId,
                    signal: message.signal
                  }));
                }
              }
            }
            break;

          case 'send_message':
            // Handle real-time messaging
            const { recipientId: msgRecipientId, messageData } = message;
            const recipientWsMsg = clients.get(msgRecipientId);
            
            if (recipientWsMsg && recipientWsMsg.readyState === WebSocket.OPEN) {
              recipientWsMsg.send(JSON.stringify({
                type: 'new_message',
                messageData: messageData
              }));
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      console.log('WebSocket connection closed', ws.userId ? `for user ${ws.userId}` : '');
      if (ws.userId) {
        clients.delete(ws.userId);
        await storage.updateUserOnlineStatus(ws.userId, false);
        
        // Broadcast user offline status
        broadcast({
          type: 'user_status_changed',
          userId: ws.userId,
          isOnline: false
        });
      }
    });
  });

  function broadcast(message: any) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
