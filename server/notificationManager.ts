import { storage } from "./storage";
import { wsManager } from "./websocket";
import { log } from "./viteServer";

export class NotificationManager {
  
  static async notifyNewOrder(orderId: string, orderData: any) {
    try {
      const { restaurantId, customerId, driverId, customerPhone } = orderData;

      log(`📢 Notifying new order: ${orderId}`);

      if (restaurantId) {
        await storage.createNotification({
          type: 'new_order',
          title: 'طلب جديد',
          message: `طلب جديد رقم ${orderData.orderNumber} من ${orderData.customerName}`,
          recipientType: 'restaurant',
          recipientId: restaurantId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(restaurantId, {
            type: 'notification',
            title: 'طلب جديد',
            message: `طلب جديد رقم ${orderData.orderNumber} من ${orderData.customerName}`,
            data: orderData
          });
        }
      }

      const availableDrivers = await storage.getAvailableDrivers();
      for (const driver of availableDrivers) {
        await storage.createNotification({
          type: 'new_order_available',
          title: 'طلب جديد متاح للتوصيل',
          message: `طلب جديد متاح - المبلغ: ${orderData.totalAmount} ريال`,
          recipientType: 'driver',
          recipientId: driver.id,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(driver.id, {
            type: 'notification',
            title: 'طلب جديد متاح للتوصيل',
            message: `طلب جديد متاح - المبلغ: ${orderData.totalAmount} ريال`,
            data: orderData
          });
        }
      }

    } catch (error) {
      log(`❌ Error notifying new order: ${error}`);
    }
  }

  static async notifyOrderStatusChange(orderId: string, newStatus: string, order: any) {
    try {
      log(`📢 Notifying order status change: ${orderId} -> ${newStatus}`);

      const statusMessages: { [key: string]: string } = {
        pending: 'تم استقبال طلبك',
        confirmed: 'تم تأكيد الطلب من قبل المطعم',
        preparing: 'جاري تحضير الطلب',
        on_way: 'الطلب في الطريق إليك',
        delivered: 'تم تسليم الطلب بنجاح',
        cancelled: 'تم إلغاء الطلب'
      };

      const message = statusMessages[newStatus] || 'تحديث الطلب';

      const orderUpdateData = {
        orderId,
        status: newStatus,
        message,
        timestamp: new Date().toISOString(),
        orderNumber: order.orderNumber
      };

      if (order.customerId) {
        await storage.createNotification({
          type: 'order_status_updated',
          title: 'تحديث حالة الطلب',
          message,
          recipientType: 'customer',
          recipientId: order.customerId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.customerId, {
            type: 'order_status_changed',
            title: 'تحديث حالة الطلب',
            message,
            data: orderUpdateData
          });
        }
      }

      if (order.driverId) {
        const driverMessage = `تحديث: ${message} - الطلب رقم ${order.orderNumber}`;
        
        await storage.createNotification({
          type: 'order_status_updated',
          title: 'تحديث حالة الطلب',
          message: driverMessage,
          recipientType: 'driver',
          recipientId: order.driverId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.driverId, {
            type: 'order_status_changed',
            title: 'تحديث حالة الطلب',
            message: driverMessage,
            data: orderUpdateData
          });
        }
      }

      if (order.restaurantId) {
        const restaurantMessage = `تحديث: ${message} - الطلب رقم ${order.orderNumber}`;
        
        await storage.createNotification({
          type: 'order_status_updated',
          title: 'تحديث حالة الطلب',
          message: restaurantMessage,
          recipientType: 'restaurant',
          recipientId: order.restaurantId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.restaurantId, {
            type: 'order_status_changed',
            title: 'تحديث حالة الطلب',
            message: restaurantMessage,
            data: orderUpdateData
          });
        }
      }

    } catch (error) {
      log(`❌ Error notifying order status change: ${error}`);
    }
  }

  static async notifyDriverAssigned(orderId: string, driverId: string, order: any) {
    try {
      log(`📢 Notifying driver assignment: ${orderId} -> ${driverId}`);

      if (order.customerId) {
        const driver = await storage.getDriver(driverId);
        const message = `تم تعيين السائق ${driver?.name || 'السائق'} لتوصيل طلبك`;

        await storage.createNotification({
          type: 'driver_assigned',
          title: 'تم تعيين سائق',
          message,
          recipientType: 'customer',
          recipientId: order.customerId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.customerId, {
            type: 'driver_assigned',
            title: 'تم تعيين سائق',
            message,
            data: { orderId, driver }
          });
        }
      }

      const driver = await storage.getDriver(driverId);
      const driverMessage = `تم تعيين الطلب رقم ${order.orderNumber} لك`;

      await storage.createNotification({
        type: 'order_assigned',
        title: 'طلب جديد معين لك',
        message: driverMessage,
        recipientType: 'driver',
        recipientId: driverId,
        orderId,
        isRead: false
      });

      if (wsManager) {
        wsManager.sendToUser(driverId, {
          type: 'order_assigned',
          title: 'طلب جديد معين لك',
          message: driverMessage,
          data: order
        });
      }

    } catch (error) {
      log(`❌ Error notifying driver assignment: ${error}`);
    }
  }

  static async notifyDriverLocationUpdate(driverId: string, lat: number, lng: number, orderId?: string) {
    try {
      if (wsManager) {
        wsManager.updateDriverLocation(driverId, { lat, lng });

        if (orderId) {
          const order = await storage.getOrder(orderId);
          if (order?.customerId) {
            wsManager.sendToUser(order.customerId, {
              type: 'driver_location_updated',
              driverId,
              location: { lat, lng },
              orderId,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      log(`❌ Error notifying driver location update: ${error}`);
    }
  }

  static async notifyDeliveryCompleted(orderId: string, order: any) {
    try {
      log(`📢 Notifying delivery completed: ${orderId}`);

      if (order.customerId) {
        const message = `تم تسليم طلبك برقم ${order.orderNumber} بنجاح. شكراً لاستخدامك خدماتنا!`;

        await storage.createNotification({
          type: 'delivery_completed',
          title: 'تم تسليم الطلب',
          message,
          recipientType: 'customer',
          recipientId: order.customerId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.customerId, {
            type: 'delivery_completed',
            title: 'تم تسليم الطلب',
            message,
            data: order
          });
        }
      }

      if (order.restaurantId) {
        const message = `تم تسليم الطلب رقم ${order.orderNumber} بنجاح`;

        await storage.createNotification({
          type: 'delivery_completed',
          title: 'تم تسليم الطلب',
          message,
          recipientType: 'restaurant',
          recipientId: order.restaurantId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.restaurantId, {
            type: 'delivery_completed',
            title: 'تم تسليم الطلب',
            message
          });
        }
      }

    } catch (error) {
      log(`❌ Error notifying delivery completed: ${error}`);
    }
  }

  static async notifyOrderCancelled(orderId: string, order: any, reason?: string) {
    try {
      log(`📢 Notifying order cancelled: ${orderId}`);

      const cancelMessage = reason || 'تم إلغاء الطلب';

      if (order.customerId) {
        await storage.createNotification({
          type: 'order_cancelled',
          title: 'تم إلغاء الطلب',
          message: cancelMessage,
          recipientType: 'customer',
          recipientId: order.customerId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.customerId, {
            type: 'order_cancelled',
            title: 'تم إلغاء الطلب',
            message: cancelMessage
          });
        }
      }

      if (order.driverId) {
        await storage.createNotification({
          type: 'order_cancelled',
          title: 'تم إلغاء الطلب',
          message: `تم إلغاء الطلب رقم ${order.orderNumber}`,
          recipientType: 'driver',
          recipientId: order.driverId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.driverId, {
            type: 'order_cancelled',
            title: 'تم إلغاء الطلب',
            message: `تم إلغاء الطلب رقم ${order.orderNumber}`
          });
        }
      }

    } catch (error) {
      log(`❌ Error notifying order cancelled: ${error}`);
    }
  }

  static async notifyRatingRequest(orderId: string, order: any) {
    try {
      if (order.customerId) {
        await storage.createNotification({
          type: 'rating_request',
          title: 'قيّم خدمتنا',
          message: 'نود أن نسمع رأيك في الخدمة التي قدمناها لك',
          recipientType: 'customer',
          recipientId: order.customerId,
          orderId,
          isRead: false
        });

        if (wsManager) {
          wsManager.sendToUser(order.customerId, {
            type: 'rating_request',
            title: 'قيّم خدمتنا',
            message: 'نود أن نسمع رأيك في الخدمة التي قدمناها لك'
          });
        }
      }
    } catch (error) {
      log(`❌ Error notifying rating request: ${error}`);
    }
  }

  static broadcastSystemNotification(title: string, message: string, targetType?: 'customer' | 'driver' | 'admin') {
    try {
      const notification = {
        type: 'system_notification',
        title,
        message,
        timestamp: new Date().toISOString()
      };

      if (wsManager) {
        if (targetType) {
          wsManager.broadcastToUserType(targetType, notification);
        } else {
          wsManager.broadcast(notification);
        }
      }
    } catch (error) {
      log(`❌ Error broadcasting system notification: ${error}`);
    }
  }
}

export default NotificationManager;
