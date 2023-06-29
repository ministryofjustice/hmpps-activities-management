import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import DateIsBeforeOtherProperty from '../../../../validators/dateIsBeforeOtherProperty'
import { convertToTitleCase, formatDate } from '../../../../utils/utils'
import { AllocationUpdateRequest } from '../../../../@types/activitiesAPI/types'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'

export class StartDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a valid start date' })
  @IsValidDate({ message: 'Enter a valid start date' })
  @DateIsSameOrAfter(new Date(), { message: "Enter a date on or after today's date" })
  @DateIsBeforeOtherProperty('endDate', { message: 'Enter a date before the end date' })
  startDate: SimpleDate

  @Expose()
  endDate: string
}

export default class StartDateRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { allocationId } = req.params
    const allocation = await this.activitiesService.getAllocation(+allocationId, user)
    const { scheduleId, prisonerNumber } = allocation
    const startDate = simpleDateFromDate(new Date(allocation.startDate))
    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    res.render(`pages/activities/allocation-dashboard/start-date`, {
      startDate,
      endDate: allocation.endDate ? allocation.endDate : undefined,
      scheduleId,
      allocationId,
      prisonerNumber,
      prisonerName,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startDate, allocationId, prisonerNumber, scheduleId } = req.body
    const { user } = res.locals
    const prisonCode = user.activeCaseLoadId
    const allocation = {
      startDate: formatDate(plainToInstance(SimpleDate, startDate).toRichDate(), 'yyyy-MM-dd'),
    } as AllocationUpdateRequest
    await this.activitiesService.updateAllocation(prisonCode, allocationId, allocation)
    const successMessage = `We've updated the start date for this allocation`

    res.redirectOrReturnWithSuccess(
      `/activities/allocation-dashboard/${scheduleId}/check-allocation/${prisonerNumber}`,
      'Allocation updated',
      successMessage,
    )
  }
}
