import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsIn } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'

enum IssuePayOptions {
  YES = 'yes',
  NO = 'no',
}

export class PayNotRequiredOrExcusedForm {
  @Expose()
  @IsIn(Object.values(IssuePayOptions), {
    message: 'Select if people should be paid for this session they are not required at',
  })
  paidOrNot: string
}

export default class PaidOrNotRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.params.id
    const { selectedPrisoners } = req.session.recordAttendanceJourney.notRequiredOrExcused

    const instance: ScheduledActivity = await this.activitiesService.getScheduledActivity(instanceId, user)

    // console.log(instance)

    res.render('pages/activities/record-attendance/not-required-or-excused/paid-or-not', {
      selectedPrisoners,
      instance,
    })
  }

  POST = async (req: Request, res: Response) => {
    //   const { user } = res.locals
    //   const instanceId = +req.params.id
    //   const { selectedPrisoners } = req.session.recordAttendanceJourney.notRequiredOrExcused
    res.render('pages/activities/record-attendance/not-required-or-excused/paid-or-not', {})
  }
}
