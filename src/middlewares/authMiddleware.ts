import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, AuthUser, UserRole } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";

/** Reads the JWT from the httpOnly cookie (or Authorization header) and attaches req.user. */
export const protect = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.token || bearer;

  if (!token) {
    return next(ApiError.unauthorized("يجب تسجيل الدخول"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    req.user = decoded;
    return next();
  } catch {
    return next(ApiError.unauthorized("جلسة غير صالحة، سجل الدخول مرة أخرى"));
  }
};

/** Restricts a route to the given roles. Use after `protect`. */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    return next();
  };
