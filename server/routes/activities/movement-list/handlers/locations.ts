import { Request, Response } from 'express'
import { isValid } from 'date-fns'
import DateOption from '../../../../enum/dateOption'
import ActivitiesService from '../../../../services/activitiesService'
import { dateFromDateOption, formatIsoDate } from '../../../../utils/datePickerUtils'

export default class LocationsRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { dateOption, date, timeSlot } = req.query

    const richDate = dateFromDateOption(dateOption as DateOption, date as string)
    if (!richDate || !isValid(richDate)) {
      return res.redirect('choose-details')
    }

    const locations = await this.activitiesService.getInternalLocationEventsSummaries(
      user.activeCaseLoadId,
      richDate,
      user,
      timeSlot as string,
    )

    return res.render('pages/activities/movement-list/locations', {
      dateOption,
      date: formatIsoDate(richDate),
      timeSlot,
      locations,
    })
  }
}
