import { Request, Response } from 'express'
import { DateTime } from 'luxon'
import { switchDateFormat, getCurrentPeriod } from '../../../../utils/utils'
import PrisonService from '../../../../services/prisonService'

export default class SelectActivityLocationRouteHandler {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonId } = req.query as Record<string, string>
    const nowDt = DateTime.now()
    const bookedOnDay = req.query?.date || nowDt.toLocaleString(DateTime.DATE_SHORT) // moment().format('DD/MM/YYYY')
    const date = switchDateFormat(bookedOnDay as string)
    const period = req.query?.period || getCurrentPeriod(nowDt)

    const activityLocations = await this.prisonService.getActivityLocations(
      prisonId || 'MDI',
      date,
      period as string,
      user,
    )

    const locationDropdownValues = activityLocations?.map(location => ({
      text: location.userDescription,
      value: location.locationId,
    }))

    const viewContext = {
      period,
      date: bookedOnDay,
      locationDropdownValues,
      errors: req.flash('errors'),
    }
    res.render('pages/alpha/activityList/selectActivityLocation', viewContext)
  }
}
