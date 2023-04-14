import { Request, Response } from 'express'

export default class OccurrenceMovementSlipRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointmentOccurrence } = req

    res.render('pages/appointments/movement-slip/individual', { movementSlip: appointmentOccurrence })
  }
}
