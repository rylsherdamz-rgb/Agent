import { Request, Response, NextFunction } from 'express';

export function authMiddleware(expectedToken: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const token = authHeader.substring(7);

    if (token !== expectedToken) {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }

    next();
  };
}