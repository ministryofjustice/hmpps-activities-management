import { RequestHandler } from 'express'

export default function timeNowMiddleware(): RequestHandler {
  return (req, res, next) => {
    res.locals.now = new Date()
    next()
  }
}
