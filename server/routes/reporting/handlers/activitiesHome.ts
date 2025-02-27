import { Request, Response } from 'express'

export default class ActivitiesReportingHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const reports = {
      waitlists: [
        {
          title: 'Waitlist aggregation with averages',
          description: 'Some description of the report',
          href: '/dpr-reporting/waitlist-agg',
          roleRequired: '',
        },
      ],
    }
    res.render('pages/reporting/activities-home', { reports })
  }
}
