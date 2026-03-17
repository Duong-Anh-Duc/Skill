import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
};
