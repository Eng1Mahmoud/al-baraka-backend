import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PushSubscription from "../models/PushSubscription.js";
import { ApiError } from "../utils/ApiError.js";

interface AdminInput {
  name: string;
  email: string;
  password: string;
}

class AdminService {
  async list() {
    return User.find().sort({ createdAt: 1 });
  }

  async create({ name, email, password }: AdminInput) {
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) throw ApiError.conflict("هذا البريد الإلكتروني مستخدم بالفعل");

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: "admin",
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async update(id: string, data: { name?: string; email?: string }) {
    const user = await this.getEditableAdmin(id);
    Object.assign(user, data);
    await user.save();
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async remove(id: string) {
    await this.getEditableAdmin(id);
    await User.findByIdAndDelete(id);
    await PushSubscription.deleteMany({ admin: id });
  }

  /** Guards every write: the superadmin account cannot be edited or deleted from the UI. */
  private async getEditableAdmin(id: string) {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound("المستخدم غير موجود");
    if (user.role === "superadmin") {
      throw ApiError.forbidden("لا يمكن تعديل أو حذف حساب المدير العام");
    }
    return user;
  }
}

export const adminService = new AdminService();
