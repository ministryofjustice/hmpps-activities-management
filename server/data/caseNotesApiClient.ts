import config, { ApiConfig } from '../config'

import AbstractHmppsRestClient from './abstractHmppsRestClient'
import { ServiceUser } from '../@types/express'
import { CaseNote } from '../@types/caseNotesApi/types'

export default class CaseNotesApiClient extends AbstractHmppsRestClient {
  constructor() {
    super('Case Notes API', config.apis.caseNotesApi as ApiConfig)
  }

  async getCaseNote(prisonerNumber: string, caseNoteId: number, user: ServiceUser): Promise<CaseNote> {
    return this.get({ path: `/case-notes/${prisonerNumber}/${caseNoteId}` }, user)
  }
}
