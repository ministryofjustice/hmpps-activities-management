import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'
import UnlockListService from '../../../services/unlockListService'
import logger from '../../../../logger'

export default class PlannedEventsRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly unlockListService: UnlockListService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { datePresetOption, date, slot, locations } = req.query
    const locationGroups: string[] = typeof locations === 'string' ? locations?.split(',') : []

    const unlockList = await this.unlockListService.getUnlockListForLocationGroups(
      locationGroups,
      date.toString(),
      slot.toString(),
      user,
    )

    logger.info(`datePresetOption ${datePresetOption} date ${date} slot ${slot}`)
    logger.info(`${JSON.stringify(unlockList)}`)

    res.render('pages/unlock-list/planned-events', {
      unlockList,
      plannedDatePresetOption: datePresetOption,
      plannedDate: date,
      plannedSlot: slot,
      plannedLocations: locationGroups,
    })
  }
}
