import WebSocket, { Server as WebSocketServer } from 'ws';
import { Server as HTTPServer } from 'http';
import { log } from './viteServer';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  userType?: 'customer' | 'driver' | 'admin' | 'restaurant';
  location?: { lat: number; lng: number };
  isAlive: boolean;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  private driverLocations: Map<string, { lat: number; lng: number }> = new Map();

  constructor(server: HTTPServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.initialize();
    log('🔌 WebSocket Server initialized');
  }

  private initialize() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        id: clientId,
        ws,
        isAlive: true
      };

      this.clients.set(clientId, client);

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(clientId, message);
        } catch (error) {
          log(`❌ WebSocket message parse error: ${error}`);
        }
      });

      ws.on('ping', () => {
        client.isAlive = true;
        ws.pong();
      });

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error) => {
        log(`❌ WebSocket error for client ${clientId}: ${error}`);
      });

      log(`✅ Client connected: ${clientId}`);
    });

    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.handleClientDisconnect(clientId);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { type, userId, userType, data } = message;

    switch (type) {
      case 'register':
        this.registerClient(clientId, userId, userType);
        break;
      case 'driver_location':
        this.updateDriverLocation(userId, data);
        break;
      case 'order_update':
        this.broadcastOrderUpdate(data);
        break;
      case 'notification':
        this.sendNotification(data);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;
    }
  }

  private registerClient(clientId: string, userId: string, userType: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.userId = userId;
      client.userType = userType as any;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(clientId);

      this.sendToClient(clientId, {
        type: 'registered',
        message: 'تم التسجيل بنجاح في نظام الإشعارات الفورية'
      });

      log(`✅ User ${userId} (${userType}) registered with socket ${clientId}`);
    }
  }

  private updateDriverLocation(driverId: string, location: { lat: number; lng: number }) {
    this.driverLocations.set(driverId, location);
    
    this.broadcast({
      type: 'driver_location_update',
      driverId,
      location,
      timestamp: new Date().toISOString()
    });
  }

  private broadcastOrderUpdate(orderData: any) {
    const { orderId, status, customerId, driverId, restaurantId } = orderData;

    const statusMessages = {
      pending: 'تم استقبال طلبك',
      confirmed: 'تم تأكيد الطلب',
      preparing: 'جاري تحضير الطلب',
      on_way: 'الطلب في الطريق إليك',
      delivered: 'تم تسليم الطلب',
      cancelled: 'تم إلغاء الطلب'
    };

    const notification = {
      type: 'order_status_changed',
      orderId,
      status,
      message: statusMessages[status as keyof typeof statusMessages] || 'تحديث الطلب',
      timestamp: new Date().toISOString(),
      data: orderData
    };

    if (customerId) {
      this.sendToUser(customerId, notification);
    }
    if (driverId) {
      this.sendToUser(driverId, notification);
    }
    if (restaurantId) {
      this.sendToUser(restaurantId, notification);
    }

    this.broadcast(notification);
  }

  private sendNotification(notificationData: any) {
    const { recipientId, recipientType, title, message } = notificationData;

    const notification = {
      type: 'notification',
      title,
      message,
      data: notificationData,
      timestamp: new Date().toISOString()
    };

    if (recipientId) {
      this.sendToUser(recipientId, notification);
    } else {
      const clients = Array.from(this.clients.values()).filter(
        c => c.userType === recipientType
      );
      clients.forEach(client => {
        this.sendToClient(client.id, notification);
      });
    }
  }

  public sendToUser(userId: string, message: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.sendToClient(socketId, message);
      });
    }
  }

  public sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  public broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  public broadcastToUserType(userType: string, message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.userType === userType && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
  }

  public getConnectedUsers(): { userId: string; userType?: string; count: number }[] {
    const result: { [key: string]: { userType?: string; count: number } } = {};

    this.userSockets.forEach((socketIds, userId) => {
      const client = Array.from(this.clients.values()).find(
        c => socketIds.has(c.id)
      );
      result[userId] = {
        userType: client?.userType,
        count: socketIds.size
      };
    });

    return Object.entries(result).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }

  public getDriverLocation(driverId: string): { lat: number; lng: number } | undefined {
    return this.driverLocations.get(driverId);
  }

  private handleClientDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    
    if (client?.userId) {
      const socketIds = this.userSockets.get(client.userId);
      if (socketIds) {
        socketIds.delete(clientId);
        if (socketIds.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }

    this.clients.delete(clientId);
    log(`❌ Client disconnected: ${clientId}`);
  }

  public getActiveClientsCount(): number {
    return this.clients.size;
  }
}

export let wsManager: WebSocketManager;

export function initializeWebSocket(server: HTTPServer): WebSocketManager {
  wsManager = new WebSocketManager(server);
  return wsManager;
}
