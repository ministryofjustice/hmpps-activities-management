import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../../services/prisonService'
import ActivitiesService from '../../../../../services/activitiesService'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import { Inmate } from '../../journey'
import { Activity, Allocation } from '../../../../../@types/activitiesAPI/types'
import {
  addNonAssociations,
  addOtherAllocations,
  convertPrisonersToInmates,
  inmatesAllocated,
  inmatesWithMatchingIncentiveLevel,
} from '../../../../../utils/helpers/allocationUtil'
import { ServiceUser } from '../../../../../@types/express'

export class SelectPrisoner {
  @Expose()
  @IsNotEmpty({ message: 'You must select one option' })
  selectedPrisoner: string
}

export class PrisonerSearch {
  @Expose()
  @IsNotEmpty({ message: 'You must enter a name or prison number in the format AB1234C' })
  query: string
}

export default class SelectPrisonerRoutes {
  constructor(
    private readonly prisonService: PrisonService,
    private readonly activitiesService: ActivitiesService,
    private readonly nonAssociationsService: NonAssociationsService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    let { query } = req.query
    const { preserveHistory } = req.query
    const { activity } = req.journeyData.allocateJourney
    if (res.locals.formResponses?.query !== undefined) {
      query = res.locals.formResponses.query
    }

    if (query && typeof query === 'string') {
      const result = await this.prisonService.searchPrisonInmates(query, user).catch(_ => null)
      let prisoners: Prisoner[] = []
      if (result && !result.empty) prisoners = result.content

      if (!prisoners.length) {
        return res.render('pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner', {
          prisoners: [],
          query,
          preserveHistory,
        })
      }

      const inmates = convertPrisonersToInmates(prisoners)

      const prisonerNumbers: string[] = inmates.map(inmate => inmate.prisonerNumber)
      const [prisonerAllocationsList, nonAssociations] = await Promise.all([
        this.activitiesService.getActivePrisonPrisonerAllocations(prisonerNumbers, user),
        this.nonAssociationsService.getListPrisonersWithNonAssociations(prisonerNumbers, user),
      ])
      addOtherAllocations(inmates, prisonerAllocationsList, activity.scheduleId)
      addNonAssociations(inmates, nonAssociations)

      return res.render('pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner', {
        prisoners: inmates,
        query,
        preserveHistory,
      })
    }

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner', { preserveHistory })
  }

  SEARCH = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body
    return res.redirect(`select-prisoner?query=${query}${req.query.preserveHistory ? '&preserveHistory=true' : ''}`)
  }

  SELECT_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { selectedPrisoner } = req.body
    const { user } = res.locals
    const { activity } = req.journeyData.allocateJourney

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(selectedPrisoner, user).catch(_ => null)
    if (!prisoner) return res.validationFailed('selectedPrisoner', 'You must select one option')

    const [currentlyAllocated, act] = await Promise.all([
      this.activitiesService.getAllocationsWithParams(activity.scheduleId, { includePrisonerSummary: true }, user),
      this.activitiesService.getActivity(activity.activityId, user),
    ])

    const [inmate] = convertPrisonersToInmates([prisoner])

    const prisonerFreeToAllocate = await this.checkPrisonerIsntCurrentlyAllocated([inmate], currentlyAllocated)
    const prisonerIncentiveLevelSuitable = await this.checkPrisonerHasSuitableIncentiveLevel([inmate], act)

    if (prisonerFreeToAllocate) {
      // If the prisoner has an incentive level appropriate for the activity, or if the activity is unpaid
      if (prisonerIncentiveLevelSuitable || act.paid === false) {
        await this.addPrisonersToSession(req, inmate, user)
        return res.redirect(`review-search-prisoner-list${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
      }

      return res.validationFailed(
        'selectedPrisoner',
        'This person cannot be allocated as there is no pay rate for their incentive level',
      )
    }
    return res.validationFailed(
      'selectedPrisoner',
      `This person is already allocated to ${req.journeyData.allocateJourney.activity.name}`,
    )
  }

  private checkPrisonerIsntCurrentlyAllocated = async (inmate: Inmate[], currentlyAllocated: Allocation[]) => {
    // compare prisoner against list of currently allocated prisoners
    const allocatedInmate: Inmate[] = inmatesAllocated(inmate, currentlyAllocated, false)
    if (allocatedInmate.length) {
      return false
    }
    return true
  }

  private checkPrisonerHasSuitableIncentiveLevel = async (inmate: Inmate[], activity: Activity) => {
    // check the paybands against the incentive level
    const matchingInmate: Inmate[] = inmatesWithMatchingIncentiveLevel(inmate, activity)
    if (!matchingInmate.length) {
      return false
    }
    return true
  }

  private addPrisonersToSession = async (req: Request, inmate: Inmate, user: ServiceUser) => {
    const { scheduleId } = req.journeyData.allocateJourney.activity
    // check that the prisoner isn't already in there to stop duplication if the user goes back
    const duplicate = req.journeyData.allocateJourney.inmates.filter(
      prisoner => inmate.prisonerNumber === prisoner.prisonerNumber,
    )
    if (duplicate.length) return false

    const [prisonerAllocationsList, nonAssociations] = await Promise.all([
      this.activitiesService.getActivePrisonPrisonerAllocations([inmate.prisonerNumber], user),
      this.nonAssociationsService.getListPrisonersWithNonAssociations([inmate.prisonerNumber], user),
    ])

    addOtherAllocations([inmate], prisonerAllocationsList, scheduleId)
    addNonAssociations([inmate], nonAssociations)

    req.journeyData.allocateJourney.inmates.push(inmate)
    return true
  }
}
