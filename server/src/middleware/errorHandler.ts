import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface ErrorBody {
  error: {
    message: string;
    details?: { field: string; message: string }[];
  };
}

export const notFoundHandler: RequestHandler = (req, res) => {
  const body: ErrorBody = { error: { message: `Route ${req.method} ${req.path} not found` } };
  res.status(404).json(body);
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof ZodError) {
    const body: ErrorBody = {
      error: {
        message: 'Validation failed',
        details: err.issues.map((issue) => ({
          field: issue.path.join('.') || (issue.code === 'unrecognized_keys' ? issue.keys.join(', ') : 'body'),
          message: issue.message,
        })),
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } } satisfies ErrorBody);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const body: ErrorBody = {
      error: {
        message: 'Validation failed',
        details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
      },
    };
    res.status(400).json(body);
    return;
  }

  // express.json() raises a SyntaxError with type 'entity.parse.failed' for malformed bodies.
  if (err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: { message: 'Request body must be valid JSON' } } satisfies ErrorBody);
    return;
  }

  if (err instanceof mongoose.Error.MongooseServerSelectionError || mongoose.connection.readyState !== 1) {
    console.error(err);
    res.status(503).json({ error: { message: 'Database is unavailable. Please try again later.' } } satisfies ErrorBody);
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: 'Something went wrong on the server' } } satisfies ErrorBody);
};
