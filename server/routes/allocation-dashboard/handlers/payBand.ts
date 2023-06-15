import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { Min } from 'class-validator'
import _ from 'lodash'
import ActivitiesService from '../../../services/activitiesService'
import { convertToTitleCase } from '../../../utils/utils'
import PrisonService from '../../../services/prisonService'
import { AllocationUpdateRequest } from '../../../@types/activitiesAPI/types'

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
    const { scheduleId, prisonerNumber } = allocation

    const [schedule, prisoner, iepSummary] = await Promise.all([
      this.activitiesService.getActivitySchedule(scheduleId, user),
      this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user),
      this.prisonService.getPrisonerIepSummary(prisonerNumber, user),
    ])

    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    const payBands = await this.activitiesService
      .getActivity(schedule.activity.id, user)
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

    res.render('pages/allocation-dashboard/pay-band', {
      prisonerName,
      prisonerNumber: prisoner.prisonerNumber,
      incentiveLevel: iepSummary.iepLevel,
      payBands,
      scheduleId,
      allocationId,
      payBandId: allocation.payRate.prisonPayBand.id,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { payBand, allocationId, prisonerNumber, scheduleId } = req.body
    const prisonCode = user.activeCaseLoadId

    const allocation = {
      payBandId: +payBand,
    } as AllocationUpdateRequest
    await this.activitiesService.updateAllocation(prisonCode, allocationId, allocation)
    const successMessage = `We've updated the pay band for this allocation`

    res.redirectOrReturnWithSuccess(
      `/allocation-dashboard/${scheduleId}/check-allocation/${prisonerNumber}`,
      'Allocation updated',
      successMessage,
    )
  }
}
