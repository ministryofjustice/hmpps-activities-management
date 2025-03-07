import { Request, Response } from 'express'
import reports from '../reportLists/reports'

export default class ActivitiesReportingHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/reporting/activities-home', { reports: reports.activities })
  }
}
