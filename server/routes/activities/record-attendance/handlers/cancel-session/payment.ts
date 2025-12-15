import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

enum IssuePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class CancelSessionPayForm {
  @Expose()
  @IsIn(Object.values(IssuePayOptions), {
    message: 'Select if people should be paid for this cancelled session',
  })
  issuePayOption: string
}

export default class CancelSessionPayRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/activities/record-attendance/cancel-session/payment', {
      activityName: req.journeyData.recordAttendanceJourney.sessionCancellation.activityName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.recordAttendanceJourney.sessionCancellation.issuePayment = req.body.issuePayOption === 'yes'
    return res.redirect('confirm')
  }
}
