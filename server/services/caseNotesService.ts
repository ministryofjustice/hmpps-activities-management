import _ from 'lodash'
import { ServiceUser } from '../@types/express'
import CaseNotesApiClient from '../data/caseNotesApiClient'
import { CaseNote } from '../@types/caseNotesApi/types'

export default class CaseNotesService {
  constructor(private readonly caseNotesApiClient: CaseNotesApiClient) {}

  async getCaseNote(prisonerNumber: string, caseNoteId: number, user: ServiceUser): Promise<CaseNote> {
    return this.caseNotesApiClient.getCaseNote(prisonerNumber, caseNoteId, user)
  }

  async getCaseNoteMap(
    prisonerNumber: string,
    caseNoteIds: number[],
    user: ServiceUser,
  ): Promise<Map<number, CaseNote>> {
    return Promise.all(
      _.chain(caseNoteIds)
        .filter(Boolean)
        .uniq()
        .map(id => this.getCaseNote(prisonerNumber, id, user))
        .value(),
    ).then(cn => new Map(cn.map(c => [+c.caseNoteId, c])))
  }
}
