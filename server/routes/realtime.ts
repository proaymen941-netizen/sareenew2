import express from "express";
import { storage } from "../storage";
import { wsManager } from "../websocket";
import { autoDispatcher } from "../autoDispatcher";
import { NotificationManager } from "../notificationManager";

const router = express.Router();

router.post("/update-order-status", async (req, res) => {
  try {
    const { orderId, status, driverId, restaurantId } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updatedOrder = await storage.updateOrder(orderId, { status });

    await NotificationManager.notifyOrderStatusChange(orderId, status, updatedOrder);

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

router.post("/driver-location", async (req, res) => {
  try {
    const { driverId, latitude, longitude, orderId } = req.body;

    if (!driverId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const driver = await storage.getDriver(driverId);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    await storage.updateDriver(driverId, {
      currentLocation: `${latitude},${longitude}`
    });

    await NotificationManager.notifyDriverLocationUpdate(driverId, latitude, longitude, orderId);

    res.json({ success: true, message: "Location updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update location" });
  }
});

router.post("/accept-order", async (req, res) => {
  try {
    const { orderId, driverId } = req.body;

    if (!orderId || !driverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.driverId && order.driverId !== driverId) {
      return res.status(400).json({ error: "Order already assigned to another driver" });
    }

    const updatedOrder = await storage.updateOrder(orderId, {
      driverId,
      status: "on_way"
    });

    await NotificationManager.notifyOrderStatusChange(orderId, "on_way", updatedOrder);

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept order" });
  }
});

router.post("/complete-order", async (req, res) => {
  try {
    const { orderId, driverId, latitude, longitude } = req.body;

    if (!orderId || !driverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.driverId !== driverId) {
      return res.status(400).json({ error: "Order not assigned to this driver" });
    }

    const updatedOrder = await storage.updateOrder(orderId, {
      status: "delivered"
    });

    await NotificationManager.notifyDeliveryCompleted(orderId, updatedOrder);
    await NotificationManager.notifyRatingRequest(orderId, updatedOrder);

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete order" });
  }
});

router.post("/dispatch-order", async (req, res) => {
  try {
    const { orderId, driverId } = req.body;

    if (!orderId || !driverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const success = await autoDispatcher.manualDispatch(orderId, driverId);

    if (success) {
      res.json({ success: true, message: "Order dispatched" });
    } else {
      res.status(400).json({ error: "Failed to dispatch order" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to dispatch order" });
  }
});

router.post("/reassign-order", async (req, res) => {
  try {
    const { orderId, newDriverId } = req.body;

    if (!orderId || !newDriverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const success = await autoDispatcher.reassignOrder(orderId, newDriverId);

    if (success) {
      res.json({ success: true, message: "Order reassigned" });
    } else {
      res.status(400).json({ error: "Failed to reassign order" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to reassign order" });
  }
});

router.post("/release-order", async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Missing orderId" });
    }

    const success = await autoDispatcher.releaseOrder(orderId);

    if (success) {
      res.json({ success: true, message: "Order released" });
    } else {
      res.status(400).json({ error: "Failed to release order" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to release order" });
  }
});

router.get("/ws-stats", async (req, res) => {
  try {
    const connectedUsers = wsManager.getConnectedUsers();
    const dispatchStats = await autoDispatcher.getDispatchStats();

    res.json({
      wsConnections: {
        totalConnected: connectedUsers.length,
        users: connectedUsers
      },
      dispatchStats
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.post("/broadcast-notification", async (req, res) => {
  try {
    const { title, message, targetType } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    NotificationManager.broadcastSystemNotification(title, message, targetType);

    res.json({ success: true, message: "Notification broadcasted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to broadcast notification" });
  }
});

export default router;
