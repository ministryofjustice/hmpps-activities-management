import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'
import PrisonService from '../../../services/prisonService'
import AllocationDashboardRoutes, { SelectedAllocation } from './allocationDashboard'
import atLeast from '../../../../jest.setup'
import { Activity, Allocation, PrisonerAllocations } from '../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'
import { associateErrorsWithProperty } from '../../../utils/utils'
import { IepSummary, IncentiveLevel } from '../../../@types/incentivesApi/types'

jest.mock('../../../services/prisonService')
jest.mock('../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new AllocationDashboardRoutes(prisonService, activitiesService)
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoad: {
      caseLoadId: 'MDI',
    },
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      query: {
        page: 0,
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    beforeEach(() => {
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [{ incentiveNomisCode: 'BAS' }, { incentiveNomisCode: 'STD' }, { incentiveNomisCode: 'ENH' }],
          schedules: [{ scheduleId: 1 }],
        } as unknown as Activity)
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
          { levelCode: 'ENH', levelName: 'Enhanced' },
        ] as IncentiveLevel[])
      when(activitiesService.getAllocations)
        .calledWith(atLeast(1))
        .mockResolvedValue([
          {
            id: 1,
            prisonerNumber: 'ABC123',
            allocatedTime: '2023-02-17T15:22:00',
            startDate: '2023-02-17',
          },
          {
            id: 2,
            prisonerNumber: '321CBA',
            allocatedTime: '2023-02-16T12:43:00',
            startDate: '2023-02-16',
          },
        ] as Allocation[])
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['ABC123', '321CBA']))
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            firstName: 'Joe',
            lastName: 'Bloggs',
            cellLocation: 'MDI-1-1-101',
            releaseDate: '2023-12-25',
          },
          {
            prisonerNumber: '321CBA',
            firstName: 'John',
            lastName: 'Smith',
            cellLocation: 'MDI-1-1-103',
            releaseDate: '2023-12-26',
          },
        ] as Prisoner[])
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(atLeast(['ABC123', '321CBA']))
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            allocations: [
              { scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
              { scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
            ],
          },
          {
            prisonerNumber: '321CBA',
            allocations: [
              { scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
              { scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
            ],
          },
        ] as PrisonerAllocations[])
      when(activitiesService.getActivityCandidates)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          content: [
            {
              name: 'RODNEY REINDEER',
              prisonerNumber: 'A0013DZ',
              cellLocation: '4-2-009',
              otherAllocations: [],
              releaseDate: null,
            },
          ],
        })
    })

    it('should render the correct view', async () => {
      req.params = { activityId: '1' }
      req.query = { candidateQuery: 'jack' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocation-dashboard/allocation-dashboard', {
        schedule: { scheduleId: 1 },
        currentlyAllocated: [
          {
            allocationId: 1,
            cellLocation: 'MDI-1-1-101',
            startDate: new Date(2023, 1, 17),
            endDate: null,
            name: 'Joe Bloggs',
            otherAllocations: [
              {
                id: 2,
                scheduleName: 'other schedule',
              },
            ],
            prisonerNumber: 'ABC123',
            releaseDate: new Date(2023, 11, 25),
          },
          {
            allocationId: 2,
            cellLocation: 'MDI-1-1-103',
            startDate: new Date(2023, 1, 16),
            endDate: null,
            name: 'John Smith',
            otherAllocations: [
              {
                id: 2,
                scheduleName: 'other schedule',
              },
            ],
            prisonerNumber: '321CBA',
            releaseDate: new Date(2023, 11, 26),
          },
        ],
        pagedCandidates: {
          content: [
            {
              cellLocation: '4-2-009',
              name: 'RODNEY REINDEER',
              otherAllocations: [],
              prisonerNumber: 'A0013DZ',
              releaseDate: null,
            },
          ],
        },
        incentiveLevels: [
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
          { levelCode: 'ENH', levelName: 'Enhanced' },
        ],
        filters: {
          candidateQuery: 'jack',
        },
        suitableForIep: 'All Incentive Levels',
        suitableForWra: 'Low or Medium or High',
      })
    })

    it('should calculate suitable iep correctly', async () => {
      req.params = { activityId: '1' }
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [{ incentiveNomisCode: 'STD' }, { incentiveNomisCode: 'ENH' }],
          schedules: [],
        } as unknown as Activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            incentiveLevelFilter: 'Standard, Enhanced',
          }),
          suitableForIep: 'Standard, Enhanced',
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        ['Standard', 'Enhanced'],
        undefined,
        expect.anything(),
        undefined,
        0,
      )
    })

    it('should calculate suitable workplace risk assessment correctly - LOW', async () => {
      req.params = { activityId: '1' }
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({ pay: [], riskLevel: 'low', schedules: [] } as unknown as Activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          suitableForWra: 'Low',
        }),
      )
    })

    it('should calculate suitable workplace risk assessment correctly - MEDIUM', async () => {
      req.params = { activityId: '1' }
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({ pay: [], riskLevel: 'medium', schedules: [] } as unknown as Activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          suitableForWra: 'Low or Medium',
        }),
      )
    })

    it('should calculate suitable workplace risk assessment correctly - HIGH', async () => {
      req.params = { activityId: '1' }
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({ pay: [], riskLevel: 'high', schedules: [] } as unknown as Activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          suitableForWra: 'Low or Medium or High',
        }),
      )
    })

    it('should return correct candidates with risk level filter set to any', async () => {
      req.params = { activityId: '1' }
      req.query.riskLevelFilter = 'Any Workplace Risk Assessment'

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            riskLevelFilter: 'Any Workplace Risk Assessment',
          }),
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
      )
    })

    it('should return correct candidates with risk level filter set to none', async () => {
      req.params = { activityId: '1' }
      req.query.riskLevelFilter = 'No Workplace Risk Assessment'

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            riskLevelFilter: 'No Workplace Risk Assessment',
          }),
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        ['NONE'],
        undefined,
        undefined,
        0,
      )
    })

    it('should return correct candidates with employment filter set to In work', async () => {
      req.params = { activityId: '1' }
      req.query.employmentFilter = 'In work'

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            employmentFilter: 'In work',
          }),
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        true,
        undefined,
        0,
      )
    })

    it('should return correct candidates with employment filter set to Everyone', async () => {
      req.params = { activityId: '1' }
      req.query.employmentFilter = 'Everyone'

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            employmentFilter: 'Everyone',
          }),
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        undefined,
        undefined,
        0,
      )
    })

    it('should return correct candidates with employment filter set to Not in work', async () => {
      req.params = { activityId: '1' }
      req.query.employmentFilter = 'Not in work'

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            employmentFilter: 'Not in work',
          }),
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        false,
        undefined,
        0,
      )
    })

    it('should return correct candidates with search string given', async () => {
      req.params = { activityId: '1' }
      req.query.candidateQuery = 'joe'

      await handler.GET(req, res)

      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        undefined,
        'joe',
        0,
      )
    })
  })

  describe('ALLOCATE', () => {
    it('should redirect to allocate the selected candidate', async () => {
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({ pay: [{ incentiveLevel: 'STD' }, { incentiveLevel: 'ENH' }] } as Activity)

      prisonService.getPrisonerIepSummary = jest.fn()
      when(prisonService.getPrisonerIepSummary)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({ iepLevel: 'ENH' } as IepSummary)

      req.body = { selectedAllocation: 'ABC123' }
      req.params = { activityId: '1' }

      await handler.ALLOCATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/allocate/prisoner/ABC123?scheduleId=1`)
    })

    it('should throw validation error if a pay rate doesnt exist to match the inmates iep level', async () => {
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({ pay: [{ incentiveLevel: 'STD' }, { incentiveLevel: 'ENH' }] } as Activity)

      prisonService.getPrisonerIepSummary = jest.fn()
      when(prisonService.getPrisonerIepSummary)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({ iepLevel: 'BAS' } as IepSummary)

      req.body = { selectedAllocation: 'ABC123' }
      req.params = { activityId: '1' }

      await handler.ALLOCATE(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'selectedAllocation',
        'No suitable pay rate exists for this candidate',
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(SelectedAllocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'selectedAllocation', error: 'Select a candidate to allocate them' }])
    })

    it('passes validation', async () => {
      const body = {
        selectedAllocation: 'MDI',
      }

      const requestObject = plainToInstance(SelectedAllocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })

  describe('UPDATE', () => {
    it('should redirect to update the selected allocation', async () => {
      req.body = { selectedAllocations: ['ABC123'] }
      req.params = { activityId: '1' }

      await handler.UPDATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/allocation-dashboard/1/check-allocation/ABC123`)
    })

    it('validation fails if multiple allocations are selected', async () => {
      req.body = { selectedAllocations: ['ABC123', 'ABC124'] }

      await handler.UPDATE(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'selectedAllocations',
        'You can only select one allocation to edit',
      )
    })
  })
})
