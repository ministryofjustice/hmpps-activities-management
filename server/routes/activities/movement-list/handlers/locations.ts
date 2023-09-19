import { Request, Response } from 'express'
import { simpleDateFromDateOption } from '../../../../commonValidationTypes/simpleDate'
import DateOption from '../../../../enum/dateOption'
import ActivitiesService from '../../../../services/activitiesService'

export default class LocationsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { dateOption, date, timeSlot } = req.query

    const simpleDate = simpleDateFromDateOption(dateOption as DateOption, date as string)
    if (!simpleDate) {
      return res.redirect(`choose-details`)
    }
    const dateIsoString = simpleDate.toIsoString()

    const locations = await this.activitiesService.getInternalLocationEventsSummaries(
      user.activeCaseLoadId,
      dateIsoString,
      user,
      timeSlot as string,
    )

    return res.render('pages/activities/movement-list/locations', {
      dateOption,
      date: dateIsoString,
      timeSlot,
      locations,
    })
  }
}
