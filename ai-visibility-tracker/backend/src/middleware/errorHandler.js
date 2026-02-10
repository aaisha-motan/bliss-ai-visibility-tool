import logger from '../utils/logger.js';
import config from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err, req, res, next) {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'A record with this value already exists',
      code: 'DUPLICATE_ENTRY',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  // Operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  // Unknown errors
  const statusCode = err.statusCode || 500;
  const message = config.nodeEnv === 'development'
    ? err.message
    : 'An unexpected error occurred';

  res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_ERROR',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
  });
}

export default errorHandler;
