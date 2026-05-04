import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { HttpError } from '../utils/HttpError.js';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
  username: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Vérifie le JWT Supabase (HS256 legacy ou asymétrique nouveau format)
// via supabaseAdmin.auth.getUser, puis charge l'utilisateur applicatif depuis Prisma.
export function requireAuth({ optional = false }: { optional?: boolean } = {}) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        if (optional) return next();
        throw HttpError.unauthorized('Token manquant');
      }

      const token = header.slice('Bearer '.length).trim();

      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) {
        throw HttpError.unauthorized('Token invalide');
      }

      const supabaseUserId = data.user.id;
      const email = data.user.email ?? '';

      const user = await prisma.user.findUnique({
        where: { id: supabaseUserId },
      });

      if (!user) {
        // L'utilisateur Supabase existe mais n'a pas encore appelé /auth/sync :
        // on expose juste l'identité du token pour permettre cet appel.
        req.user = {
          id: supabaseUserId,
          email,
          role: 'CLIENT',
          username: '',
        };
        return next();
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      };
      next();
    } catch (err) {
      if (err instanceof HttpError) return next(err);
      next(HttpError.unauthorized('Token invalide'));
    }
  };
}
