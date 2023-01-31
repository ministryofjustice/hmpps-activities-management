import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import _ from 'lodash'
import ActivitiesService from '../../../services/activitiesService'

export class PayBand {
  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  payBand: number
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
      .then(bands => _.sortBy(bands, 'prisonPayBand.displaySequence'))
      .then(bands =>
        bands.map(band => ({
          bandId: band.prisonPayBand.id,
          bandAlias: band.prisonPayBand.alias,
          rate: band.rate,
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
    const { user } = res.locals
    const { payBand } = req.body

    const band = await this.activitiesService
      .getPayBandsForPrison(user)
      .then(bands => bands.find(b => b.id === payBand))

    req.session.allocateJourney.inmate.payBand = {
      id: band.id,
      alias: band.alias,
    }
    return res.redirectOrReturn('check-answers')
  }
}
