import { when } from 'jest-when'
import CaseNotesApiClient from '../data/caseNotesApiClient'
import CaseNotesService from './caseNotesService'
import { CaseNote } from '../@types/caseNotesApi/types'
import { ServiceUser } from '../@types/express'

jest.mock('../data/caseNotesApiClient')

describe('Case notes service service', () => {
  let caseNotesApiClient: jest.Mocked<CaseNotesApiClient>
  let caseNotesService: CaseNotesService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  beforeEach(() => {
    caseNotesApiClient = new CaseNotesApiClient() as jest.Mocked<CaseNotesApiClient>
    caseNotesService = new CaseNotesService(caseNotesApiClient)

    when(caseNotesApiClient.getCaseNote).mockResolvedValue({ text: 'test case note' } as CaseNote)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getCaseNote', () => {
    it('Retrieves a case note', async () => {
      const result = await caseNotesService.getCaseNote('ABC123', 1, user)

      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith('ABC123', 1, user)

      expect(result.text).toEqual('test case note')
    })
  })
})
