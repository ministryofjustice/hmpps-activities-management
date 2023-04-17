import { Request, Response } from 'express'

export default class OccurrenceDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req

    res.render('pages/appointments/occurrence-details/occurrence', { occurrence: appointmentOccurrence })
  }
}
