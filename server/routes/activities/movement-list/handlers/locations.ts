import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class LocationsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const locationsWithEvents = await this.activitiesService.getLocationsWithEvents(user)

    res.render('pages/activities/movement-list/locations', { locationsWithEvents })
  }
}
