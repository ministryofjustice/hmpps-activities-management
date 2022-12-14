import { Request, Response } from 'express'
import { format, lastDayOfMonth } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'

export default class CalendarSpikeRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    // Pull back events for the current month - even when today's date is near the end of the month.
    const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate as string) : new Date()
    const firstDayInMonth = new Date(format(referenceDate, 'yyyy-MM-01'))
    const lastDayInMonth = lastDayOfMonth(referenceDate)
    const { user } = res.locals

    const activities = await this.activitiesService
      .getScheduledEvents('G4793VF', firstDayInMonth, lastDayInMonth, user)
      .then(events =>
        events.map(e => ({
          start: new Date(`${e.date} ${e.startTime}`),
          end: new Date(`${e.date} ${e.endTime ? e.endTime : e.startTime}`),
          description: `${e.eventTypeDesc ? e.eventTypeDesc : 'Court hearing'} ${e.details ? `- ${e.details}` : ''}`,
          priority: e.priority,
        })),
      )

    res.render('pages/spikes/calendarSpike', { referenceDate, activities })
  }
}
