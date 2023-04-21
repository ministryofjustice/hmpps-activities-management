import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { AppointmentOccurrenceSearchRequest } from '../../../../@types/activitiesAPI/types'

export default class SearchRoutes {
  constructor(private readonly activitiesService: ActivitiesService, private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const categories = await this.activitiesService.getAppointmentCategories(user)
    const locations = await this.activitiesService.getAppointmentLocations(user.activeCaseLoadId, user)

    const request = {} as AppointmentOccurrenceSearchRequest

    const results = await this.activitiesService.searchAppointmentOccurrences(user.activeCaseLoadId, request, user)

    res.render('pages/appointments/search/results', { categories, locations, results })
  }
}
