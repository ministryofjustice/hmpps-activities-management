import { Request, Response } from 'express'

export default class HowToRecordAttendanceRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/record-attendance/attend-all/how-to-record-attendance', {})
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('')
  }
}
