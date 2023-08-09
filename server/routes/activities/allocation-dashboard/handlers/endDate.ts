import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import { convertToTitleCase } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import DateIsSameOrAfterOtherProperty from '../../../../validators/dateIsSameOrAfterOtherProperty'

export class EndDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrAfterOtherProperty('startDate', { message: 'Enter a date on or after the start date' })
  @IsValidDate({ message: 'Enter a valid end date' })
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
    req.session.allocateJourney.endDate = req.body.endDate
    res.redirectOrReturn('reason')
  }
}
