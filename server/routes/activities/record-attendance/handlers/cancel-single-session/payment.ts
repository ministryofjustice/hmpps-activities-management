import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

enum IssuePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class SessionPaySingleForm {
  @Expose()
  @IsIn(Object.values(IssuePayOptions), {
    message: 'Select if people should be paid for this cancelled session',
  })
  issuePayOption: string
}

export default class CancelSingleSessionPayRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/record-attendance/cancel-single-session/payment', {
      activityName: req.journeyData.recordAttendanceJourney.sessionCancellationSingle.activityName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.recordAttendanceJourney.sessionCancellationSingle.issuePayment = req.body.issuePayOption === 'yes'
    return res.redirect(`check-answers`)
  }
}
