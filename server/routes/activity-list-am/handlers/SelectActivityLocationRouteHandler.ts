import { Request, Response } from 'express'
// eslint-disable-next-line import/no-duplicates
import { format } from 'date-fns'
// eslint-disable-next-line import/no-duplicates
import enGBLocale from 'date-fns/locale/en-GB'
import { switchDateFormat, getCurrentPeriod } from '../../../utils/utils'
import ActivitiesService from '../../../services/activitiesService'

export default class SelectActivityLocationRouteHandler {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const now = Date.now()
    const bookedOnDay = req.query?.date || format(now, 'dd/MM/yyyy', { locale: enGBLocale }) // moment().format('DD/MM/YYYY')
    const date = switchDateFormat(bookedOnDay as string)
    const period = req.query?.period || getCurrentPeriod(+format(now, 'H', { locale: enGBLocale }))

    const activityLocations = await this.activitiesService.getScheduledPrisonLocations(
      user.activeCaseLoad.caseLoadId,
      date,
      period as string,
      user,
    )

    const locationDropdownValues = activityLocations?.map(location => ({
      text: location.description,
      value: location.id,
    }))

    req.session.data = {
      activityLocations,
    }

    const viewContext = {
      period,
      date: bookedOnDay,
      locationDropdownValues,
    }
    res.render('pages/activityListAm/selectActivityLocation', viewContext)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    // validate
    const params = new URLSearchParams({
      locationId: req.body.currentLocation,
      date: encodeURIComponent(switchDateFormat(req.body.date)),
      period: req.body.period,
    })
    return res.redirect(`/activity-list-am?${params.toString()}`)
  }
}
