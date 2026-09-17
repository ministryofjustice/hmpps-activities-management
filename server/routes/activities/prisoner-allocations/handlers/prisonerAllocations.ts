import { Request, Response } from 'express'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import ActivitiesService from '../../../../services/activitiesService'

export default class PrisonerAllocationsHandler {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly nonAssociationsService: NonAssociationsService,
  ) {}

  GET = async (req: Request, res: Response) => {
    const { prisonerNumber } = req.params as { prisonerNumber: string }
    const { user } = res.locals

    const [prisoner, prisonerAllocations, activities, prisonerNonAssociations, waitlistSearchResults] =
      await Promise.all([
        this.prisonService.getInmateByPrisonerNumber(prisonerNumber, user),
        this.activitiesService.getActivePrisonPrisonerAllocations([prisonerNumber], user),
        this.activitiesService.getActivities(false, user),
        // TO DO: handle non-associations better - we don't need to retrieve the whole object for hasNonAssociations.
        this.nonAssociationsService.getNonAssociationByPrisonerId(prisonerNumber, user),
        this.activitiesService.getWaitlistApplicationsForPrisoner(user.activeCaseLoadId, prisonerNumber, user),
      ])

    const waitlistApplications = waitlistSearchResults.content.map(application => ({
      ...application,
      activity: activities.find(act => act.id === application.activityId),
    }))

    const allocationsData = prisonerAllocations[0]?.allocations.flat(1)

    const filterByStatus = status =>
      waitlistApplications.filter(app => app.activity.activityState === 'LIVE' && app.status === status)

    const pendingApplications = filterByStatus('PENDING')
    const approvedApplications = filterByStatus('APPROVED')
    const rejectedApplications = filterByStatus('DECLINED')
    const withdrawnApplications = filterByStatus('WITHDRAWN')

    const activeAllocations = allocationsData?.filter(all => !all.plannedSuspension)

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
