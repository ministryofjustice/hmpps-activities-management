import { Request, Response } from 'express'
import UserService from '../../../../services/userService'

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
    })
  }
}
