import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import { IsNotEmpty, ValidateNested } from 'class-validator'
import { uniq } from 'lodash'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import IsValidDate from '../../../../validators/isValidDate'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentSearchRequest } from '../../../../@types/activitiesAPI/types'
import { toDate, toDateString } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'

export class Search {
  @Expose()
  @Type(() => SimpleDate)
  @ValidateNested()
  @IsNotEmpty({ message: 'Enter a date' })
  @IsValidDate({ message: 'Enter a valid date' })
  startDate: SimpleDate
}

export default class SearchRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startDate, timeSlot, appointmentName, locationId, prisonerNumber, createdBy } = req.query

    const simpleStartDate = simpleDateFromDate(toDate(startDate as string))

    if (!simpleStartDate) {
      return res.redirect(`?startDate=${toDateString(new Date())}`)
    }

    const request = {
      startDate: simpleStartDate.toIsoString(),
      timeSlot: timeSlot || null,
      internalLocationId: locationId ? +locationId : null,
      prisonerNumbers: prisonerNumber ? [prisonerNumber] : null,
      createdBy: createdBy && createdBy !== 'all' ? createdBy : null,
    } as AppointmentSearchRequest

    const [categories, locations, appointments] = await Promise.all([
      this.activitiesService.getAppointmentCategories(user),
      this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user),
      this.activitiesService.searchAppointments(user.activeCaseLoadId, request, user),
    ])

    const appointmentNameFilters = [
      ...categories.map(c => c.description),
      ...new Set(appointments.filter(a => a.customName).map(a => a.appointmentName)),
    ].sort()

    const results = appointmentName
      ? appointments.filter(a => a.appointmentName === appointmentName || a.category.description === appointmentName)
      : appointments

    // Get prisoner details for appointments with a single attendee
    const prisonerNumbers = results.flatMap(r => (r.attendees.length === 1 ? r.attendees[0].prisonerNumber : []))
    let prisonersDetails = {}
    if (prisonerNumbers.length > 0) {
      prisonersDetails = (await this.prisonService.searchInmatesByPrisonerNumbers(uniq(prisonerNumbers), user)).reduce(
        (prisonerMap, prisoner) => ({
          ...prisonerMap,
          [prisoner.prisonerNumber]: prisoner,
        }),
        {},
      )
    }

    return res.render('pages/appointments/search/results', {
      startDate: simpleStartDate,
      timeSlot: timeSlot ?? '',
      appointmentNameFilters,
      appointmentName: appointmentName ?? '',
      locations,
      locationId: locationId ?? '',
      prisonerNumber: prisonerNumber ?? '',
      createdBy: createdBy ?? '',
      results,
      prisonersDetails,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startDate, timeSlot, appointmentName, locationId, prisonerNumber, createdBy } = req.body

    return res.redirect(
      `?startDate=${startDate.toIsoString()}&timeSlot=${timeSlot ?? ''}&appointmentName=${
        appointmentName ?? ''
      }&locationId=${locationId ?? ''}&prisonerNumber=${prisonerNumber ?? ''}&createdBy=${createdBy ?? ''}`,
    )
  }
}
