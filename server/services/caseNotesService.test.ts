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

      const result = await caseNotesService.getCaseNote('ABC123', 'b7602cc8-e769-4cbb-8194-62d8e655992a', user)

      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith(
        'ABC123',
        'b7602cc8-e769-4cbb-8194-62d8e655992a',
        user,
      )

      expect(result.text).toEqual('test case note')
    })
  })

  describe('getCaseNoteMap', () => {
    it('Retrieves a list of case notes associated by case note ID', async () => {
      when(caseNotesApiClient.getCaseNote)
        .calledWith(atLeast('b7602cc8-e769-4cbb-8194-62d8e655992a'))
        .mockResolvedValue({ caseNoteId: 'b7602cc8-e769-4cbb-8194-62d8e655992a', text: 'case note one' } as CaseNote)
      when(caseNotesApiClient.getCaseNote)
        .calledWith(atLeast('41c02efa-a46e-40ef-a2ba-73311e18e51e'))
        .mockResolvedValue({ caseNoteId: '41c02efa-a46e-40ef-a2ba-73311e18e51e', text: 'case note two' } as CaseNote)
      when(caseNotesApiClient.getCaseNote)
        .calledWith(atLeast('6f1de2dc-0a9f-43cf-b94e-f9b5f408776e'))
        .mockResolvedValue({ caseNoteId: '6f1de2dc-0a9f-43cf-b94e-f9b5f408776e', text: 'case note three' } as CaseNote)

      const result = await caseNotesService.getCaseNoteMap(
        'ABC123',
        [
          'b7602cc8-e769-4cbb-8194-62d8e655992a',
          undefined,
          '6f1de2dc-0a9f-43cf-b94e-f9b5f408776e',
          '41c02efa-a46e-40ef-a2ba-73311e18e51e',
        ],
        user,
      )

      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledTimes(3)
      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith(
        'ABC123',
        'b7602cc8-e769-4cbb-8194-62d8e655992a',
        user,
      )
      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith(
        'ABC123',
        '41c02efa-a46e-40ef-a2ba-73311e18e51e',
        user,
      )
      expect(caseNotesApiClient.getCaseNote).toHaveBeenCalledWith(
        'ABC123',
        '6f1de2dc-0a9f-43cf-b94e-f9b5f408776e',
        user,
      )

      expect(result).toEqual(
        new Map([
          [
            'b7602cc8-e769-4cbb-8194-62d8e655992a',
            { caseNoteId: 'b7602cc8-e769-4cbb-8194-62d8e655992a', text: 'case note one' },
          ],
          [
            '41c02efa-a46e-40ef-a2ba-73311e18e51e',
            { caseNoteId: '41c02efa-a46e-40ef-a2ba-73311e18e51e', text: 'case note two' },
          ],
          [
            '6f1de2dc-0a9f-43cf-b94e-f9b5f408776e',
            { caseNoteId: '6f1de2dc-0a9f-43cf-b94e-f9b5f408776e', text: 'case note three' },
          ],
        ]),
      )
    })
  })
})
