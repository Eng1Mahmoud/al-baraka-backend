import { Response } from "express";
import { orderService } from "../services/orderService.js";
import { asyncHandler, IdParam } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { OrderStatus, PaymentStatus } from "../types/index.js";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

/** Public — guest checkout. */
export const createOrder = asyncHandler(async (req, res: Response) => {
  const { customer, items, deliveryAreaId } = req.body;

  if (!customer?.name || !customer?.phone || !customer?.address) {
    throw ApiError.badRequest("الاسم ورقم الهاتف والعنوان مطلوبة");
  }

  res.status(201).json(await orderService.create({ customer, items, deliveryAreaId }));
});

/** Public — guests look up their own order by its number. */
export const trackOrder = asyncHandler(async (req, res: Response) => {
  const { orderNumber } = req.query;
  if (!orderNumber) throw ApiError.badRequest("رقم الطلب مطلوب");

  res.json(await orderService.trackOrder(String(orderNumber)));
});

/** Dashboard — polled every 5 seconds by TanStack Query. */
export const getOrders = asyncHandler(async (req, res: Response) => {
  const { status, search, page, limit, since } = req.query;

  res.json(
    await orderService.list({
      status: status as OrderStatus | undefined,
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      since: since as string | undefined,
    })
  );
});

export const getOrder = asyncHandler<IdParam>(async (req, res: Response) => {
  res.json(await orderService.getById(req.params.id));
});

export const updateOrderStatus = asyncHandler<IdParam>(async (req, res: Response) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw ApiError.badRequest("حالة الطلب غير صحيحة");

  res.json(await orderService.updateStatus(req.params.id, status));
});

export const updatePaymentStatus = asyncHandler<IdParam>(async (req, res: Response) => {
  const { paymentStatus } = req.body as { paymentStatus: PaymentStatus };
  if (!["unpaid", "paid"].includes(paymentStatus)) throw ApiError.badRequest("حالة الدفع غير صحيحة");

  res.json(await orderService.updatePaymentStatus(req.params.id, paymentStatus));
});

export const getStats = asyncHandler(async (_req, res: Response) => {
  res.json(await orderService.stats());
});

export const getAnalytics = asyncHandler(async (req, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : undefined;

  // Clamped: the window is a chart axis, and an unbounded one is an open invitation
  // to aggregate the whole collection from a query string.
  res.json(await orderService.analytics(days ? Math.min(Math.max(days, 7), 90) : undefined));
});
