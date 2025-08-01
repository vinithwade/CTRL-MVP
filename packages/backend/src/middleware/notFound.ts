import { Request, Response, NextFunction } from 'express'

interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as AppError
  error.statusCode = 404
  next(error)
} 