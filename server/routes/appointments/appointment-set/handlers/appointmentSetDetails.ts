import { Request, Response } from 'express'

export default class AppointmentSetDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentSet } = req

    res.render('pages/appointments/appointment-set/details', {
      appointmentSet,
      showPrintMovementSlipsLink:
        appointmentSet.appointments.filter(appointment => !appointment.isCancelled && !appointment.isExpired).length >
        0,
    })
  }
}
