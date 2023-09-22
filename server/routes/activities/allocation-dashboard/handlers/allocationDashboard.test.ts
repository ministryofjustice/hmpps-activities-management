import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import AllocationDashboardRoutes, { SelectedAllocation } from './allocationDashboard'
import atLeast from '../../../../../jest.setup'
import {
  Activity,
  ActivityCandidate,
  Allocation,
  PrisonerAllocations,
  WaitingListApplication,
} from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { associateErrorsWithProperty, convertToTitleCase, toDateString } from '../../../../utils/utils'
import { IepSummary, IncentiveLevel } from '../../../../@types/incentivesApi/types'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const today = new Date()
const nextWeek = addDays(today, 7)

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

  const mockActivity = {
    attendanceRequired: false,
    category: { code: 'EDUCATION', id: 1, name: 'Education' },
    createdBy: '',
    createdTime: '',
    description: 'A basic maths course suitable for introduction to the subject',
    eligibilityRules: [],
    endDate: toDateString(nextWeek),
    inCell: false,
    minimumIncentiveNomisCode: 'BAS',
    minimumIncentiveLevel: 'Basic',
    outsideWork: false,
    pay: [],
    payPerSession: 'H',
    pieceWork: false,
    prisonCode: '',
    riskLevel: '',
    schedules: [activitySchedule],
    startDate: toDateString(today),
    summary: 'Maths Level 1',
    tier: { code: '', description: '', id: 0 },
    waitingList: [],
    id: 1,
    minimumEducationLevel: [],
  } as unknown as Activity

  const tomorrow = addDays(today, 1)

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
      body: {},
      params: {},
      session: {},
    } as unknown as Request

    when(activitiesService.getActivity)
      .calledWith(atLeast(1))
      .mockResolvedValueOnce({
        ...mockActivity,
        startDate: toDateString(tomorrow),
      })
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    beforeEach(() => {
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [{ incentiveNomisCode: 'BAS' }, { incentiveNomisCode: 'STD' }, { incentiveNomisCode: 'ENH' }],
          schedules: [activitySchedule],
        } as unknown as Activity)
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([
          { levelCode: 'BAS', levelName: 'Basic' },
          { levelCode: 'STD', levelName: 'Standard' },
          { levelCode: 'ENH', levelName: 'Enhanced' },
        ] as IncentiveLevel[])
      when(activitiesService.getAllocationsWithParams)
        .calledWith(atLeast(1))
        .mockResolvedValue([
          {
            id: 1,
            prisonerNumber: 'ABC123',
            allocatedTime: '2023-02-17T15:22:00',
            startDate: '2023-02-17',
            prisonerName: 'Joe Bloggs',
            cellLocation: 'MDI-1-1-101',
            earliestReleaseDate: { releaseDate: '2023-12-25' },
          },
          {
            id: 2,
            prisonerNumber: '321CBA',
            allocatedTime: '2023-02-16T12:43:00',
            startDate: '2023-02-16',
            prisonerName: 'John Smith',
            cellLocation: 'MDI-1-1-103',
            earliestReleaseDate: { releaseDate: '2023-12-26' },
          },
        ] as Allocation[])
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['A0013DZ']))
        .mockResolvedValue([
          {
            prisonerNumber: 'A0013DZ',
            firstName: 'RODNEY',
            lastName: 'REINDEER',
            cellLocation: 'MDI-4-2-009',
            alerts: [
              {
                alertType: 'R',
                alertCode: 'RME',
              },
            ],
            currentIncentive: {
              level: {
                description: 'Standard',
              },
            },
          },
        ] as Prisoner[])
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(atLeast(['ABC123', '321CBA']))
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            allocations: [
              { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
              { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
            ],
          },
          {
            prisonerNumber: '321CBA',
            allocations: [
              { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
              { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
            ],
          },
        ] as PrisonerAllocations[])
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(atLeast(['A0013DZ']))
        .mockResolvedValue([
          {
            prisonerNumber: 'A0013DZ',
            allocations: [
              { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
              { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
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
              earliestReleaseDate: {
                releaseDate: null,
              },
            } as ActivityCandidate,
          ],
        })
      when(activitiesService.fetchActivityWaitlist)
        .calledWith(atLeast(1))
        .mockResolvedValue([
          {
            id: 1,
            scheduleId: 1,
            prisonerNumber: 'A0013DZ',
            status: 'PENDING',
            requestedDate: '2023-08-07',
            requestedBy: 'Activities Management',
          },
        ] as WaitingListApplication[])
    })

    it('should render the correct view', async () => {
      req.params = { activityId: '1' }
      req.query = { candidateQuery: 'jack' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          schedule: activitySchedule,
          dailySlots: {
            '1': [
              {
                day: 'Monday',
                slots: ['am'],
              },
              {
                day: 'Tuesday',
                slots: ['am'],
              },
              {
                day: 'Wednesday',
                slots: ['am'],
              },
              {
                day: 'Thursday',
                slots: ['am'],
              },
              {
                day: 'Friday',
                slots: ['am'],
              },
              {
                day: 'Saturday',
                slots: ['am'],
              },
              {
                day: 'Sunday',
                slots: ['am'],
              },
            ],
          },
          scheduleWeeks: 1,
          currentWeek: 1,
          currentlyAllocated: [
            {
              allocationId: 1,
              cellLocation: 'MDI-1-1-101',
              startDate: new Date(2023, 1, 17),
              endDate: null,
              name: 'Joe Bloggs',
              otherAllocations: [
                {
                  activityId: 2,
                  scheduleName: 'other schedule',
                },
              ],
              prisonerNumber: 'ABC123',
              earliestReleaseDate: { releaseDate: '2023-12-25' },
            },
            {
              allocationId: 2,
              cellLocation: 'MDI-1-1-103',
              startDate: new Date(2023, 1, 16),
              endDate: null,
              name: 'John Smith',
              otherAllocations: [
                {
                  activityId: 2,
                  scheduleName: 'other schedule',
                },
              ],
              prisonerNumber: '321CBA',
              earliestReleaseDate: { releaseDate: '2023-12-26' },
            },
          ],
          waitlistSize: 1,
          waitlistedPrisoners: [
            {
              cellLocation: 'MDI-4-2-009',
              name: 'RODNEY REINDEER',
              otherAllocations: [
                {
                  activityId: 2,
                  scheduleName: 'other schedule',
                },
              ],
              prisonerNumber: 'A0013DZ',
              requestDate: new Date(2023, 7, 7),
              requestedBy: 'Activities Management',
              status: 'PENDING',
              waitlistApplicationId: 1,
              currentIncentive: 'Standard',
              alerts: [
                {
                  alertCode: 'RME',
                  alertType: 'R',
                },
              ],
            },
          ],
          pagedCandidates: {
            content: [
              {
                cellLocation: '4-2-009',
                name: 'RODNEY REINDEER',
                otherAllocations: [],
                prisonerNumber: 'A0013DZ',
                earliestReleaseDate: { releaseDate: null },
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
        }),
      )
    })

    it('should calculate suitable iep correctly', async () => {
      req.params = { activityId: '1' }
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [{ incentiveNomisCode: 'STD' }, { incentiveNomisCode: 'ENH' }],
          schedules: [activitySchedule],
        } as unknown as Activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        .mockResolvedValue({ pay: [], riskLevel: 'low', schedules: [activitySchedule] } as unknown as Activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        .mockResolvedValue({ pay: [], riskLevel: 'medium', schedules: [activitySchedule] } as unknown as Activity)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          suitableForWra: 'Low or Medium',
        }),
      )
    })

    it('should calculate suitable workplace risk assessment correctly - HIGH', async () => {
      req.params = { activityId: '1' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        'pages/activities/allocation-dashboard/allocation-dashboard',
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
        .mockResolvedValue({
          pay: [{ incentiveLevel: 'STD' }, { incentiveLevel: 'ENH' }],
          schedules: [{ id: 1 }],
        } as Activity)

      prisonService.getPrisonerIepSummary = jest.fn()
      when(prisonService.getPrisonerIepSummary)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({ iepLevel: 'ENH' } as IepSummary)

      req.body = { selectedAllocation: 'ABC123' }
      req.params = { activityId: '1' }

      await handler.ALLOCATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/activities/allocate/prisoner/ABC123?scheduleId=1`)
    })

    it('should redirect to allocate when a waitlist application is selected', async () => {
      activitiesService.fetchWaitlistApplication = jest.fn()
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue({ prisonerNumber: 'ABC123' } as WaitingListApplication)

      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          pay: [{ incentiveLevel: 'STD' }, { incentiveLevel: 'ENH' }],
          schedules: [{ id: 1 }],
        } as Activity)

      prisonService.getPrisonerIepSummary = jest.fn()
      when(prisonService.getPrisonerIepSummary)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({ iepLevel: 'ENH' } as IepSummary)

      req.body = { selectedWaitlistApplication: 1 }
      req.params = { activityId: '1' }

      await handler.ALLOCATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/activities/allocate/prisoner/ABC123?scheduleId=1`)
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

  describe('DEALLOCATE', () => {
    const prisoners = [
      {
        prisonerNumber: 'G4793VF',
        firstName: 'Joe',
        lastName: 'Bloggs',
        cellLocation: 'MDI-1-1-101',
        releaseDate: '2023-12-25',
      },
      {
        prisonerNumber: 'A9477DY',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: 'MDI-1-1-103',
        releaseDate: '2023-12-26',
      },
    ] as Prisoner[]

    beforeEach(() => {
      when(activitiesService.getActivity).calledWith(atLeast(1)).mockResolvedValue(mockActivity)

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['G4793VF', 'A9477DY']))
        .mockResolvedValue(prisoners)
    })

    it('should set session and redirect to deallocation date page', async () => {
      req.body.selectedAllocations = ['G4793VF', 'A9477DY']
      req.params.activityId = '1'

      await handler.DEALLOCATE(req, res)

      expect(req.session.deallocateJourney).toEqual({
        allocationsToRemove: ['G4793VF', 'A9477DY'],
        scheduleId: 1,
        latestAllocationStartDate: '2022-10-10',
        activity: {
          id: 1,
          activityName: 'A basic maths course suitable for introduction to the subject',
          endDate: toDateString(nextWeek),
        },
        prisoners: prisoners.map(i => ({
          name: convertToTitleCase(`${i.firstName} ${i.lastName}`),
          prisonerNumber: i.prisonerNumber,
          cellLocation: i.cellLocation,
        })),
      })

      expect(res.redirect).toBeCalledWith('/activities/deallocate/date')
    })
  })

  describe('VIEW_APPLICATION', () => {
    it('should redirect to view a waitlist application for the selected id', async () => {
      activitiesService.fetchWaitlistApplication = jest.fn()
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue({ id: 1 } as WaitingListApplication)

      req.body = { selectedWaitlistApplication: 1 }

      await handler.VIEW_APPLICATION(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/activities/waitlist/view-and-edit/1/view`)
    })
  })

  describe('UPDATE', () => {
    it('should redirect to update the selected allocation', async () => {
      req.body = { selectedAllocations: ['ABC123'] }
      req.params = { activityId: '1' }

      await handler.UPDATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/activities/allocation-dashboard/1/check-allocation/ABC123`)
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

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(SelectedAllocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { error: 'Select a candidate to allocate them', property: 'selectedAllocation' },
        { error: 'Select a waitlist application to allocate the candidate', property: 'selectedWaitlistApplication' },
      ])
    })

    it('passes validation when allocation is selected', async () => {
      const body = {
        selectedAllocation: 'ABC123',
      }

      const requestObject = plainToInstance(SelectedAllocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation when waitlist application is selected', async () => {
      const body = {
        selectedWaitlistApplication: '1',
      }

      const requestObject = plainToInstance(SelectedAllocation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
