import { Request, Response } from 'express'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import { NonAssociation } from '../../../../@types/nonAssociationsApi/types'
import PrisonService from '../../../../services/prisonService'
import { ServiceUser } from '../../../../@types/express'

export default class ReviewNonAssociationRoutes {
  constructor(
    private readonly nonAssociationsService: NonAssociationsService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { appointmentId } = req.params
    const { appointmentJourney } = req.session
    const { preserveHistory } = req.query

    const backLinkHref = 'review-prisoners-alerts'

    const { prisoners } = appointmentJourney
    const prisonerNumbers = prisoners.map(prisoner => prisoner.number)

    const nonAssociations = await this.nonAssociationsService.getNonAssociationsBetween(prisonerNumbers, user)

    const enhancedNonAssociations = await this.enhanceNonAssociations(nonAssociations, user)

    res.render('pages/appointments/create-and-edit/review-non-associations', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      nonAssociations: enhancedNonAssociations,
      attendesTotalCount: prisonerNumbers.length,
    })
  }

  private prisonerMap = async (nonAssociations: NonAssociation[], user: ServiceUser) => {
    const firstPrisonerNumbers = nonAssociations.map(na => na.firstPrisonerNumber)
    const secondPrisonerNumber = nonAssociations.map(na => na.secondPrisonerNumber)
    const prisonerNumbers = new Set(firstPrisonerNumbers.concat(secondPrisonerNumber))
    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(Array.from(prisonerNumbers), user)
    return new Map(prisoners.map(prisoner => [prisoner.prisonerNumber, prisoner]))
  }

  private enhanceNonAssociations = async (nonAssociations: NonAssociation[], user: ServiceUser) => {
    const prisoners = await this.prisonerMap(nonAssociations, user)
    return nonAssociations.map(na => {
      const firstPrisoner = prisoners.get(na.firstPrisonerNumber)
      const secondPrisoner = prisoners.get(na.secondPrisonerNumber)
      return {
        ...na,
        firstPrisonerName: `${firstPrisoner.firstName} ${firstPrisoner.lastName}`,
        firstPrisonerCellLocation: firstPrisoner.cellLocation,
        secondPrisonerName: `${secondPrisoner.firstName} ${secondPrisoner.lastName}`,
        secondPrisonerCellLocation: secondPrisoner.cellLocation,
      }
    })
  }
}
