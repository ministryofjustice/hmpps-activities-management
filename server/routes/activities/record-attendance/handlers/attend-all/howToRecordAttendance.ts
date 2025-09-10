import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import { Request, Response } from 'express'

enum AttendanceRecordingMethod {
  ACTIVITY,
  ACTIVITY_LOCATION,
  RESIDENTIAL_LOCATION,
}

export class HowToRecordAttendanceForm {
  @Expose()
  @IsIn(Object.values(AttendanceRecordingMethod), { message: 'Select how to record attendance' })
  howToRecord: string
}

export default class HowToRecordAttendanceRoutes {
  constructor() {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/record-attendance/attend-all/how-to-record-attendance', {})
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    return res.redirect('')
  }
}
