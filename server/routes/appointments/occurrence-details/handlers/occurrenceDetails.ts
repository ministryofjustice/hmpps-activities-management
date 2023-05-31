import { Request, Response } from 'express'

export default class OccurrenceDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req

    const yy = new Date(appointmentOccurrence.startDate).getFullYear()
    const mm = new Date(appointmentOccurrence.startDate).getMonth()
    const dd = new Date(appointmentOccurrence.startDate).getDate()
    const times = appointmentOccurrence.startTime.split(' ')[0].split(':')
    if (appointmentOccurrence.startTime.split(' ')[1] === 'PM') times[0] = String(Number(times[0]) + 12)

    const completeDate = new Date(yy, mm, dd, Number(times[0]), Number(times[1]))

    let appointmentInPast = false
    if (completeDate < new Date()) appointmentInPast = true

    res.render('pages/appointments/occurrence-details/occurrence', {
      occurrence: appointmentOccurrence,
      appointmentInPast,
    })
  }
}
