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
}

export default class SearchRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startDate, timeSlot, categoryCode, locationId, prisonerNumber, createdBy, type } = req.query

    if (!isValid(toDate(startDate as string))) {
      return res.redirect(`?startDate=${toDateString(new Date())}`)
    }

    const simpleStartDate = simpleDateFromDate(toDate(startDate as string))

    const categories = await this.activitiesService.getAppointmentCategories(user)
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    const request = {
      appointmentType: type && type !== '' ? type : null,
      startDate: simpleStartDate.toIsoString(),
      timeSlot: timeSlot && timeSlot !== '' ? timeSlot : null,
      categoryCode: categoryCode && categoryCode !== '' ? categoryCode : null,
      internalLocationId: locationId && locationId !== '' ? +locationId : null,
      prisonerNumbers: prisonerNumber && prisonerNumber !== '' ? [prisonerNumber] : null,
      createdBy: createdBy && createdBy !== '' && createdBy !== 'all' ? createdBy : null,
    } as AppointmentOccurrenceSearchRequest

    const results = await this.activitiesService.searchAppointmentOccurrences(user.activeCaseLoadId, request, user)

    return res.render('pages/appointments/search/results', {
      startDate: simpleStartDate,
      timeSlot: timeSlot ?? '',
      categories,
      categoryCode: categoryCode ?? '',
      locations,
      locationId: locationId ?? '',
      prisonerNumber: prisonerNumber ?? '',
      createdBy: createdBy ?? '',
      type: type ?? '',
      results,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startDate, timeSlot, categoryCode, locationId, prisonerNumber, createdBy, type } = req.body

    return res.redirect(
      `?startDate=${startDate.toIsoString()}&timeSlot=${timeSlot ?? ''}&categoryCode=${categoryCode ?? ''}&locationId=${
        locationId ?? ''
      }&prisonerNumber=${prisonerNumber}&createdBy=${createdBy ?? ''}&type=${type ?? ''}`,
    )
  }
}
