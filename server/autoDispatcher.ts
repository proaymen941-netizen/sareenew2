import { storage } from "./storage";
import { NotificationManager } from "./notificationManager";
import { log } from "./viteServer";

export interface DriverScore {
  driverId: string;
  score: number;
  distance?: number;
  loadFactor: number;
  ratingFactor: number;
  distanceFactor: number;
  reason: string;
}

export class AutoDispatcher {
  
  private static readonly ENABLED = true;
  private static readonly AUTO_DISPATCH_DELAY = 30000;
  private dispatchQueue: Set<string> = new Set();

  constructor() {
    if (AutoDispatcher.ENABLED) {
      this.startAutoDispatcher();
      log('✅ Auto Dispatcher started');
    }
  }

  private startAutoDispatcher() {
    setInterval(() => {
      this.processAutoDispatch();
    }, AutoDispatcher.AUTO_DISPATCH_DELAY);
  }

  private async processAutoDispatch() {
    try {
      const pendingOrders = await storage.getOrders();
      const ordersNeedingDispatch = pendingOrders.filter(
        order => order.status === 'confirmed' && !order.driverId && !this.dispatchQueue.has(order.id)
      );

      for (const order of ordersNeedingDispatch) {
        const bestDriver = await this.findBestDriver(order);
        
        if (bestDriver) {
          this.dispatchQueue.add(order.id);
          
          await this.assignOrderToDriver(order.id, bestDriver.driverId);
          
          setTimeout(() => {
            this.dispatchQueue.delete(order.id);
          }, 5000);
        }
      }
    } catch (error) {
      log(`❌ Error in auto dispatch: ${error}`);
    }
  }

  async findBestDriver(order: any): Promise<DriverScore | null> {
    try {
      const availableDrivers = await storage.getAvailableDrivers();
      
      if (availableDrivers.length === 0) {
        return null;
      }

      const driverScores: DriverScore[] = await Promise.all(
        availableDrivers.map(async driver => {
          return this.calculateDriverScore(driver, order);
        })
      );

      driverScores.sort((a, b) => b.score - a.score);
      
      return driverScores.length > 0 ? driverScores[0] : null;
    } catch (error) {
      log(`❌ Error finding best driver: ${error}`);
      return null;
    }
  }

  private async calculateDriverScore(driver: any, order: any): Promise<DriverScore> {
    let score = 100;
    const reasons: string[] = [];

    const driverOrders = (await storage.getOrders()).filter(
      o => o.driverId === driver.id
    );
    
    const completedToday = driverOrders.filter(
      o => o.status === 'delivered' && 
          new Date(o.createdAt).toDateString() === new Date().toDateString()
    );

    const loadFactor = Math.min(completedToday.length / 10, 1);
    score -= loadFactor * 20;
    reasons.push(`Load Factor: ${loadFactor.toFixed(2)}`);

    const driverRating = parseFloat(driver.rating || '4.5');
    const ratingFactor = (driverRating - 3) / 2;
    score += ratingFactor * 15;
    reasons.push(`Rating Factor: ${ratingFactor.toFixed(2)}`);

    const distanceFactor = this.calculateDistance(
      order.customerLocationLat || 15.3694,
      order.customerLocationLng || 48.3632,
      driver.latitude || 15.3694,
      driver.longitude || 48.3632
    );

    const distanceScore = Math.max(0, 20 - distanceFactor * 20);
    score += distanceScore;
    reasons.push(`Distance: ${distanceFactor.toFixed(2)}km`);

    const orderAge = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60);
    if (orderAge > 15) {
      score += 10;
      reasons.push('Old Order Priority');
    }

    const totalAmount = parseFloat(order.totalAmount || '0');
    if (totalAmount > 100) {
      score += 5;
      reasons.push('High Value Order');
    }

    return {
      driverId: driver.id,
      score: Math.max(0, score),
      distance: distanceFactor,
      loadFactor,
      ratingFactor,
      distanceFactor,
      reason: reasons.join(' | ')
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async assignOrderToDriver(orderId: string, driverId: string) {
    try {
      const order = await storage.getOrder(orderId);
      
      if (order && !order.driverId) {
        await storage.updateOrder(orderId, {
          driverId,
          status: 'on_way'
        });

        await NotificationManager.notifyDriverAssigned(orderId, driverId, order);
        
        log(`✅ Order ${orderId} auto-dispatched to driver ${driverId}`);
      }
    } catch (error) {
      log(`❌ Error assigning order to driver: ${error}`);
    }
  }

  async manualDispatch(orderId: string, driverId: string): Promise<boolean> {
    try {
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        log(`❌ Order ${orderId} not found`);
        return false;
      }

      if (order.driverId) {
        log(`⚠️ Order ${orderId} already assigned to driver ${order.driverId}`);
        return false;
      }

      const driver = await storage.getDriver(driverId);
      if (!driver) {
        log(`❌ Driver ${driverId} not found`);
        return false;
      }

      await storage.updateOrder(orderId, {
        driverId,
        status: 'on_way'
      });

      await NotificationManager.notifyDriverAssigned(orderId, driverId, order);
      
      log(`✅ Order ${orderId} manually dispatched to driver ${driverId}`);
      return true;
    } catch (error) {
      log(`❌ Error in manual dispatch: ${error}`);
      return false;
    }
  }

  async reassignOrder(orderId: string, newDriverId: string): Promise<boolean> {
    try {
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return false;
      }

      const oldDriverId = order.driverId;

      await storage.updateOrder(orderId, {
        driverId: newDriverId,
        status: 'on_way'
      });

      if (oldDriverId) {
        await NotificationManager.notifyOrderCancelled(
          orderId,
          { ...order, driverId: oldDriverId },
          'تم إعادة تعيين الطلب لسائق آخر'
        );
      }

      await NotificationManager.notifyDriverAssigned(orderId, newDriverId, order);
      
      log(`✅ Order ${orderId} reassigned from ${oldDriverId} to ${newDriverId}`);
      return true;
    } catch (error) {
      log(`❌ Error reassigning order: ${error}`);
      return false;
    }
  }

  async releaseOrder(orderId: string): Promise<boolean> {
    try {
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return false;
      }

      await storage.updateOrder(orderId, {
        driverId: undefined,
        status: 'confirmed'
      });

      if (order.driverId) {
        const driver = await storage.getDriver(order.driverId);
        await NotificationManager.notifyOrderCancelled(
          orderId,
          order,
          'تم إلغاء تعيين الطلب'
        );
      }

      log(`✅ Order ${orderId} released from driver`);
      return true;
    } catch (error) {
      log(`❌ Error releasing order: ${error}`);
      return false;
    }
  }

  async getDispatchStats(): Promise<any> {
    try {
      const orders = await storage.getOrders();
      const drivers = await storage.getDrivers();

      const stats = {
        totalOrders: orders.length,
        ordersAwaitingDispatch: orders.filter(o => o.status === 'confirmed' && !o.driverId).length,
        activeDeliveries: orders.filter(o => o.status === 'on_way').length,
        completedOrders: orders.filter(o => o.status === 'delivered').length,
        totalDrivers: drivers.length,
        availableDrivers: drivers.filter(d => d.isAvailable).length,
        busyDrivers: drivers.filter(d => !d.isAvailable).length,
        averageOrderAge: this.calculateAverageOrderAge(orders)
      };

      return stats;
    } catch (error) {
      log(`❌ Error getting dispatch stats: ${error}`);
      return null;
    }
  }

  private calculateAverageOrderAge(orders: any[]): string {
    if (orders.length === 0) return '0m';

    const now = Date.now();
    const totalAge = orders.reduce((sum, order) => {
      return sum + (now - new Date(order.createdAt).getTime());
    }, 0);

    const averageMs = totalAge / orders.length;
    const minutes = Math.floor(averageMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }
}

export let autoDispatcher: AutoDispatcher;

export function initializeAutoDispatcher(): AutoDispatcher {
  autoDispatcher = new AutoDispatcher();
  return autoDispatcher;
}
