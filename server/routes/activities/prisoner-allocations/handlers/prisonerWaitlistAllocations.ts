import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import config from '../../../../config'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { ActivitySummary } from '../../../../@types/activitiesAPI/types'
import { getScheduleIdFromActivity } from '../../../../utils/utils'

export class SelectWailistOptions {
  @Expose()
  @ValidateIf(o => o.activityId === '-')
  @IsNotEmpty({ message: 'You must select an activity' })
  waitlistScheduleId: string
}

export default class PrisonerWaitlistHandler {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const activities: ActivitySummary[] = await this.activitiesService.getActivities(true, user)

    const prisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)

    const approvedPendingWaitlist = await this.activitiesService
      .getWaitlistApplicationsForPrisoner(user.activeCaseLoadId, prisonerNumber, user)
      .then(searchResults =>
        searchResults.content.map(applications => ({
          ...applications,
          activity: activities.find(act => act.id === applications.activityId),
        })),
      )
      .then(applications =>
        applications.filter(waitlist => waitlist.status === 'PENDING' || waitlist.status === 'APPROVED'),
      )

    return res.render('pages/activities/prisoner-allocations/waitlist-options', {
      activities,
      prisoner,
      approvedPendingWaitlist,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonerNumber } = req.params
    const { waitlistScheduleId, activityId } = req.body
    const { waitlistApplicationData } = req.body

    if (waitlistScheduleId === '' || waitlistScheduleId === undefined) {
      const activity = await this.activitiesService.getActivity(activityId, user)
      const activityScheduleId = getScheduleIdFromActivity(activity)
      const matchingApplication = waitlistApplicationData.filter(
        applications => applications.scheduleId === activityScheduleId.toString(),
      )

      if (matchingApplication.length > 0 && matchingApplication[0].status === 'PENDING') {
        return res.redirect(`pending-application`)
      }
      return res.redirect(`/activities/allocations/create/prisoner/${prisonerNumber}?scheduleId=${+activityScheduleId}`)
    }

    const selectedApplication = waitlistApplicationData.filter(
      application => application.scheduleId === waitlistScheduleId,
    )

    req.journeyData.prisonerAllocationsJourney = {
      activityName: selectedApplication[0].activityName,
      status: selectedApplication[0].status,
      scheduleId: selectedApplication[0].scheduleId,
      applicationId: selectedApplication[0].id,
      applicationDate: selectedApplication[0].requestedDate,
      requestedBy: selectedApplication[0].requestedBy,
      comments: selectedApplication[0].comments,
    }

    if (req.journeyData.prisonerAllocationsJourney.status === 'PENDING') {
      return res.redirect(`pending-application`)
    }
    return res.redirect(`/activities/allocations/create/prisoner/${prisonerNumber}?scheduleId=${waitlistScheduleId}`)
  }
}
