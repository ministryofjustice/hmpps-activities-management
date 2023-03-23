import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'

export class BankHolidayOption {
  @Expose()
  @IsNotEmpty({ message: 'Choose whether you want the schedule to run on a bank holiday.' })
  runsOnBankHoliday: boolean
}

export default class BankHolidayOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/create-an-activity/bank-holiday-option')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.createJourney.runsOnBankHoliday = req.body.runsOnBankHoliday === 'yes'
    res.redirectOrReturn(`location`)
  }
}
