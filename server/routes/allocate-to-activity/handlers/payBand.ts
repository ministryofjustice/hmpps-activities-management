import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'

export class PayBand {
  @Expose()
  @IsNotEmpty({ message: 'Select a pay band' })
  payBand: string
}

export default class PayBandRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, activity } = req.session.allocateJourney
    const { user } = res.locals

    const payBands = await this.activitiesService
      .getActivity(activity.activityId, user)
      .then(response => response.pay)
      .then(bands => bands.filter(band => !band.incentiveLevel || band.incentiveLevel === inmate.incentiveLevel))
      .then(bands =>
        bands.map(band => ({
          rate: band.rate,
          band: band.payBand,
        })),
      )

    res.render('pages/allocate-to-activity/pay-band', {
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      incentiveLevel: inmate.incentiveLevel,
      payBands,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { payBand } = req.body
    req.session.allocateJourney.inmate.payBand = payBand
    return res.redirect('check-answers')
  }
}
