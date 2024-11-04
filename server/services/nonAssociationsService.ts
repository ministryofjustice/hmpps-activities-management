import { ServiceUser } from '../@types/express'
import NonAssociationsApiClient from '../data/nonAssociationsApiClient'
import { NonAssociation } from '../@types/nonAssociationsApi/types'
import PrisonService from './prisonService'

export default class NonAssociationsService {
  constructor(
    private readonly nonAssociationsApiClient: NonAssociationsApiClient,
    private readonly prisonService: PrisonService,
  ) {}

  async getNonAssociationsBetween(prisonerNumbers: string[], user: ServiceUser): Promise<NonAssociation[]> {
    return this.nonAssociationsApiClient.getNonAssociationsBetween(prisonerNumbers, user)
  }

  async enhanceNonAssociations(nonAssociations: NonAssociation[], user: ServiceUser) {
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
