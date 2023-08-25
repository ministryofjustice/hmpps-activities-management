import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'

export class PayBand {
  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  payBand: number
}

export default class PayBandRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate } = req.session.allocateJourney

    const payBands = await this.getActivityPayRates(req, res)

    res.render('pages/activities/allocate-to-activity/pay-band', {
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      incentiveLevel: inmate.incentiveLevel,
      payBands,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { payBand } = req.body

    const payBandDetails = (await this.getActivityPayRates(req, res)).find(b => b.bandId === payBand)

    req.session.allocateJourney.inmate.payBand = {
      id: payBandDetails.bandId,
      alias: payBandDetails.bandAlias,
      rate: payBandDetails.rate,
    }
    return res.redirectOrReturn('check-answers')
  }

  async getActivityPayRates(req: Request, res: Response) {
    const { inmate, activity } = req.session.allocateJourney

    const payRates = (await this.activitiesService.getActivity(activity.activityId, res.locals.user)).pay
    return _.sortBy(payRates, 'prisonPayBand.displaySequence')
      .filter(pay => !pay.incentiveLevel || pay.incentiveLevel === inmate.incentiveLevel)
      .map(pay => ({
        bandId: pay.prisonPayBand.id,
        bandAlias: pay.prisonPayBand.alias,
        rate: pay.rate,
      }))
  }
}
