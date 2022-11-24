import { Request, Response } from 'express'
import { addMonths } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'

export default class CalendarSpikeRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate as string) : new Date()
    const { user } = res.locals

    const activities = await this.activitiesService
      .getScheduledEvents('A5193DY', referenceDate, addMonths(referenceDate, 1), user)
      .then(events =>
        events.map(e => ({
          start: new Date(`${e.date} ${e.startTime}`),
          end: new Date(`${e.date} ${e.endTime}`),
          description: `${e.eventTypeDesc} ${e.details ? `- ${e.details}` : ''}`,
          priority: e.priority,
        })),
      )

    res.render('pages/spikes/calendarSpike', { referenceDate, activities })
  }
}
