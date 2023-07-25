import type { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

export default function appointmentStartNewJourney(replaceUrl: string) {
  return (req: Request, res: Response): void => {
    // This code generates and inserts a journeyId uuid/guid into the original URL. As long as all subsequent redirects
    // are relative, this journeyId remains in the URL for the complete journey allowing it to be associated with
    // per-journey session data. See populateJourney.ts for how this journeyId parameter is used
    if (replaceUrl) {
      return res.redirect(req.originalUrl.replace(replaceUrl, `${replaceUrl}${uuidv4()}/`))
    }

    return res.redirect(req.originalUrl)
  }
}
