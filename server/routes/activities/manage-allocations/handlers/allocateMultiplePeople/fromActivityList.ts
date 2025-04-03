import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../../services/prisonService'
import { Inmate } from '../../journey'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { Activity, PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'
import { addNonAssociations, addOtherAllocations } from '../../../../../utils/helpers/allocationUtil'
import ActivityService from '../../../../../services/activitiesService'
import NonAssociationsService from '../../../../../services/nonAssociationsService'

export class FromActivityList {
  @Expose()
  @IsNotEmpty({ message: 'You must select an activity' })
  activityId: string
}

export default class FromActivityListRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivityService,
    private readonly nonAssociationsService: NonAssociationsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const activities = await this.activitiesService.getActivities(true, user)

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/fromActivityList', {
      activities,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { activityId } = req.body
    const { activity } = req.session.allocateJourney

    const activityToCopy: Activity = await this.activitiesService.getActivity(+activityId, user)
    const prisonerNumbers: string[] = activityToCopy.schedules[0].allocations
      .filter(alloc => alloc.status === 'ACTIVE' || alloc.status === 'PENDING')
      .map(alloc => alloc.prisonerNumber)
    if (prisonerNumbers.length === 0) {
      return res.validationFailed('activityId', `No-one is currently allocated to ${activityToCopy.summary}`)
    }

    const prisoners: Prisoner[] = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)

    const inmates: Inmate[] = prisoners
      .filter(prisoner => prisoner.prisonId === user.activeCaseLoadId)
      .map(
        prisoner =>
          ({
            prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
            firstName: prisoner.firstName,
            middleNames: prisoner.middleNames,
            lastName: prisoner.lastName,
            prisonerNumber: prisoner.prisonerNumber,
            prisonCode: prisoner.prisonId,
            status: prisoner.status,
            cellLocation: prisoner.cellLocation,
            incentiveLevel: prisoner.currentIncentive?.level.description,
            payBand: undefined,
          }) as Inmate,
      )

    // get other allocations for the unallocated prisoners
    const unallocatedPrisonerNumbers: string[] = inmates.map(inmate => inmate.prisonerNumber)
    const prisonerAllocationsList: PrisonerAllocations[] =
      await this.activitiesService.getActivePrisonPrisonerAllocations(unallocatedPrisonerNumbers, user)
    addOtherAllocations(inmates, prisonerAllocationsList, activity.scheduleId)

    // get non associations
    const nonAssociations: string[] = await this.nonAssociationsService.getListPrisonersWithNonAssociations(
      unallocatedPrisonerNumbers,
      user,
    )
    addNonAssociations(inmates, nonAssociations)

    req.session.allocateJourney.inmates = inmates
    req.session.allocateJourney.allocatedInmates = undefined
    req.session.allocateJourney.withoutMatchingIncentiveLevelInmates = undefined

    return res.redirect(`review-upload-prisoner-list?fromActivity=${activityToCopy.description}`)
  }
}
