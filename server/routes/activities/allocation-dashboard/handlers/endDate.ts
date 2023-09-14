import { Request, Response } from 'express'
import { Expose, plainToInstance, Type } from 'class-transformer'
import { ValidateNested, ValidationArguments } from 'class-validator'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import { convertToTitleCase, formatDate } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import DateIsSameOrAfter from '../../../../validators/dateIsSameOrAfter'
import { AllocateToActivityJourney } from '../../allocate-to-activity/journey'
import DateIsSameOrBefore from '../../../../validators/dateIsSameOrBefore'

export class EndDate {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @DateIsSameOrAfter(o => plainToInstance(SimpleDate, o.allocateJourney?.startDate)?.toRichDate(), {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const allocationStartDate = formatDate(
        plainToInstance(SimpleDate, allocateJourney?.startDate)?.toRichDate(),
        'dd-MM-yyyy',
      )
      return `Enter a date on or after the allocation start date, ${allocationStartDate}`
    },
  })
  @DateIsSameOrBefore(o => o.allocateJourney?.activity.endDate, {
    message: (args: ValidationArguments) => {
      const { allocateJourney } = args.object as { allocateJourney: AllocateToActivityJourney }
      const endDate = formatDate(new Date(allocateJourney?.activity.endDate), 'dd-MM-yyyy')
      return `Enter a date on or before the activity's scheduled end date, ${endDate}`
    },
  })
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
    const { activityId } = allocation
    const { prisonerNumber } = allocation
    const endDate = allocation.endDate ? simpleDateFromDate(new Date(allocation.endDate)) : undefined
    const prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const prisonerName = convertToTitleCase(`${prisoner.firstName} ${prisoner.lastName}`)

    res.render(`pages/activities/allocation-dashboard/end-date`, {
      endDate,
      activityId,
      allocationId,
      prisonerNumber,
      prisonerName,
      allocation,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.allocateJourney.endDate = req.body.endDate
    res.redirect('reason')
  }
}
