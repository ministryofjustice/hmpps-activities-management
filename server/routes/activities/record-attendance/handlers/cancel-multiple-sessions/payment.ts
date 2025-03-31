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
    message: 'Confirm if you would like payment to be issued for these sessions',
  })
  issuePayOption: string
}
export default class CancelMultipleSessionsPayRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/record-attendance/cancel-multiple-sessions/payment')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.recordAttendanceJourney.sessionCancellationMultiple.issuePayment = req.body.issuePayOption === 'yes'
    return res.redirect(`check-answers`)
  }
}
