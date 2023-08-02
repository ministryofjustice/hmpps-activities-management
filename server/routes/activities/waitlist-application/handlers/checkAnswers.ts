import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import SimpleDate from '../../../../commonValidationTypes/simpleDate'

export default class CheckAnswersRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { prisoner, requestDate, activity, requester, comment, status } = req.session.waitListApplicationJourney

    return res.render(`pages/activities/waitlist-application/check-answers`, {
      prisoner,
      requestDate: plainToInstance(SimpleDate, requestDate).toRichDate(),
      activityName: activity.activityName,
      requester,
      comment,
      status,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // TODO: Add API integration here to POST the waitlist application
    return res.redirect(`confirmation`)
  }
}
