import { Request, Response } from 'express'
import UserService from '../../../../services/userService'
import { isUncancellable } from '../../../../utils/editAppointmentUtils'

export default class AppointmentDetailsRoutes {
  constructor(private readonly userService: UserService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { user } = res.locals

    const userMap = await this.userService.getUserMap(
      [appointment.createdBy, appointment.updatedBy, appointment.cancelledBy],
      user,
    )

    res.render('pages/appointments/appointment/details', {
      appointment,
      userMap,
      uncancellable: isUncancellable(appointment),
    })
  }

  COPY = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/appointment/copy', {
      appointment,
    })
  }
}
