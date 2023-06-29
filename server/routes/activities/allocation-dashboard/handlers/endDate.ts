import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import { convertToTitleCase, formatDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import DateIsAfterOtherProperty from '../../../../validators/dateIsAfterOtherProperty'
import { AllocationUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class EndDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid end date' })
  @IsValidDate({ message: 'Enter a valid end date' })
  @DateIsAfterOtherProperty('startDate', { message: 'Enter a date after the start date' })
  endDate: SimpleDate

  @Expose()
  startDate: string
}

export default class EndDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params
    const allocation = await this.activitiesService.getAllocation(+allocationId, user)
    const { scheduleId } = allocation
    const { prisonerNumber } = allocation
    const endDate = allocation.endDate ? simpleDateFromDate(new Date(allocation.endDate)) : undefined
    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    res.render(`pages/activities/allocation-dashboard/end-date`, {
      endDate,
      startDate: allocation.startDate,
      scheduleId,
      allocationId,
      prisonerNumber,
      prisonerName,
      activitySummary: allocation.activitySummary,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (!req.session.allocateJourney.endDate) {
      req.session.allocateJourney.endDate = req.body.endDate
      res.redirectOrReturn('reason')
    } else {
      const { allocationId } = req.params
      const { endDate } = req.body
      req.session.allocateJourney.endDate = req.body.endDate
      const { prisonerNumber } = req.session.allocateJourney.inmate
      const { scheduleId } = req.session.allocateJourney.activity
      const { user } = res.locals
      const prisonCode = user.activeCaseLoadId
      const allocation = {
        endDate: formatDate(plainToInstance(SimpleDate, endDate).toRichDate(), 'yyyy-MM-dd'),
      } as AllocationUpdateRequest
      await this.activitiesService.updateAllocation(prisonCode, +allocationId, allocation)
      const successMessage = `We've updated the end date for this allocation`
      res.redirectOrReturnWithSuccess(
        `/activities/allocation-dashboard/${scheduleId}/check-allocation/${prisonerNumber}`,
        'Allocation updated',
        successMessage,
      )
    }
  }
}
