import { Request, Response } from 'express'
import ActivitiesService from '../../../services/activitiesService'

export default class PannedEventsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { datePresetOption, date, slot, locations } = req.query
    const selectedLocations: string[] = typeof locations === 'string' ? locations?.split(',') : []

    res.render('pages/unlock-list/planned-events', {
      plannedDatePresetOption: datePresetOption,
      plannedDate: date,
      plannedSlot: slot,
      plannedLocations: selectedLocations,
    })
  }
}
