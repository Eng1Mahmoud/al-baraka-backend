import { Response } from "express";
import { settingsService } from "../services/settingsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSettings = asyncHandler(async (_req, res: Response) => {
  res.json(await settingsService.get());
});

export const updateSettings = asyncHandler(async (req, res: Response) => {
  const allowed = ["storeName", "storePhone", "workingHours", "units"] as const;
  const patch = Object.fromEntries(
    allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]])
  );

  res.json(await settingsService.update(patch));
});
