import { Request, Response } from 'express'

export default class AppointmentsReportingHomeRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const reports = [
      {
        title: 'Daily attendance summary',
        description:
          'Get attendance information for a single day, including who did not attend and where attendance has not been recorded yet.',
        href: '/appointments/attendance-summary/select-date',
        roleRequired: false,
      },
    ]

    res.render('pages/reporting/appointments-home', { reports })
  }
}
