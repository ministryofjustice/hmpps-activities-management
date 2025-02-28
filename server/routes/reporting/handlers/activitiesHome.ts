import { Request, Response } from 'express'
import reports from '../reportLists/activitiesReports'

export default class ActivitiesReportingHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/reporting/activities-home', { reports })
  }
}
