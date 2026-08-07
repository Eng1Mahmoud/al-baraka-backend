import { Request, Response, NextFunction, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";

/**
 * Wraps an async controller so rejected promises reach the error middleware.
 * Generic over route params so controllers can read `req.params.id` as a plain
 * string: `asyncHandler<IdParam>(...)`.
 */
export const asyncHandler =
  <P = ParamsDictionary>(
    fn: (req: Request<P>, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler<P> =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Route param shape shared by every `/:id` endpoint. */
export type IdParam = { id: string };
