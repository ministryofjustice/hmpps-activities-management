import express, { Router } from 'express'

export default function setUpWebRequestParsing(): Router {
  const router = express.Router()
  router.use(express.json())
  router.use(express.urlencoded({ extended: true, parameterLimit: 2500 }))
  return router
}
