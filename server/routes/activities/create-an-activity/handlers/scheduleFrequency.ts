import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import { ScheduleFrequency } from '../journey'

export class ScheduleFrequencyForm {
  @IsEnum(ScheduleFrequency, { message: 'Select the frequency of the schedule for this activity' })
  scheduleFrequency: ScheduleFrequency
}

export default class ScheduleRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/schedule-frequency')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const {
      scheduleFrequency,
    }: {
      scheduleFrequency: ScheduleFrequency
    } = req.body

    req.session.createJourney.scheduleFrequency = scheduleFrequency

    res.redirect('days-and-times')
  }
}
