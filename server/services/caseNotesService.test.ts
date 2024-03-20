import { when } from 'jest-when'
import CaseNotesApiClient from '../data/caseNotesApiClient'
import CaseNotesService from './caseNotesService'
import { CaseNote } from '../@types/caseNotesApi/types'
import { ServiceUser } from '../@types/express'
import atLeast from '../../jest.setup'

jest.mock('../data/caseNotesApiClient')

describe('Case notes service service', () => {
  let caseNotesApiClient: jest.Mocked<CaseNotesApiClient>
  let caseNotesService: CaseNotesService

  const user = { activeCaseLoadId: 'MDI', username: 'USER1', displayName: 'John Smith' } as ServiceUser

  beforeEach(() => {
    caseNotesApiClient = new CaseNotesApiClient() as jest.Mocked<CaseNotesApiClient>
    caseNotesService = new CaseNotesService(caseNotesApiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getCaseNote', () => {
    it('Retrieves a case note', async () => {
      when(caseNotesApiClient.getCaseNote).mockResolvedValue({ text: 'test case note' } as CaseNote)

      const result = await caseNotesService.getCaseNote('ABC123', 1, user)

      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith('ABC123', 1, user)

      expect(result.text).toEqual('test case note')
    })
  })

  describe('getCaseNoteMap', () => {
    it('Retrieves a list of case notes associated by case note ID', async () => {
      when(caseNotesApiClient.getCaseNote)
        .calledWith(atLeast(1))
        .mockResolvedValue({ caseNoteId: '1', text: 'case note one' } as CaseNote)
      when(caseNotesApiClient.getCaseNote)
        .calledWith(atLeast(2))
        .mockResolvedValue({ caseNoteId: '2', text: 'case note two' } as CaseNote)

      const result = await caseNotesService.getCaseNoteMap('ABC123', [1, undefined, 2, 2], user)

      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledTimes(2)
      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith('ABC123', 1, user)
      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith('ABC123', 2, user)

      expect(result).toEqual(
        new Map([
          [1, { caseNoteId: '1', text: 'case note one' }],
          [2, { caseNoteId: '2', text: 'case note two' }],
        ]),
      )
    })
  })
})
