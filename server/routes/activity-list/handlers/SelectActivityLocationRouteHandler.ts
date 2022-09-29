import { Request, Response } from 'express'
// eslint-disable-next-line import/no-duplicates
import { format } from 'date-fns'
// eslint-disable-next-line import/no-duplicates
import enGBLocale from 'date-fns/locale/en-GB'
import { switchDateFormat, getCurrentPeriod } from '../../../utils/utils'
import PrisonService from '../../../services/prisonService'

export default class SelectActivityLocationRouteHandler {
  constructor(private readonly prisonService: PrisonService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonId } = req.query as Record<string, string>
    const now = Date.now()
    const bookedOnDay = req.query?.date || format(now, 'dd/MM/yyyy', { locale: enGBLocale }) // moment().format('DD/MM/YYYY')
    const date = switchDateFormat(bookedOnDay as string)
    const period = req.query?.period || getCurrentPeriod(+format(now, 'H', { locale: enGBLocale }))

    const activityLocations = await this.prisonService.searchActivityLocations(
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
    }
    res.render('pages/activityList/selectActivityLocation', viewContext)
  }
}
