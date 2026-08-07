import PushSubscription from "../models/PushSubscription.js";
import webpush, { isWebPushConfigured } from "../config/webPush.js";

interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

class PushService {
  /** Stores (or refreshes) a browser push subscription for an admin. */
  async subscribe(adminId: string, subscription: SubscriptionInput) {
    return PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { admin: adminId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true }
    );
  }

  async unsubscribe(endpoint: string) {
    await PushSubscription.deleteOne({ endpoint });
  }

  /**
   * Sends a notification to every subscribed admin. Subscriptions the browser has
   * expired (404/410) are pruned so the collection does not accumulate dead endpoints.
   */
  async broadcast(payload: PushPayload) {
    if (!isWebPushConfigured()) return;

    const subscriptions = await PushSubscription.find();
    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            body
          );
        } catch (error: any) {
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error("Push send failed:", error?.message ?? error);
          }
        }
      })
    );
  }
}

export const pushService = new PushService();
