import { Request, Response } from 'express'
import { simpleDateFromDateOption } from '../../../../commonValidationTypes/simpleDate'
import DateOption from '../../../../enum/dateOption'

export default class LocationsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, date, timeSlot } = req.query

    const simpleDate = simpleDateFromDateOption(dateOption as DateOption, date as string)
    if (!simpleDate) {
      return res.redirect(`choose-details`)
    }

    // TODO: replace with await this.activitiesService.getLocationsWithEvents(user) when implemented
    const locations = [
      {
        id: 1,
        description: 'Test location 1',
      },
      {
        id: 2,
        description: 'Test location 2',
      },
      {
        id: 3,
        description: 'Test location 3',
      },
    ]

    return res.render('pages/activities/movement-list/locations', {
      dateOption,
      date: simpleDate.toIsoString(),
      timeSlot,
      locations,
    })
  }
}
