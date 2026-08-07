import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AuthUser } from "../types/index.js";
import { ApiError } from "../utils/ApiError.js";

class AuthService {
  private signToken(user: AuthUser): string {
    return jwt.sign(user, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN || "30d",
    } as jwt.SignOptions);
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw ApiError.unauthorized("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }

    const payload: AuthUser = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    return { token: this.signToken(payload), user: payload };
  }

  async getProfile(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("المستخدم غير موجود");
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw ApiError.notFound("المستخدم غير موجود");

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) throw ApiError.badRequest("كلمة المرور الحالية غير صحيحة");

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }
}

export const authService = new AuthService();
