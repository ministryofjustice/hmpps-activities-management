import { Request, Response } from 'express'
import { addDays, format } from 'date-fns'
import SimpleDate, { simpleDateFromDate } from '../../../../commonValidationTypes/simpleDate'
import { toDate } from '../../../../utils/utils'
import DateOption from '../../../../enum/dateOption'

export default class LocationsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, timeSlot } = req.query

    let simpleDate: SimpleDate
    switch (dateOption) {
      case DateOption.TODAY:
        simpleDate = simpleDateFromDate(new Date())
        break
      case DateOption.TOMORROW:
        simpleDate = simpleDateFromDate(addDays(new Date(), 1))
        break
      default:
        simpleDate = simpleDateFromDate(toDate(req.query.date as string))
        break
    }

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
      date: format(simpleDate.toRichDate(), 'yyyy-MM-dd'),
      timeSlot,
      locations,
    })
  }
}
