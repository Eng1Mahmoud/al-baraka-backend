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

  async broadcast(payload: PushPayload) {
    if (!isWebPushConfigured()) return;

    const subscriptions = await PushSubscription.find();
    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body, {
            // Anything below `high` is a message the push service is allowed to sit on
            // while the phone is dozing, and it delivers the backlog when the device
            // next wakes — which is when the admin opens something. The alert would
            // arrive reliably and always too late, telling them about an order they
            // were by then already looking at.
            urgency: "high",
            // Four weeks is the library's default and absurd for this: an order that
            // went unseen for a day is a phone call, not a notification.
            TTL: 60 * 60 * 24,
          });
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
