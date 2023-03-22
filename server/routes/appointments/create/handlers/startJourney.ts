import { Request, Response } from 'express'
import { AppointmentType } from '../journey'

export default class StartJourneyRoutes {
  SINGLE = async (req: Request, res: Response): Promise<void> => {
    req.session.createAppointmentJourney = { type: AppointmentType.SINGLE }
    res.redirect(`select-prisoner`)
  }

  GROUP = async (req: Request, res: Response): Promise<void> => {
    req.session.createAppointmentJourney = { type: AppointmentType.GROUP }
    res.redirect(`select-prisoner`)
  }
}
