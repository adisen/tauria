import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

module.exports = function (req: Request, res: Response, next: NextFunction) {
  // Get token from header
  const token = req.header('x-auth-token')

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token authorization denied' })
  }

  // Verify token
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded.user
    next()
  } catch (error) {
    res.status(401).json({ msg: 'Token is not valid' })
  }
}
