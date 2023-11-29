import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { AllocationUpdateRequest } from '../../../../@types/activitiesAPI/types'
import config from '../../../../config'

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

    res.render('pages/activities/manage-allocations/pay-band', {
      prisonerName: inmate.prisonerName,
      prisonerNumber: inmate.prisonerNumber,
      incentiveLevel: inmate.incentiveLevel,
      payBands,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { payBand } = req.body
    const { user } = res.locals
    const { allocationId } = req.params

    if (req.params.mode === 'edit') {
      const allocation = {
        payBandId: +payBand,
      } as AllocationUpdateRequest

      await this.activitiesService.updateAllocation(user.activeCaseLoadId, +allocationId, allocation)

      const successMessage = `You've updated the pay rate for this allocation`
      return res.redirectWithSuccess(
        `/activities/allocations/view/${allocationId}`,
        'Allocation updated',
        successMessage,
      )
    }

    const payBandDetails = (await this.getActivityPayRates(req, res)).find(b => b.bandId === payBand)

    req.session.allocateJourney.inmate.payBand = {
      id: payBandDetails.bandId,
      alias: payBandDetails.bandAlias,
      rate: payBandDetails.rate,
    }

    if (config.exclusionsFeatureToggleEnabled) {
      return res.redirectOrReturn('exclusions')
    }

    return res.redirect('check-answers')
  }

  private async getActivityPayRates(req: Request, res: Response) {
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
