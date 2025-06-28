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

    res.render('pages/activities/record-attendance/not-required-or-excused/check-and-confirm', {
      selectedPrisoners,
      instance,
      isPaid,
    })
  }

  POST = async (req: Request, res: Response) => {
    const { user } = res.locals
    const instanceId = +req.params.id
    const { selectedPrisoners } = req.session.recordAttendanceJourney.notRequiredOrExcused

    await Promise.all(
      selectedPrisoners.map(prisoner =>
        this.activitiesService.postAdvanceAttendances(
          {
            scheduleInstanceId: instanceId,
            prisonerNumber: prisoner.prisonerNumber,
            issuePayment: req.session.recordAttendanceJourney.notRequiredOrExcused.isPaid,
          },
          user,
        ),
      ),
    )
    const successMessage = `You've marked ${selectedPrisoners.length === 1 ? '1 person' : `${selectedPrisoners.length} people`} as not required for this session.`
    return res.redirectWithSuccess('../attendance-list', 'Attendee list updated', successMessage)
  }
}
