import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { uniq } from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentSearchRequest } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { datePickerDateToIsoDate, formatIsoDate, isValidIsoDate } from '../../../../utils/datePickerUtils'
import IsValidDatePickerDate from '../../../../validators/isValidDatePickerDate'
import { asString } from '../../../../utils/utils'

export class Search {
  @Expose()
  @IsNotEmpty({ message: 'Enter a date' })
  @IsValidDatePickerDate({ message: 'Enter a valid date' })
  startDate: string
}

export default class SearchRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startDate, timeSlot, appointmentName, locationId, prisonerNumber, createdBy } = req.query

    if (!isValidIsoDate(startDate as string)) {
      return res.redirect(`?startDate=${formatIsoDate(new Date())}`)
    }

    const request = {
      startDate,
      timeSlot: timeSlot || null,
      internalLocationId: locationId ? +locationId : null,
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

    let results = appointments
    if (appointmentName) {
      results = results.filter(a => a.appointmentName === appointmentName || a.category.description === appointmentName)
    }
    if (prisonerNumber) {
      const prisonerNumberFilterText = asString(prisonerNumber).toLowerCase()
      results = results.filter(app =>
        app.attendees.find(a => a.prisonerNumber.toLowerCase().includes(prisonerNumberFilterText)),
      )
    }

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
      startDate,
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
      `?startDate=${datePickerDateToIsoDate(startDate)}&timeSlot=${timeSlot ?? ''}&appointmentName=${
        appointmentName ?? ''
      }&locationId=${locationId ?? ''}&prisonerNumber=${prisonerNumber ?? ''}&createdBy=${createdBy ?? ''}`,
    )
  }
}
