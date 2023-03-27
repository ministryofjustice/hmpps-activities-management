import { Request, Response } from 'express'
import { AppointmentType } from '../journey'

export default class StartJourneyRoutes {
  INDIVIDUAL = async (req: Request, res: Response): Promise<void> => {
    req.session.createAppointmentJourney = { type: AppointmentType.INDIVIDUAL }
    res.redirect(`select-prisoner`)
  }

  GROUP = async (req: Request, res: Response): Promise<void> => {
    req.session.createAppointmentJourney = { type: AppointmentType.GROUP }
    res.redirect(`upload-prisoner-list`)
  }
}
