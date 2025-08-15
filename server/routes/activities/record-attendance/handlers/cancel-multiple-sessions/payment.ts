import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'

enum IssuePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class SessionPayMultipleForm {
  @Expose()
  @IsIn(Object.values(IssuePayOptions), {
    message: 'Select if people should be paid for these cancelled sessions',
  })
  issuePayOption: string
}
export default class CancelMultipleSessionsPayRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/record-attendance/cancel-multiple-sessions/payment')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.journeyData.recordAttendanceJourney.sessionCancellationMultiple.issuePayment = req.body.issuePayOption === 'yes'
    return res.redirect(`check-answers`)
  }
}
