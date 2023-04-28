import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import { isValid } from 'date-fns'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { AppointmentOccurrenceSearchRequest } from '../../../../@types/activitiesAPI/types'
import { toDate, toDateString } from '../../../../utils/utils'

export class Search {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a start date' })
  @IsValidDate({ message: 'Enter a valid start date' })
  startDate: SimpleDate

  @Expose()
  @Type(() => SimpleDate)
  endDate: SimpleDate
}

export default class SearchRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startDate, endDate, timeSlot, categoryCode, locationId, prisonerNumber, createdBy, type } = req.query

    if (!isValid(toDate(startDate as string))) {
      return res.redirect(`?startDate=${toDateString(new Date())}`)
    }

    const simpleStartDate = simpleDateFromDate(toDate(startDate as string))
    const simpleEndDate =
      endDate && isValid(toDate(endDate as string)) ? simpleDateFromDate(toDate(endDate as string)) : null

    const categories = await this.activitiesService.getAppointmentCategories(user)
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    const request = {
      appointmentType: !type || type === '' ? null : type,
      startDate: simpleStartDate.toIsoString(),
      endDate: !simpleEndDate ? null : simpleEndDate?.toIsoString(),
      timeSlot: !timeSlot || timeSlot === '' ? null : timeSlot,
      categoryCode: !categoryCode || categoryCode === '' ? null : categoryCode,
      internalLocationId: !locationId || locationId === '' ? null : +locationId,
      prisonerNumbers: !prisonerNumber || prisonerNumber === '' ? null : [prisonerNumber],
      createdBy: !createdBy || createdBy === '' || createdBy === 'all' ? null : createdBy,
    } as AppointmentOccurrenceSearchRequest

    const results = await this.activitiesService.searchAppointmentOccurrences(user.activeCaseLoadId, request, user)

    return res.render('pages/appointments/search/results', {
      startDate: simpleStartDate,
      endDate: simpleEndDate,
      timeSlot,
      categories,
      categoryCode,
      locations,
      locationId,
      prisonerNumber,
      createdBy,
      type,
      results,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate, timeSlot, categoryCode, locationId, prisonerNumber, createdBy, type } = req.body

    return res.redirect(
      `?startDate=${startDate.toIsoString()}&endDate=${
        isValid(endDate.toRichDate()) ? endDate.toIsoString() : ''
      }&timeSlot=${timeSlot ?? ''}&categoryCode=${categoryCode ?? ''}&locationId=${
        locationId ?? ''
      }&prisonerNumber=${prisonerNumber}&createdBy=${createdBy ?? ''}&type=${type ?? ''}`,
    )
  }
}
