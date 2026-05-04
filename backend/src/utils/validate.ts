import type { NextFunction, Request, Response } from 'express';
import { z, ZodError, type ZodTypeAny } from 'zod';
import { HttpError } from './HttpError.js';

type Source = 'body' | 'query' | 'params';

// Middleware générique qui valide une partie de la requête avec un schéma Zod
// puis remplace req[source] par la valeur parsée.
export function validate<S extends ZodTypeAny>(schema: S, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      (req as unknown as Record<Source, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(HttpError.badRequest('Validation échouée', err.flatten()));
      } else {
        next(err);
      }
    }
  };
}

export { z };
