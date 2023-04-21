import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { AppointmentOccurrenceSearchRequest } from '../../../../@types/activitiesAPI/types'
import { toDate, toDateString } from '../../../../utils/utils'
import { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'

export default class SearchRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { startDate, timeSlot, categoryCode, locationId } = req.query

    if (!isValid(toDate(startDate as string))) {
      return res.redirect(`?startDate=${toDateString(new Date())}`)
    }

    const simpleStartDate = simpleDateFromDate(toDate(startDate as string))

    const categories = await this.activitiesService.getAppointmentCategories(user)
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    const request = {
      startDate: simpleStartDate.toIsoString(),
      timeSlot,
      categoryCode,
      locationId,
    } as AppointmentOccurrenceSearchRequest

    const results = await this.activitiesService.searchAppointmentOccurrences(user.activeCaseLoadId, request, user)

    return res.render('pages/appointments/search/results', {
      startDate: simpleStartDate,
      categories,
      categoryCode,
      locations,
      locationId,
      results,
    })
  }
}
