import { Request, Response } from 'express'

export default class AppointmentsReportingHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/reporting/appointments-home')
  }
}
