import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import { asString, convertToTitleCase } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'

export default class StartJourneyRoutes {
  constructor(private readonly prisonService: PrisonService, private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { scheduleId, source } = req.query
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const [inmate, iepSummary, schedule] = await Promise.all([
      this.prisonService.getInmate(prisonerNumber, user),
      this.prisonService.getPrisonerIepSummary(prisonerNumber, user),
      this.activitiesService.getActivitySchedule(+scheduleId, user),
    ])

    req.session.allocateJourney = {
      inmate: {
        prisonerNumber: inmate.offenderNo,
        prisonerName: convertToTitleCase(`${inmate.firstName} ${inmate.lastName}`),
        cellLocation: inmate.assignedLivingUnit?.description,
        incentiveLevel: iepSummary?.iepLevel,
      },
      activity: {
        activityId: schedule.activity.id,
        scheduleId: schedule.id,
        name: schedule.description,
        location: schedule.internalLocation?.description,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
      },
    }
    req.session.journeyMetrics = {
      journeyStartTime: Date.now(),
      source: asString(source),
    }
    res.redirect(`/activities/allocate/before-you-allocate`)
  }
}
