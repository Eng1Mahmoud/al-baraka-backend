import webpush from "web-push";

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;

let configured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
} else {
  console.warn(
    "Web Push not configured — missing VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT. " +
      "Run `npx web-push generate-vapid-keys` and set them in .env to enable order push notifications."
  );
}

export const isWebPushConfigured = () => configured;
export default webpush;
