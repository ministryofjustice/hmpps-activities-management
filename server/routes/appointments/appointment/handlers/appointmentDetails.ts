import { Request, Response } from 'express'
import { startOfToday, subDays } from 'date-fns'
import UserService from '../../../../services/userService'
import { parseDate } from '../../../../utils/utils'

export default class AppointmentDetailsRoutes {
  constructor(private readonly userService: UserService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { user } = res.locals

    const userMap = await this.userService.getUserMap(
      [appointment.createdBy, appointment.updatedBy, appointment.cancelledBy],
      user,
    )

    const appointmentUncancellable =
      appointment.isCancelled && parseDate(appointment.startDate) > subDays(startOfToday(), 6)

    res.render('pages/appointments/appointment/details', {
      appointment,
      userMap,
      appointmentUncancellable,
    })
  }

  COPY = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/appointment/copy', {
      appointment,
    })
  }
}
