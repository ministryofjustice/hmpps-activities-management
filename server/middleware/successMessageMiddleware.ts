import { RequestHandler } from 'express'

export default function checkForSuccessMessages(): RequestHandler {
  return (req, res, next) => {
    if (req.method === 'GET') {
      const successMessage = req.flash('successMessage')[0]

      if (successMessage) {
        res.locals.successMessage = JSON.parse(successMessage)
      }
    }
    next()
  }
}
