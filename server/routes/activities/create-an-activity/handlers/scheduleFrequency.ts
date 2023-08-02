import { IsEnum } from 'class-validator'
import { Request, Response } from 'express'
import { ScheduleFrequency } from '../journey'

export class ScheduleFrequencyForm {
  @IsEnum(ScheduleFrequency, { message: 'Select the frequency of the schedule for this activity' })
  scheduleFrequency: string
}

export default class ScheduleRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/schedule-frequency')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory, fromEditActivity } = req.query
    const scheduleFrequency = req.body.scheduleFrequency as string

    req.session.createJourney.scheduleWeeks = ScheduleFrequency[scheduleFrequency]

    // Remove invalid slots
    if (req.session.createJourney.slots) {
      Object.keys(req.session.createJourney.slots).forEach(weekNumber => {
        if (+weekNumber > req.session.createJourney.scheduleWeeks) {
          delete req.session.createJourney.slots[weekNumber]
        }
      })
    }

    let redirect = 'days-and-times/1'
    redirect += preserveHistory ? '?preserveHistory=true&fromScheduleFrequency=true' : ''
    redirect += fromEditActivity ? '&fromEditActivity=true' : ''
    res.redirect(redirect)
  }
}
