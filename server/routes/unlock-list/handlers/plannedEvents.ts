import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import { toDate, formatDate } from '../../../utils/utils'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { date, slot, location } = req.query
    // Leave the possibility that multiple locations will be allowed in future - currently just one
    const locationGroups: string[] = typeof location === 'string' ? [location] : []
    const formattedDate = formatDate(toDate(date.toString()), 'cccc do LLLL y')

    const unlockListItems = await this.unlockListService.getUnlockListForLocationGroups(
      locationGroups,
      date.toString(),
      slot.toString(),
      user,
    )

    res.render('pages/unlock-list/planned-events', {
      unlockListItems,
      plannedDate: formattedDate,
      plannedSlot: slot,
    })
  }
}
