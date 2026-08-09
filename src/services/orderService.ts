import Order, { IOrder, IOrderItem } from "../models/Order.js";
import Product from "../models/Product.js";
import { OrderStatus, PaymentStatus } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";
import { deliveryAreaService } from "./deliveryAreaService.js";
import { pushService } from "./pushService.js";

interface CreateOrderInput {
  customer: { name: string; phone: string; address: string; city?: string; notes?: string };
  items: { productId: string; quantity: number }[];
  /** Required once the shop has set up delivery areas. */
  deliveryAreaId?: string;
}

/** The part of an order line that inventory cares about. */
type StockLine = Pick<IOrderItem, "product" | "name" | "quantity">;

/** The fields an order is created with — the rest of the schema has defaults. */
type NewOrder = Pick<
  IOrder,
  "orderNumber" | "customer" | "items" | "deliveryArea" | "subtotal" | "deliveryFee" | "total"
>;

interface ListQuery {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  /** Returns only orders created after this ISO timestamp — used by the dashboard poller. */
  since?: string;
}

class OrderService {
  async list({ status, page = 1, limit = 20, since }: ListQuery) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (since) filter.createdAt = { $gt: new Date(since) };

    const skip = (page - 1) * limit;
    const [items, total, pendingCount] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
      Order.countDocuments({ status: "pending" }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) || 1, pendingCount };
  }

  async getById(id: string) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound("الطلب غير موجود");
    return order;
  }

  /** Public lookup for guests: order number must be paired with the phone used to order. */
  async trackOrder(orderNumber: string, phone: string) {
    const order = await Order.findOne({ orderNumber, "customer.phone": phone });
    if (!order) throw ApiError.notFound("لم يتم العثور على طلب بهذه البيانات");
    return order;
  }

  async create({ customer, items, deliveryAreaId }: CreateOrderInput) {
    if (!items?.length) throw ApiError.badRequest("السلة فارغة");

    const lines = this.mergeLines(items);

    // The fee comes from the chosen area, never from the client.
    const { fee: deliveryFee, area } = await deliveryAreaService.resolveFee(deliveryAreaId);
    const products = await Product.find({ _id: { $in: lines.map((line) => line.productId) } });

    const orderItems: IOrderItem[] = lines.map((line) => {
      const product = products.find((candidate) => candidate.id === line.productId);
      if (!product) throw ApiError.badRequest("أحد المنتجات لم يعد متاحًا");
      if (!product.isAvailable) throw ApiError.badRequest(`المنتج "${product.name}" غير متاح حاليًا`);

      return {
        product: product._id as IOrderItem["product"],
        name: product.name,
        price: product.discountPrice ?? product.price,
        unit: product.unit,
        quantity: line.quantity,
      };
    });

    // Stock first: if the shop can't cover the order, nothing else should have
    // happened. This throws when a line can't be met.
    await this.reserveStock(orderItems);

    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let order;
    try {
      order = await this.insertWithOrderNumber({
        customer,
        items: orderItems,
        deliveryArea: area ? { area: area._id, name: area.name, price: area.price } : undefined,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
      });
    } catch (error) {
      // The goods were taken off the shelf for an order that never existed.
      await this.releaseStock(orderItems);
      throw error;
    }

    // Fire-and-forget: a push failure must not fail the customer's order.
    pushService
      .broadcast({
        title: "طلب جديد 🛒",
        body: `طلب من ${customer.name} بقيمة ${order.total} جنيه`,
        url: `/dashboard/orders/${order.id}`,
      })
      .catch((error) => console.error("Order push notification failed:", error));

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await Order.findById(id);
    if (!order) throw ApiError.notFound("الطلب غير موجود");

    const wasCancelled = order.status === "cancelled";
    const isCancelling = status === "cancelled";

    if (isCancelling && !wasCancelled) {
      // Returning stock on cancellation keeps inventory honest without a separate job.
      await this.releaseStock(order.items);
    } else if (wasCancelled && !isCancelling) {
      // Reinstating a cancelled order has to take its stock back, or the shop goes on
      // counting goods it has already promised away. This one can legitimately fail:
      // what was returned to the shelf may have sold in the meantime, and the staff
      // member needs to hear that rather than quietly oversell.
      await this.reserveStock(order.items);
    }

    order.status = status;
    await order.save();
    return order;
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    const order = await Order.findByIdAndUpdate(id, { paymentStatus }, { new: true });
    if (!order) throw ApiError.notFound("الطلب غير موجود");
    return order;
  }

  async stats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, deliveredOrders, revenueAgg] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "delivered" }),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    return {
      todayOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: revenueAgg[0]?.total ?? 0,
    };
  }

  private mergeLines(items: CreateOrderInput["items"]) {
    const totals = new Map<string, number>();

    for (const item of items) {
      if (!Number.isFinite(item.quantity) || item.quantity < 1) {
        throw ApiError.badRequest("الكمية يجب أن تكون 1 على الأقل");
      }

      totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
    }

    return [...totals].map(([productId, quantity]) => ({ productId, quantity }));
  }

  private async reserveStock(items: StockLine[]) {
    const taken: StockLine[] = [];

    for (const item of items) {
      const result = await Product.updateOne(
        { _id: item.product, isAvailable: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );

      // No match means the product sold out, went unavailable, or was deleted
      // between the cart being priced and this line being reserved.
      if (result.modifiedCount !== 1) {
        await this.releaseStock(taken);
        throw ApiError.badRequest(`الكمية المطلوبة من "${item.name}" غير متوفرة`);
      }

      taken.push(item);
    }
  }

  /** Puts quantities back — a cancelled order, or one that failed part-way through. */
  private async releaseStock(items: StockLine[]) {
    await Promise.all(
      items.map((item) =>
        Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } })
      )
    );
  }

  private async insertWithOrderNumber(fields: Omit<NewOrder, "orderNumber">) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await Order.create({ ...fields, orderNumber: await this.generateOrderNumber() });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000 || attempt === 5) throw error;
      }
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const datePart =
      String(now.getFullYear() % 100).padStart(2, "0") +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");

    const latest = await Order.findOne({ orderNumber: new RegExp(`^AB-${datePart}-`) })
      .sort({ orderNumber: -1 })
      .select("orderNumber")
      .lean<{ orderNumber: string } | null>();

    const sequence = latest ? Number(latest.orderNumber.slice(-4)) + 1 : 1;
    return `AB-${datePart}-${String(sequence).padStart(4, "0")}`;
  }
}

export const orderService = new OrderService();
