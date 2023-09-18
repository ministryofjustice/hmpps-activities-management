import { Request, Response } from 'express'
import { simpleDateFromDateOption } from '../../../../commonValidationTypes/simpleDate'
import DateOption from '../../../../enum/dateOption'
import { MovementListItem } from '../../../../@types/activities'

export default class LocationEventsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { locationIds, dateOption, date, timeSlot } = req.query

    const simpleDate = simpleDateFromDateOption(dateOption as DateOption, date as string)
    if (!simpleDate || !(locationIds as string)) {
      return res.redirect(`choose-details`)
    }

    // TODO: replace with filtered await this.activitiesService.getLocationsWithEvents(user) when implemented
    const locations = (locationIds as string).split(',').map(id => ({
      id,
      description: `Test location ${id}`,
    }))

    // TODO: replace with await this.activitiesService.getLocationEvents(user) when implemented
    const locationEvents = [
      {
        prisonerNumber: 'A1234BC',
        firstName: 'TEST',
        lastName: 'PRISONER',
        cellLocation: '1-2-3',
        status: 'IN',
        events: [
          {
            eventSource: 'SAA',
            eventType: 'ACTIVITY',
            summary: 'Activity name',
            startTime: '09:00',
            endTime: '12:00',
          },
        ],
        clashingEvents: [
          {
            eventSource: 'SAA',
            eventType: 'ACTIVITY',
            summary: 'Activity name',
            startTime: '09:00',
            endTime: '12:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'ACTIVITY',
            summary: 'Activity name',
            suspended: true,
            startTime: '09:00',
            endTime: '12:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            startTime: '10:00',
            endTime: '11:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            cancelled: true,
            startTime: '10:00',
            endTime: '11:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            comments: 'Extra information',
            startTime: '10:00',
            endTime: '11:00',
          },
          {
            eventSource: 'SAA',
            eventType: 'APPOINTMENT',
            summary: 'Chaplaincy',
            startTime: '10:00',
          },
        ],
      },
    ] as MovementListItem[]

    return res.render('pages/activities/movement-list/location-events', {
      dateOption,
      date: simpleDate.toIsoString(),
      timeSlot,
      locations,
      locationEvents,
    })
  }
}
