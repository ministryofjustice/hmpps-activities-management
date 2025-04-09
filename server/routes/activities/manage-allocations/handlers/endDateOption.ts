import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import config from '../../../../config'

export class EndDateOption {
  @Expose()
  @IsNotEmpty({ message: 'Select if you want to enter an end date or not' })
  endDateOption: string
}

export default class EndDateOptionRoutes {
  GET = async (req: Request, res: Response): Promise<void> =>
    res.render('pages/activities/manage-allocations/end-date-option')

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.body.endDateOption === 'yes') {
      return res.redirectOrReturn(`end-date`)
    }

    if (req.session.allocateJourney.activity.paid) {
      if (req.session.allocateJourney.allocateMultipleInmatesMode && config.multiplePrisonerActivityAllocationEnabled) {
        return res.redirectOrReturn('multiple/pay-band-multiple')
      }
      return res.redirectOrReturn(`pay-band`)
    }

    if (req.session.allocateJourney.allocateMultipleInmatesMode && config.multiplePrisonerActivityAllocationEnabled) {
      return res.redirectOrReturn('multiple/pay-band-multiple')
    }
    return res.redirectOrReturn('exclusions')
  }
}
