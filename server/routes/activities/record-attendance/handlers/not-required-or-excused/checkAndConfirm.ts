import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import { ScheduledActivity } from '../../../../../@types/activitiesAPI/types'

export default class CheckAndConfirmRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.params.id
    const { selectedPrisoners, isPaid } = req.session.recordAttendanceJourney.notRequiredOrExcused

    const instance: ScheduledActivity = await this.activitiesService.getScheduledActivity(instanceId, user)

    // console.log(instance)
    // console.log(selectedPrisoners)

    res.render('pages/activities/record-attendance/not-required-or-excused/check-and-confirm', {
      selectedPrisoners,
      instance,
      isPaid,
    })
  }

  POST = async (req: Request, res: Response) => {
    //   const { user } = res.locals
    //   const instanceId = +req.params.id
    //   const { selectedPrisoners } = req.session.recordAttendanceJourney.notRequiredOrExcused
    // console.log('POST /not-required-or-excused/paid-or-not', req.body)

    req.session.recordAttendanceJourney.sessionCancellationMultiple.issuePayment = req.body.issuePayOption === 'yes'
    res.redirect('not-required-or-excused/check-and-confirm')
  }
}
