import { Prisoner } from '../@types/prisonerOffenderSearchImport/types'
import PrisonService from './prisonService'
import { toDateString } from '../utils/utils'
import { ServiceUser } from '../@types/express'

export default class AppointeeAttendeeService {
  constructor(private readonly prisonService: PrisonService) {}

  async findUnavailableAttendees(attendeePrisonerNumbers: string[], user: ServiceUser): Promise<string[]> {
    const now = toDateString(new Date())

    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(attendeePrisonerNumbers, user)

    const isPermanentlyReleased = (prisoner: Prisoner) =>
      prisoner.status === 'INACTIVE OUT' &&
      prisoner.confirmedReleaseDate <= now &&
      prisoner.lastMovementTypeCode === 'REL'

    const notInExpectedPrison = (prisoner: Prisoner) =>
      prisoner.inOutStatus === 'OUT' && prisoner.prisonId !== user.activeCaseLoadId

    return prisoners
      .filter(prisoner => isPermanentlyReleased(prisoner) || notInExpectedPrison(prisoner))
      .map(prisoner => prisoner.prisonerNumber)
  }
}
