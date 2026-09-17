import { Request, Response } from 'express'
import UserService from '../../../../services/userService'
import { getAppointmentsDashboardReturnUrl } from '../../utils/appointmentReturnUrl'

export default class AppointmentSetDetailsRoutes {
  constructor(private readonly userService: UserService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSet } = req
    const { user } = res.locals

    const userMap = await this.userService.getUserMap([appointmentSet.createdBy], user)
    const returnUrl = getAppointmentsDashboardReturnUrl(req.query?.returnUrl)

    res.render('pages/appointments/appointment-set/details', {
      appointmentSet,
      showPrintMovementSlipsLink:
        appointmentSet.appointments.filter(appointment => !appointment.isCancelled && !appointment.isExpired).length >
        0,
      userMap,
      returnUrl,
    })
  }
}
