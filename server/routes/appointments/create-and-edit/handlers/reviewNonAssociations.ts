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
    const { preserveHistory, prisonerRemoved } = req.query
    const backLinkHref = 'review-prisoners-alerts'
    const { prisoners } = appointmentJourney

    // If there is only one prisoner added to the appointment, non-associations are impossible
    if (prisoners.length < 2) return res.redirect('name')

    const prisonerNumbers = prisoners.map(prisoner => prisoner.number)
    const nonAssociations = await this.nonAssociationsService.getNonAssociationsBetween(prisonerNumbers, user)

    // If there are no non-associations, and it isn't because a user has removed them via this page, redirect
    if (!nonAssociations.length && !prisonerRemoved) return res.redirect('name')
    const enhancedNonAssociations = await this.enhanceNonAssociations(nonAssociations, user)

    return res.render('pages/appointments/create-and-edit/review-non-associations', {
      appointmentId,
      backLinkHref,
      preserveHistory,
      nonAssociations: enhancedNonAssociations,
      attendeesTotalCount: prisonerNumbers.length,
      displayNonAssocDealtWithMessage: !enhancedNonAssociations.length && prisonerRemoved === 'true',
    })
  }

  REMOVE = async (req: Request, res: Response): Promise<void> => {
    const { prisonNumber } = req.params

    req.session.appointmentJourney.prisoners = req.session.appointmentJourney.prisoners.filter(
      prisoner => prisoner.number !== prisonNumber,
    )

    res.redirect(
      `../../review-non-associations?prisonerRemoved=true${req.query.preserveHistory ? '&preserveHistory=true' : ''}`,
    )
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    return res.redirectOrReturn('name')
  }

  private enhanceNonAssociations = async (nonAssociations: NonAssociation[], user: ServiceUser) => {
    if (!nonAssociations.length) return []

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
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      return { nonAssociations: nonAssociationsList, primaryPrisoner }
    })

    return nonAssociationCardData
  }
}
