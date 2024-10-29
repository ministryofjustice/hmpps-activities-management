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

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect(`../../review-non-associations${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    if (req.query.preserveHistory) {
      req.session.returnTo = 'schedule?preserveHistory=true'
    }

    return res.redirectOrReturn('name')
  }

  private enhanceNonAssociations = async (nonAssociations: NonAssociation[], user: ServiceUser) => {
    const prisonerNumbers = new Set(
      nonAssociations.flatMap(({ firstPrisonerNumber, secondPrisonerNumber }) => [
        firstPrisonerNumber,
        secondPrisonerNumber,
      ]),
    )
    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(Array.from(prisonerNumbers), user)
    const prisonerMap = new Map(
      prisoners.map(({ prisonerNumber, firstName, lastName, cellLocation }) => [
        prisonerNumber,
        { prisonerNumber, name: `${firstName} ${lastName}`, cellLocation },
      ]),
    )

    const nonAssociationCardData = prisoners.map(prisoner => {
      const primaryPrisoner = {
        name: `${prisoner.firstName} ${prisoner.lastName}`,
        prisonerNumber: prisoner.prisonerNumber,
      }

      const nonAssociationsList = nonAssociations
        .filter(
          ({ firstPrisonerNumber, secondPrisonerNumber }) =>
            firstPrisonerNumber === prisoner.prisonerNumber || secondPrisonerNumber === prisoner.prisonerNumber,
        )
        .map(({ firstPrisonerNumber, secondPrisonerNumber, whenUpdated }) => {
          const otherPrisonerNumber =
            firstPrisonerNumber === prisoner.prisonerNumber ? secondPrisonerNumber : firstPrisonerNumber
          const { prisonerNumber, name, cellLocation } = prisonerMap.get(otherPrisonerNumber)
          return { prisonerNumber, name, cellLocation, lastUpdated: whenUpdated }
        })
      return { nonAssociations: nonAssociationsList, primaryPrisoner }
    })

    return nonAssociationCardData
  }
}
