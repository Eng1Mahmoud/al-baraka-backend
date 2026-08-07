# البركة — API

Express 5 + TypeScript + MongoDB (Mongoose). Serves the storefront and the dashboard.

## Run locally

```bash
npm install
```

Copy `.env.example` to `.env`, fill in `MONGODB_URI` and `JWT_SECRET`, then create the first account:

```bash
npm run seed:superadmin
```

```bash
npm run dev
```

API runs on `http://localhost:4000`. Health check: `GET /health`.

## Structure

```
src/
├── app.ts              Express setup, CORS, route mounting, error handling
├── config/             db (Mongo), sirv (images), webPush (VAPID)
├── models/             User, Category, Product, Order, Settings, PushSubscription
├── services/           business logic — the only layer that touches models
├── controllers/        request/response shaping, input checks
├── routes/             URL → controller, with auth middleware applied
├── middlewares/        authMiddleware (protect, requireRole), uploadImages, errorHandler
├── scripts/            seedSuperAdmin
└── utils/              ApiError, asyncHandler, slugify
```

Controllers never talk to models directly; services never touch `req`/`res`. That split is what keeps the layers testable.

## Endpoints

| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/login` | public |
| POST | `/api/auth/logout` | public |
| GET | `/api/auth/me` | signed in |
| GET | `/api/categories` | public |
| POST/PATCH/DELETE | `/api/categories/:id` | signed in |
| GET | `/api/products` | public (`?category=&search=&page=&availableOnly=`) |
| POST/PATCH/DELETE | `/api/products/:id` | signed in |
| POST | `/api/orders` | public — guest checkout |
| GET | `/api/orders/track?orderNumber=&phone=` | public |
| GET | `/api/orders` | signed in — polled every 5s by the dashboard |
| PATCH | `/api/orders/:id/status`, `/api/orders/:id/payment` | signed in |
| GET | `/api/settings` | public |
| PATCH | `/api/settings` | signed in |
| GET/POST/PATCH/DELETE | `/api/admins` | **superadmin only** |
| POST | `/api/upload`, `/api/upload/multiple` | signed in |
| POST | `/api/push/subscribe`, `/unsubscribe`, `/test` | signed in |

## Two rules worth keeping

- **Order totals are computed server-side.** `orderService.create` reads prices from the database and ignores any price the client sends, so a tampered cart cannot change what a customer is charged.
- **The superadmin account cannot be edited or deleted through the API.** `adminService` blocks it on every write.

## Notifications

A new order calls `pushService.broadcast`, which sends a Web Push message to every subscribed admin device. Dead subscriptions (404/410) are pruned automatically. Generate the keys once:

```bash
npx web-push generate-vapid-keys
```

Put them in `.env` as `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Without them the app still runs — it logs a warning and skips push.

## Deploy to Render

1. New **Web Service** → connect this repo.
2. Build: `npm install && npm run build` · Start: `npm start`
3. Health check path: `/health`
4. Environment: every key from `.env.example`. `CORS_ORIGIN` must be the Vercel domain (comma-separate to add preview URLs).
5. Pick the region closest to your customers, and create the Atlas cluster in that same region.
6. **Use a paid instance.** On the free plan the service sleeps after 15 minutes idle, which delays order notifications until it wakes.
7. After the first deploy, run `npm run seed:superadmin` once from the Render shell.
