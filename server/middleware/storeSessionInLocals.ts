import express, { Router } from 'express'

export default function storeSessionInLocals(): Router {
  const router = express.Router()
  router.use((req, res, next) => {
    res.locals.session = req.session
    next()
  })
  return router
}
