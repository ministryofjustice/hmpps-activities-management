import { Request, Response } from 'express'

export default class ActivitiesReportingHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const reports = {
      waitlists: [
        {
          title: 'Waitlist aggregation with averages',
          description: 'Some description of the report',
          href: '/dpr-reporting/waitlist-agg',
          // this is a test to check the roleRequired field works. We don't have the info as to which reports are restricted yet.
          roleRequired: true,
        },
      ],
    }
    res.render('pages/reporting/activities-home', { reports })
  }
}
