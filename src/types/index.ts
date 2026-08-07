import { Request } from "express";

export type UserRole = "superadmin" | "admin";

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

/** Express Request augmented with the authenticated user, set by authMiddleware. */
export interface AuthRequest extends Request {
  user?: AuthUser;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid";

// --- Sirv image hosting ---
export interface SirvConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  uploadPath: string;
  tokenPath: string;
  domain: string;
}

export interface TokenResponse {
  token: string;
  expiresIn: number;
}
