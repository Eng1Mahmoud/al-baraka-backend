import Product from "../models/Product.js";
import DeliveryArea from "../models/DeliveryArea.js";

interface CartLine {
  productId: string;
  quantity: number;
}

/**
 * The cart lives in the customer's browser, so every total shown on the cart page
 * is re-derived here from the database. Prices, availability and stock can all
 * change while a cart sits open — this is what catches that before checkout.
 */
class CartService {
  async validate(lines: CartLine[], deliveryAreaId?: string) {
    const products = await Product.find({ _id: { $in: lines.map((line) => line.productId) } }).populate(
      "category",
      "name slug"
    );

    const items = lines.map((line) => {
      const product = products.find((candidate) => candidate.id === line.productId);

      if (!product) {
        return {
          productId: line.productId,
          quantity: line.quantity,
          removed: true,
          issue: "هذا المنتج لم يعد موجودًا",
        };
      }

      const price = product.discountPrice ?? product.price;
      const quantity = Math.max(1, Math.min(line.quantity, product.stock || line.quantity));

      let issue: string | null = null;
      if (!product.isAvailable) issue = "غير متاح حاليًا";
      else if (product.stock === 0) issue = "نفدت الكمية";
      else if (product.stock < line.quantity) issue = `المتاح ${product.stock} فقط`;

      return {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0] ?? null,
        unit: product.unit,
        price,
        originalPrice: product.discountPrice ? product.price : null,
        stock: product.stock,
        isAvailable: product.isAvailable,
        quantity,
        lineTotal: price * quantity,
        removed: false,
        issue,
      };
    });

    // Delivery is priced purely by the area the customer picks.
    const activeAreas = await DeliveryArea.countDocuments({ isActive: true });
    const requiresArea = activeAreas > 0;

    let deliveryFee = 0;
    let selectedArea: { _id: string; name: string; price: number } | null = null;

    if (requiresArea && deliveryAreaId) {
      const area = await DeliveryArea.findOne({ _id: deliveryAreaId, isActive: true });
      if (area) {
        deliveryFee = area.price;
        selectedArea = { _id: area.id, name: area.name, price: area.price };
      }
    }

    const orderable = items.filter((item) => !item.removed && !item.issue);
    const subtotal = orderable.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);

    return {
      items,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      requiresArea,
      selectedArea,
      /**
       * Whether the cart may proceed to checkout. Every line has to be orderable,
       * not just one: an order is created all-or-nothing, so letting a cart with a
       * sold-out line through only walks the customer to a rejection at the end of
       * the checkout form. The cart page already flags which line to fix.
       *
       * The area is deliberately not part of it — it's chosen on the checkout page
       * itself, and enforced there by the form and again by the server when the
       * order is created.
       */
      canCheckout: orderable.length > 0 && orderable.length === items.length,
    };
  }
}

export const cartService = new CartService();
