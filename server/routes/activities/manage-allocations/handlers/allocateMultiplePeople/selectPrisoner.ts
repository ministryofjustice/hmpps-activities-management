import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import IsNotAnExistingAttendee from '../../../../../validators/IsNotAnExistingAttendee'
import PrisonService from '../../../../../services/prisonService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import ActivitiesService from '../../../../../services/activitiesService'
import NonAssociationsService from '../../../../../services/nonAssociationsService'
import enhancePrisonersWithNonAssocationsAndAllocations from '../../../../../utils/extraPrisonerInformation'

export class SelectPrisoner {
  @Expose()
  @IsNotEmpty({ message: 'You must select one option' })
  @IsNotAnExistingAttendee({
    message: 'The prisoner you have selected is already allocated to {{ session.activity.name }}',
  })
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

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(selectedPrisoner, user).catch(_ => null)
    if (!prisoner) return res.validationFailed('selectedPrisoner', 'You must select one option')

    const prisonerFreeToAllocate = await this.checkPrisonerIsntCurrentlyAllocated(req, res, prisoner)
    const prisonerIncentiveLevelSuitable = await this.checkPrisonerHasSuitableIncentiveLevel(req, res, prisoner)

    if (prisonerFreeToAllocate && prisonerIncentiveLevelSuitable) {
      await this.addPrisonersToSession(req, prisoner)
      return res.redirect(`review-prisoners`)
    }
    // TODO: validation message if the person isn't eligible?
    return res.validationFailed('', '')
  }

  private checkPrisonerIsntCurrentlyAllocated = async (_req: Request, _res: Response, _prisoner: Prisoner) => {
    // compare prisoner against list of currently allocated prisoners
    // if (alreadyAllocated) {
    //   return res.validationFailed(
    //     'selectedPrisoner',
    //     `This person is already allocated to ${req.session.allocateJourney.activity.name}`,
    //   )
    // }

    return true
  }

  private checkPrisonerHasSuitableIncentiveLevel = async (_req: Request, _res: Response, _prisoner: Prisoner) => {
    return true
  }

  private addPrisonersToSession = async (req: Request, prisoner: Prisoner) => {
    const prisonerData = {
      prisonerNumber: prisoner.prisonerNumber,
      prisonerName: `${prisoner.firstName} ${prisoner.lastName}`,
      prisonCode: prisoner.prisonId,
      cellLocation: prisoner.cellLocation,
      status: prisoner.status,
      incentiveLevel: prisoner.currentIncentive.level.description,
    }

    req.session.allocateJourney.inmates.push(prisonerData)
  }
}
