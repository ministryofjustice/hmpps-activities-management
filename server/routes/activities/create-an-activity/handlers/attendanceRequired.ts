import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsEnum } from 'class-validator'
import { YesNo } from '../../../../@types/activities'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityUpdateRequest } from '../../../../@types/activitiesAPI/types'

export class AttendanceRequiredForm {
  @Expose()
  @IsEnum(YesNo, { message: 'Select yes if attendance should be recorded' })
  attendanceRequired: YesNo
}

export default class AttendanceRequired {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/create-an-activity/attendance-required')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const attendanceRequired = req.body.attendanceRequired === YesNo.YES
    req.session.createJourney.attendanceRequired = attendanceRequired

    if (req.params.mode === 'edit') {
      const { user } = res.locals
      const { activityId } = req.session.createJourney
      const activity = { attendanceRequired } as ActivityUpdateRequest

      await this.activitiesService.updateActivity(activityId, activity, user)

      const successMessage = `You've updated the record attendance option for ${req.session.createJourney.name}`
      const returnTo = `/activities/view/${req.session.createJourney.activityId}`

      req.session.returnTo = returnTo

      return res.redirectOrReturnWithSuccess(returnTo, 'Activity updated', successMessage)
    }

    // Must be creating an activity...

    if (attendanceRequired) {
      return res.redirectOrReturn('pay-option')
    }

    req.session.createJourney.paid = false
    req.session.createJourney.pay = []
    return res.redirectOrReturn('qualification')
  }
}
