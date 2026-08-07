/** Error carrying an HTTP status, thrown by services and translated by the error handler. */
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }
  static unauthorized(message = "غير مصرح") {
    return new ApiError(401, message);
  }
  static forbidden(message = "ليس لديك صلاحية لهذا الإجراء") {
    return new ApiError(403, message);
  }
  static notFound(message = "العنصر غير موجود") {
    return new ApiError(404, message);
  }
  static conflict(message: string) {
    return new ApiError(409, message);
  }
}
