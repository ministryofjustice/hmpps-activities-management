import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { convertToTitleCase } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'
import { AllocationUpdateRequest } from '../../../../@types/activitiesAPI/types'
import { IepSummary } from '../../../../@types/incentivesApi/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

export class PayBand {
  @Expose()
  @Type(() => Number)
  @Min(1, { message: 'Select a pay band' })
  payBand: number
}

export default class PayBandRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params
    const allocation = await this.activitiesService.getAllocation(+allocationId, user)
    const { activityId, prisonerNumber } = allocation

    const [prisoner, iepSummary]: [Prisoner, IepSummary] = await Promise.all([
      this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user),
      this.prisonService.getPrisonerIepSummary(prisonerNumber, user),
    ])

    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    const payBands = await this.activitiesService
      .getActivity(activityId, user)
      .then(response => response.pay)
      .then(bands => bands.filter(band => !band.incentiveLevel || band.incentiveLevel === iepSummary.iepLevel))
      .then(bands => _.sortBy(bands, 'prisonPayBand.displaySequence'))
      .then(bands =>
        bands.map(band => ({
          bandId: band.prisonPayBand.id,
          bandAlias: band.prisonPayBand.alias,
          rate: band.rate,
        })),
      )

    res.render('pages/activities/allocation-dashboard/pay-band', {
      prisonerName,
      prisonerNumber: prisoner.prisonerNumber,
      incentiveLevel: iepSummary.iepLevel,
      payBands,
      activityId,
      allocationId,
      payBandId: allocation.prisonPayBand.id,
      allocation,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payBand, allocationId, prisonerNumber, activityId } = req.body
    const prisonCode = user.activeCaseLoadId

    const allocation = {
      payBandId: +payBand,
    } as AllocationUpdateRequest
    await this.activitiesService.updateAllocation(prisonCode, allocationId, allocation)
    const successMessage = `We've updated the pay rate for this allocation`

    res.redirectWithSuccess(
      `/activities/allocation-dashboard/${activityId}/check-allocation/${prisonerNumber}`,
      'Allocation updated',
      successMessage,
    )
  }
}
