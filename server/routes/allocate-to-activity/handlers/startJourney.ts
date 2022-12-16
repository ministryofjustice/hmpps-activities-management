import { Request, Response } from 'express'
import PrisonService from '../../../services/prisonService'
import { convertToTitleCase } from '../../../utils/utils'
import ActivitiesService from '../../../services/activitiesService'

export default class StartJourneyRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { scheduleId, prisonerNumber } = req.params
    const { user } = res.locals

    const [inmate, schedule] = await Promise.all([
      this.prisonService.getInmate(prisonerNumber, user),
      this.activitiesService.getActivitySchedule(+scheduleId, user),
    ])

    req.session.allocateJourney = {
      inmate: {
        prisonerNumber: inmate.offenderNo,
        prisonerName: convertToTitleCase(`${inmate.firstName} ${inmate.lastName}`),
        cellLocation: inmate.assignedLivingUnit?.description,
        incentiveLevel: inmate.privilegeSummary?.iepLevel,
      },
      activity: {
        activityId: schedule.activity.id,
        scheduleId: schedule.id,
        name: schedule.description,
        location: schedule.internalLocation?.description,
      },
    }

    res.redirect(`/allocate/pay-band`)
  }
}
