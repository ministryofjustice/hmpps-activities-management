import { Request, Response } from 'express'
import reports from '../reportLists/reports'

export default class AppointmentsReportingHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/reporting/appointments-home', { reports: reports.appointments })
  }
}
