import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, slot, locations } = req.query
    const locationGroups: string[] = typeof locations === 'string' ? locations?.split(',') : []

    const unlockListItems = await this.unlockListService.getUnlockListForLocationGroups(
      locationGroups,
      date.toString(),
      slot.toString(),
      user,
    )

    res.render('pages/unlock-list/planned-events', {
      unlockListItems,
      plannedDate: date,
      plannedSlot: slot,
    })
  }
}
