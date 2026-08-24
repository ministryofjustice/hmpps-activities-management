import { Request, Response } from 'express'
import UserService from '../../../../services/userService'
import { getAppointmentsDashboardReturnUrl } from '../../utils/appointmentReturnUrl'

export default class AppointmentSeriesDetailsRoutes {
  constructor(private readonly userService: UserService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSeries } = req
    const { user } = res.locals

    const userMap = await this.userService.getUserMap([appointmentSeries.createdBy], user)
    const returnUrl = getAppointmentsDashboardReturnUrl(req.query?.returnUrl)

    res.render('pages/appointments/appointment-series/details', { appointmentSeries, userMap, returnUrl })
  }
}
