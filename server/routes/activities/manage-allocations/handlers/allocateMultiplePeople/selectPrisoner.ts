import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import PrisonService from '../../../../../services/prisonService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import ActivitiesService from '../../../../../services/activitiesService'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import enhancePrisonersWithNonAssocationsAndAllocations from '../../../../../utils/extraPrisonerInformation'
import { Inmate } from '../../journey'
import { Activity, Allocation } from '../../../../../@types/activitiesAPI/types'
import { inmatesAllocated, inmatesWithMatchingIncentiveLevel } from '../../../../../utils/helpers/allocationUtil'

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
    if (res.locals.formResponses?.query !== undefined) {
      query = res.locals.formResponses.query
    }

    if (query && typeof query === 'string') {
      const result = await this.prisonService.searchPrisonInmates(query, user)
      let prisoners: Prisoner[] = []
      if (result && !result.empty) prisoners = result.content

      const prisonerNumbers = prisoners.map(prisoner => prisoner.prisonerNumber)
      const [prisonerAllocations, nonAssociations] = await Promise.all([
        this.activitiesService.getActivePrisonPrisonerAllocations(prisonerNumbers, user),
        this.nonAssociationsService.getListPrisonersWithNonAssociations(prisonerNumbers, user),
      ])
      const enhancedPrisoners = enhancePrisonersWithNonAssocationsAndAllocations(
        prisoners,
        prisonerAllocations,
        nonAssociations,
      )

      return res.render('pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner', {
        prisoners: enhancedPrisoners,
        query,
      })
    }

    return res.render('pages/activities/manage-allocations/allocateMultiplePeople/selectPrisoner')
  }

  SEARCH = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.body
    return res.redirect(`select-prisoner?query=${query}`)
  }

  SELECT_PRISONER = async (req: Request, res: Response): Promise<void> => {
    const { selectedPrisoner } = req.body
    const { user } = res.locals
    const { activity } = req.session.allocateJourney

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(selectedPrisoner, user).catch(_ => null)
    if (!prisoner) return res.validationFailed('selectedPrisoner', 'You must select one option')

    const [currentlyAllocated, act] = await Promise.all([
      this.activitiesService.getAllocationsWithParams(activity.scheduleId, { includePrisonerSummary: true }, user),
      this.activitiesService.getActivity(activity.activityId, user),
    ])

    const inmate: Inmate = {
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
    }

    const prisonerFreeToAllocate = await this.checkPrisonerIsntCurrentlyAllocated([inmate], currentlyAllocated)
    const prisonerIncentiveLevelSuitable = await this.checkPrisonerHasSuitableIncentiveLevel([inmate], act)
    if (prisonerFreeToAllocate) {
      if (prisonerIncentiveLevelSuitable) {
        await this.addPrisonersToSession(req, prisoner)
        // TODO this redirect needs to go to the new review page
        return res.redirect(`activity-requirements-review`)
      }
      return res.validationFailed(
        'selectedPrisoner',
        'This person cannot be allocated as there is no pay rate for their incentive level',
      )
    }
    return res.validationFailed(
      'selectedPrisoner',
      `This person is already allocated to ${req.session.allocateJourney.activity.name}`,
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

  private addPrisonersToSession = async (req: Request, inmate: Inmate) => {
    // check that the prisoner isn't already in there to stop duplication if the user goes back
    const duplicate = req.session.allocateJourney.inmates.filter(
      prisoner => inmate.prisonerNumber === prisoner.prisonerNumber,
    )
    if (duplicate.length) return false

    req.session.allocateJourney.inmates.push(inmate)
    return true
  }
}
