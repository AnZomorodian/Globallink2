import { type User, type InsertUser, type UpdateUser, type Call, type InsertCall } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByVoiceId(voiceId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | undefined>;
  updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void>;
  getOnlineUsers(): Promise<User[]>;
  
  createCall(call: InsertCall): Promise<Call>;
  getCallHistory(userId: string): Promise<Call[]>;
  updateCallStatus(callId: string, status: string, endTime?: Date, duration?: string): Promise<void>;
  getCall(callId: string): Promise<Call | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private calls: Map<string, Call>;

  constructor() {
    this.users = new Map();
    this.calls = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByVoiceId(voiceId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.voiceId === voiceId,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const voiceId = 'VC-' + Math.floor(Math.random() * 9000 + 1000);
    const user: User = { 
      ...insertUser, 
      id,
      voiceId,
      phoneNumber: insertUser.phoneNumber || null,
      countryCode: insertUser.countryCode || null,
      companyName: insertUser.companyName || null,
      jobTitle: insertUser.jobTitle || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      birthDate: insertUser.birthDate || null,
      bio: insertUser.bio || null,
      profileImage: null,
      isOnline: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async updateUserOnlineStatus(id: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, isOnline });
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  async createCall(insertCall: InsertCall): Promise<Call> {
    const id = randomUUID();
    const call: Call = {
      ...insertCall,
      id,
      startTime: new Date(),
      endTime: null,
      duration: null
    };
    this.calls.set(id, call);
    return call;
  }

  async getCallHistory(userId: string): Promise<Call[]> {
    return Array.from(this.calls.values())
      .filter(call => call.callerId === userId || call.recipientId === userId)
      .sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));
  }

  async updateCallStatus(callId: string, status: string, endTime?: Date, duration?: string): Promise<void> {
    const call = this.calls.get(callId);
    if (call) {
      this.calls.set(callId, { 
        ...call, 
        status, 
        endTime: endTime || call.endTime,
        duration: duration || call.duration
      });
    }
  }

  async getCall(callId: string): Promise<Call | undefined> {
    return this.calls.get(callId);
  }
}

export const storage = new MemStorage();
