import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty, ValidateIf } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { ActivitySummary } from '../../../../@types/activitiesAPI/types'
import { formatName, getScheduleIdFromActivity } from '../../../../utils/utils'
import { NameFormatStyle } from '../../../../utils/helpers/nameFormatStyle'
import { EnhancedWaitlistApplication } from '../journey'

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
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const [activities, prisoner] = await Promise.all([
      this.activitiesService.getActivities(true, user) as Promise<ActivitySummary[]>,
      this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user) as Promise<Prisoner>,
    ])

    const activityById = new Map<number, ActivitySummary>(activities.map(a => [a.id, a]))

    const waitlistApps = await this.activitiesService.getWaitlistApplicationsForPrisoner(
      user.activeCaseLoadId,
      prisonerNumber,
      user,
    )

    const enhanced: EnhancedWaitlistApplication[] = waitlistApps.content.map(app => ({
      ...app,
      activity: activityById.get(app.activityId),
    }))

    const waitlistApprovedPendingApplications = enhanced.filter(app => ['PENDING', 'APPROVED'].includes(app.status))

    const approvedPendingIds = new Set(waitlistApprovedPendingApplications.map(app => app.activityId))

    const activitiesNotApprovedOrPending = activities.filter(act => !approvedPendingIds.has(act.id))

    return res.render('pages/activities/prisoner-allocations/waitlist-options', {
      waitlistApprovedPendingApplications,
      activitiesNotApprovedOrPending,
      prisonerName: formatName(
        prisoner.firstName,
        prisoner.middleNames,
        prisoner.lastName,
        NameFormatStyle.firstLast,
        false,
      ),
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

      const alreadyAllocated = await this.activitiesService
        .getActivePrisonPrisonerAllocations([prisonerNumber], user)
        .then(alloc => alloc.filter(all => all.allocations.find(a => a.scheduleId === activityScheduleId)))
        .then(alloc => alloc.length > 0)

      if (alreadyAllocated) {
        return res.validationFailed('activityId', `${prisonerNumber} is already allocated to ${activity.description}`)
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
