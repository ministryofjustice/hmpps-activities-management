import { Request, Response } from 'express'
import config from '../../../../config'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivitySummary } from '../../../../@types/activitiesAPI/types'

export default class PrisonerAllocationsHandler {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly nonAssociationsService: NonAssociationsService,
  ) {}

  GET = async (req: Request, res: Response) => {
    if (!config.prisonerAllocationsEnabled) {
      return res.redirect('/activities')
    }
    const { prisonerNumber } = req.params
    const { user } = res.locals

    const prisoner: Prisoner = await this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user)
    const prisonerAllocations = await this.activitiesService.getActivePrisonPrisonerAllocations([prisonerNumber], user)
    const allocationsData = prisonerAllocations[0]?.allocations.flat(1)
    const activities: ActivitySummary[] = await this.activitiesService.getActivities(false, user)

    const waitlistApplications = await this.activitiesService
      .getWaitlistApplicationsForPrisoner(user.activeCaseLoadId, prisonerNumber, user)
      .then(searchResults =>
        searchResults.content.map(applications => ({
          ...applications,
          activity: activities.find(act => act.id === applications.activityId),
        })),
      )

    const filterByStatus = status =>
      waitlistApplications.filter(app => app.activity.activityState === 'LIVE' && app.status === status)

    const pendingApplications = filterByStatus('PENDING')
    const approvedApplications = filterByStatus('APPROVED')
    const rejectedApplications = filterByStatus('DECLINED')
    const withdrawnApplications = filterByStatus('WITHDRAWN')

    const activeAllocations = allocationsData?.filter(all => !all.plannedSuspension)

    const prisonerNonAssociations = await this.nonAssociationsService.getNonAssociationByPrisonerId(
      prisonerNumber,
      user,
    )
    const hasNonAssociations = prisonerNonAssociations.nonAssociations.length > 0

    return res.render('pages/activities/prisoner-allocations/dashboard', {
      prisoner,
      hasNonAssociations,
      allocationsData,
      activeAllocationIdsForSuspending: activeAllocations?.map(allocation => allocation.id),
      locationStatus: getLocationStatus(prisoner),
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      withdrawnApplications,
      showWithdrawnApplicationsSection: false,
    })
  }

  POST = async (req: Request, res: Response) => {
    res.redirect('/activities/prisoner-allocations')
  }
}

function getLocationStatus(prisonerData: Prisoner) {
  if (prisonerData.status === 'ACTIVE OUT') {
    return `Temporarily out from ${prisonerData.prisonName}`
  }
  return null
}
