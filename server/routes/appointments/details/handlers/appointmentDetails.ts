import { Request, Response } from 'express'
import { parseDate } from '../../../../utils/utils'

export default class AppointmentDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    const now = new Date()
    appointment.occurrences = appointment.occurrences.filter(
      occurrence => parseDate(`${occurrence.startDate}T${occurrence.startTime}`, "yyyy-MM-dd'T'HH:mm") >= now,
    )

    res.render('pages/appointments/details/appointment', { appointment })
  }
}
