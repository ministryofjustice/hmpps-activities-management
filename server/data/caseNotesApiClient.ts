import { asSystem, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import logger from '../../logger'
import config from '../config'
import { ServiceUser } from '../@types/express'
import { CaseNote } from '../@types/caseNotesApi/types'

const CASELOAD_HEADER = (caseloadId: string) => ({ CaseloadId: caseloadId })

export default class CaseNotesApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Case Notes API', config.apis.caseNotesApi, logger, authenticationClient)
  }

  async getCaseNote(prisonerNumber: string, caseNoteId: string, user: ServiceUser): Promise<CaseNote> {
    return this.get(
      {
        path: `/case-notes/${prisonerNumber}/${caseNoteId}`,
        headers: CASELOAD_HEADER('***'),
      },
      asSystem(user.username),
    )
  }
}
