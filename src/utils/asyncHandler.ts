import { Request, Response, NextFunction, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";

export const asyncHandler =
  <P = ParamsDictionary>(
    fn: (req: Request<P>, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler<P> =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/** Route param shape shared by every `/:id` endpoint. */
export type IdParam = { id: string };
