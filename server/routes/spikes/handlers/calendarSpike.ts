import { Request, Response } from 'express'
import { format, lastDayOfMonth } from 'date-fns'
import ActivitiesService from '../../../services/activitiesService'
import { ScheduledEvent } from '../../../@types/activitiesAPI/types'

export default class CalendarSpikeRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    // Pull back events for the current month - even when today's date is near the end of the month.
    const referenceDate = req.query.referenceDate ? new Date(req.query.referenceDate as string) : new Date()
    const firstDayInMonth = new Date(format(referenceDate, 'yyyy-MM-01'))
    const lastDayInMonth = lastDayOfMonth(referenceDate)
    const { user } = res.locals
    const prisonerNumber = this.extractPrisonerNumber(req)

    try {
      const activities = await this.activitiesService
        .getScheduledEvents(prisonerNumber, firstDayInMonth, lastDayInMonth, user)
        .then(events =>
          events.map(e => ({
            start: new Date(`${e.date} ${e.startTime}`),
            end: new Date(`${e.date} ${e.endTime ? e.endTime : e.startTime}`),
            description: this.setDescriptionForEventType(e),
            comments: e.comments && e.eventType === 'APPOINTMENT' ? e.comments : '',
            priority: e.priority,
            eventSource: e.eventSource,
            eventType: e.eventType,
            locationCode: e.internalLocationCode,
            locationDescription: e.internalLocationDescription,
            categoryDescription: e.categoryDescription,
            appointmentOccurrenceId: e.eventType === 'APPOINTMENT' ? e.appointmentOccurrenceId : null,
            scheduledInstanceId: e.eventType === 'ACTIVITY' ? e.scheduledInstanceId : null,
          })),
        )

      res.render('pages/spikes/calendarSpike', { referenceDate, activities })
    } catch (e) {
      res.validationFailed('string', `Calendar for prisoner with number ${prisonerNumber} was not found`)
    }
  }

  PRISONER_SEARCH = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/spikes/calendarSpikePrisonerSearch')
  }

  private extractPrisonerNumber = (req: Request): string => {
    let prisonerNumber = req.query.prisonerNumber as string
    if (!prisonerNumber) {
      prisonerNumber = req.session.calendarSpikeJourney?.prisonerNumber
    } else {
      req.session.calendarSpikeJourney = { prisonerNumber }
    }
    return prisonerNumber
  }

  private setDescriptionForEventType = (event: ScheduledEvent): string => {
    let description = ''
    switch (event.eventType) {
      case 'COURT_HEARING':
        description = 'Court hearing'
        break
      case 'VISIT':
        description = `Visit ${event.categoryDescription}`
        break
      case 'APPOINTMENT':
        description = event.eventSource === 'NOMIS' ? `${event.summary}` : `${event.summary}`
        break
      case 'ACTIVITY':
        description = event.eventSource === 'NOMIS' ? `${event.summary}` : `${event.summary}`
        break
      case 'EXTERNAL_TRANSFER':
        description = 'External transfer'
        break
      case 'ADJUDICATION_HEARING':
        description = `Adjudication hearing ${event.categoryDescription}`
        break
      default:
        description = 'Unknown'
        break
    }
    return description
  }
}
