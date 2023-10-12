import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'

export default class AppointmentAttendanceRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/appointment/attendance', {
      appointment,
    })
  }
}
