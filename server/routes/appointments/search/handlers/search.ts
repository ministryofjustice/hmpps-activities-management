import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { uniq } from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentSearchRequest } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { formatIsoDate, isValidIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import { asString, convertToArray } from '../../../../utils/utils'
import IsValidDate from '../../../../validators/isValidDate'

export class Search {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsNotEmpty({ message: 'Enter a date' })
  @IsValidDate({ message: 'Enter a valid date' })
  startDate: Date
}

export default class SearchRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startDate, timeSlots, appointmentName, locationId, prisonerNumber, createdBy } = req.query

    if (!isValidIsoDate(startDate as string)) {
      return res.redirect(`?startDate=${formatIsoDate(new Date())}`)
    }

    const selectedTimeSlots = asString(timeSlots).length > 0 ? asString(timeSlots).split(',') : []

    const searchRequest = {
      startDate,
      timeSlots: selectedTimeSlots,
      dpsLocationId: locationId,
      createdBy: createdBy && createdBy !== 'all' ? createdBy : null,
    } as AppointmentSearchRequest

    const [categories, locations, appointments] = await Promise.all([
      this.activitiesService.getAppointmentCategories(user),
      this.activitiesService
        .getAppointmentLocations(user.activeCaseLoadId, user)
        .then(appointmentLocations => appointmentLocations.sort((a, b) => a.description.localeCompare(b.description))),
      this.activitiesService.searchAppointments(user.activeCaseLoadId, searchRequest, user),
    ])

    const appointmentNameFilters = [
      ...categories.map(category => category.description),
      ...new Set(
        appointments.filter(appointment => appointment.customName).map(appointment => appointment.appointmentName),
      ),
    ].sort()

    let results = appointments

    if (appointmentName) {
      results = results.filter(
        appointment =>
          appointment.appointmentName === appointmentName || appointment.category.description === appointmentName,
      )
    }

    if (prisonerNumber) {
      const prisonerNumberFilterText = asString(prisonerNumber).toLowerCase()

      results = results.filter(appointment =>
        appointment.attendees.some(attendee =>
          attendee.prisonerNumber.toLowerCase().includes(prisonerNumberFilterText),
        ),
      )
    }

    // Get prisoner details for appointments with a single attendee
    const prisonerNumbers = results
      .filter(result => result.attendees.length === 1)
      .map(result => result.attendees[0].prisonerNumber)

    let prisonersDetails = {}

    if (prisonerNumbers.length > 0) {
      const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(uniq(prisonerNumbers), user)

      prisonersDetails = prisoners.reduce(
        (prisonerMap, prisoner) => ({
          ...prisonerMap,
          [prisoner.prisonerNumber]: prisoner,
        }),
        {},
      )
    }

    return res.render('pages/appointments/search/results', {
      startDate,
      timeSlots: selectedTimeSlots,
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
    const { startDate, timeSlots, appointmentName, locationId, prisonerNumber, createdBy } = req.body

    const selectedTimeSlots = convertToArray(timeSlots) ?? ''

    const redirectUrl =
      `?startDate=${formatIsoDate(startDate)}` +
      `&timeSlots=${selectedTimeSlots}` +
      `&appointmentName=${appointmentName ?? ''}` +
      `&locationId=${locationId ?? ''}` +
      `&prisonerNumber=${prisonerNumber ?? ''}` +
      `&createdBy=${createdBy ?? ''}`

    return res.redirect(redirectUrl)
  }
}
