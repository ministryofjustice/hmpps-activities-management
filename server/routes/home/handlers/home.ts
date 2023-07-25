import { Request, Response } from 'express'

export default class HomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { isActivitiesRolledOut, isAppointmentsRolledOut } = res.locals.user

    if (!isActivitiesRolledOut && !isAppointmentsRolledOut) {
      return res.render('pages/not-rolled-out', {
        serviceName: 'Activities and Appointments',
      })
    }
    return res.render('pages/home/index')
  }
}
