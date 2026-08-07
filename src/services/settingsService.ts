import Settings, { ISettings } from "../models/Settings.js";

class SettingsService {
  /** Always returns the single settings document, creating it with defaults on first call. */
  async get(): Promise<ISettings> {
    const existing = await Settings.findOne();
    if (existing) return existing;
    return Settings.create({});
  }

  async update(data: Partial<ISettings>) {
    const settings = await this.get();
    Object.assign(settings, data);
    await settings.save();
    return settings;
  }
}

export const settingsService = new SettingsService();
