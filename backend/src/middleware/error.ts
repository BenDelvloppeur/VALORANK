import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/HttpError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  console.error('[unhandled error]', err);

  const status = typeof err?.status === 'number' ? err.status : 500;
  const message =
    typeof err?.message === 'string' ? err.message : 'Internal Server Error';

  res.status(status).json({ error: message });
};
