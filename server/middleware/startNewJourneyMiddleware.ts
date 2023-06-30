import type { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

export default function startNewJourney(replaceUrl: string) {
  return (req: Request, res: Response): void => {
    return res.redirect(req.originalUrl.replace(replaceUrl, `${replaceUrl}${uuidv4()}/`))
  }
}
