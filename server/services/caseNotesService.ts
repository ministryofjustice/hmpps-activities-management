import { ServiceUser } from '../@types/express'
import CaseNotesApiClient from '../data/caseNotesApiClient'
import { CaseNote } from '../@types/caseNotesApi/types'

export default class CaseNotesService {
  constructor(private readonly caseNotesApiClient: CaseNotesApiClient) {}

  async getCaseNote(prisonerNumber: string, caseNoteId: number, user: ServiceUser): Promise<CaseNote> {
    return this.caseNotesApiClient.getCaseNote(prisonerNumber, caseNoteId, user)
  }
}
