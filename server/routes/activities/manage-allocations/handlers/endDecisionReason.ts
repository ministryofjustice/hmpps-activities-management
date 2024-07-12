import { Request, Response } from 'express'
import { EndDecision } from '../journey'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

export default class EndDecisionRoutes {
  constructor() {}

  GET = async (req: Request, res: Response) => res.render('pages/activities/manage-allocations/end-decision')

  POST = async (req: Request, res: Response): Promise<void> => {
    const { endDecision } = req.body
    if (endDecision === EndDecision.BEFORE_START) {
      req.session.allocateJourney.endDate = formatIsoDate(new Date())
      return res.redirect(`reason`)
    }
    return res.redirect(`end-date`)
  }
}
