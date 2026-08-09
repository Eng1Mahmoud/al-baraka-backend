import { Response } from "express";
import { authService } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { AuthRequest } from "../types/index.js";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // Frontend (Vercel) and API (Render) are on different domains, so the cookie must be cross-site.
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: THIRTY_DAYS,
};

export const login = asyncHandler(async (req, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest("البريد الإلكتروني وكلمة المرور مطلوبان");

  const { token, user } = await authService.login(email, password);
  res.cookie("token", token, cookieOptions);
  res.json({ user, token });
});

export const logout = asyncHandler(async (_req, res: Response) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ message: "تم تسجيل الخروج" });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await authService.getProfile(req.user!.id));
});

