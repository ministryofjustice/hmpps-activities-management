import { NextFunction, Request, Response } from 'express'

import { when } from 'jest-when'
import createHttpError from 'http-errors'
import ActivitiesService from '../../../../services/activitiesService'
import CaseNotesService from '../../../../services/caseNotesService'
import UserService from '../../../../services/userService'
import ViewSuspensionsRoutes, { PaidType } from './viewSuspensions'
import { PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { CaseNote } from '../../../../@types/caseNotesApi/types'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'
import { PrisonerSuspensionStatus } from '../../manage-allocations/journey'

jest.mock('../../../../services/userService')
jest.mock('../../../../services/caseNotesService')
jest.mock('../../../../services/activitiesService')

const userService = new UserService(null, null, null) as jest.Mocked<UserService>
const caseNotesService = new CaseNotesService(null) as jest.Mocked<CaseNotesService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Suspensions - View Suspensions', () => {
  const handler = new ViewSuspensionsRoutes(activitiesService, caseNotesService, userService)
  let req: Request
  let res: Response
  let next: NextFunction

  const user = {
    username: 'joebloggs',
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        prisonerNumber: 'ABC123',
      },
      query: {},
    } as unknown as Request

    next = jest.fn()

    when(activitiesService.getActivePrisonPrisonerAllocations)
      .calledWith(['ABC123'], res.locals.user)
      .mockResolvedValue([
        {
          prisonerNumber: 'ABC123',
          allocations: [
            {
              id: 1,
            },
            {
              id: 2,
              status: PrisonerSuspensionStatus.SUSPENDED,
              prisonPayBand: {},
              plannedSuspension: {
                caseNoteId: 1,
                dpsCaseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
                plannedBy: 'joebloggs',
                plannedAt: '2024-03-20T17:02:03.652743',
                paid: false,
              },
            },
            {
              id: 3,
              status: PrisonerSuspensionStatus.SUSPENDED,
              prisonPayBand: null,
              plannedSuspension: {
                dpsCaseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
                plannedBy: 'joebloggs',
                plannedAt: '2024-03-20T17:02:03.652743',
                paid: false,
              },
            },
            {
              id: 4,
              status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
              prisonPayBand: {},
              plannedSuspension: {
                caseNoteId: 2,
                dpsCaseNoteId: '41c02efa-a46e-40ef-a2ba-73311e18e51e',
                plannedBy: 'johnsmith',
                plannedAt: '2024-03-19T15:35:17.362243',
                paid: true,
              },
            },
          ],
        },
      ] as PrisonerAllocations[])
  })

  describe('GET', () => {
    it('should render the correct view for a single allocation', async () => {
      req.query.allocationId = '2'

      when(caseNotesService.getCaseNoteMap).mockResolvedValue(
        new Map([
          [
            'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
            { caseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29', text: 'case note one' } as CaseNote,
          ],
        ]),
      )

      when(userService.getUserMap).mockResolvedValue(
        new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as Map<string, UserDetails>,
      )

      await handler.GET(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/view-suspensions', {
        caseNotesMap: new Map([
          [
            'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
            { caseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29', text: 'case note one' },
          ],
        ]),
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]),
        groupedAllocations: [
          [
            {
              id: 2,
              status: PrisonerSuspensionStatus.SUSPENDED,
              prisonPayBand: {},
              plannedSuspension: {
                caseNoteId: 1,
                dpsCaseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
                plannedBy: 'joebloggs',
                plannedAt: '2024-03-20T17:02:03.652743',
                paid: false,
              },
              paidWhileSuspended: PaidType.NO,
            },
          ],
        ],
      })
    })

    it('should throw a 404 when allocation with the given ID is not found', async () => {
      req.query.allocationId = '6'

      await handler.GET(req, res, next)

      expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
    })

    it('should throw a 404 when allocation with the given ID does not have any planned suspensions', async () => {
      req.query.allocationId = '1'

      await handler.GET(req, res, next)

      expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
    })

    it("should render the correct view for all of the prisoner's allocations", async () => {
      when(caseNotesService.getCaseNoteMap).mockResolvedValue(
        new Map([
          [
            'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
            { caseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29', text: 'case note one' } as CaseNote,
          ],
          [
            '41c02efa-a46e-40ef-a2ba-73311e18e51e',
            { caseNoteId: '41c02efa-a46e-40ef-a2ba-73311e18e51e', text: 'case note two' } as CaseNote,
          ],
        ]),
      )

      when(userService.getUserMap).mockResolvedValue(
        new Map([
          ['joebloggs', { name: 'Joe Bloggs' }],
          ['johnsmith', { name: 'John Smith' }],
        ]) as Map<string, UserDetails>,
      )

      await handler.GET(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/activities/suspensions/view-suspensions', {
        caseNotesMap: new Map([
          [
            'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
            { caseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29', text: 'case note one' },
          ],
          [
            '41c02efa-a46e-40ef-a2ba-73311e18e51e',
            { caseNoteId: '41c02efa-a46e-40ef-a2ba-73311e18e51e', text: 'case note two' },
          ],
        ]),
        userMap: new Map([
          ['joebloggs', { name: 'Joe Bloggs' }],
          ['johnsmith', { name: 'John Smith' }],
        ]),
        groupedAllocations: [
          [
            {
              id: 4,
              status: PrisonerSuspensionStatus.SUSPENDED_WITH_PAY,
              prisonPayBand: {},
              plannedSuspension: {
                caseNoteId: 2,
                dpsCaseNoteId: '41c02efa-a46e-40ef-a2ba-73311e18e51e',
                plannedBy: 'johnsmith',
                plannedAt: '2024-03-19T15:35:17.362243',
                paid: true,
              },
              paidWhileSuspended: PaidType.YES,
            },
          ],
          [
            {
              id: 2,
              status: PrisonerSuspensionStatus.SUSPENDED,
              prisonPayBand: {},
              plannedSuspension: {
                caseNoteId: 1,
                dpsCaseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
                plannedBy: 'joebloggs',
                plannedAt: '2024-03-20T17:02:03.652743',
                paid: false,
              },
              paidWhileSuspended: PaidType.NO,
            },
            {
              id: 3,
              status: PrisonerSuspensionStatus.SUSPENDED,
              prisonPayBand: null,
              plannedSuspension: {
                dpsCaseNoteId: 'fe8eaa76-a7b1-4479-a0fc-cab287edda29',
                plannedBy: 'joebloggs',
                plannedAt: '2024-03-20T17:02:03.652743',
                paid: false,
              },
              paidWhileSuspended: PaidType.NO_UNPAID,
            },
          ],
        ],
      })
    })
  })
})
