import { Request, Response } from 'express'
import config from '../../../config'

export default class HomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { isActivitiesRolledOut, isAppointmentsRolledOut } = res.locals.user

    if (!isActivitiesRolledOut && !isAppointmentsRolledOut) {
      return res.redirect(config.dpsUrl)
    }
    return res.render('pages/home/index')
  }
}
