import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, startOfYesterday } from 'date-fns'
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
import { associateErrorsWithProperty, toDateString } from '../../../../utils/utils'
import { IepSummary, IncentiveLevel } from '../../../../@types/incentivesApi/types'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

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
    activeCaseLoadId: 'MDI',
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
          paid: true,
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
            prisonerFirstName: 'Joe',
            prisonerLastName: 'Bloggs',
            cellLocation: 'MDI-1-1-101',
            earliestReleaseDate: { releaseDate: '2023-12-25' },
            isUnemployment: false,
            plannedSuspension: { plannedStartDate: '2025-04-20' },
          },
          {
            id: 2,
            prisonerNumber: '321CBA',
            allocatedTime: '2023-02-16T12:43:00',
            startDate: '2023-02-16',
            prisonerName: 'John Smith',
            prisonerFirstName: 'John',
            prisonerLastName: 'Smith',
            cellLocation: 'MDI-1-1-103',
            earliestReleaseDate: { releaseDate: '2023-12-26' },
            isUnemployment: false,
          },
        ] as Allocation[])

      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['A0013DZ', 'B2222CD', 'F4444FF']))
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
          {
            prisonerNumber: 'B2222CD',
            firstName: 'JOE',
            lastName: 'BLOGGS',
            cellLocation: 'MDI-4-2-010',
            alerts: [],
            currentIncentive: {
              level: {
                description: 'Standard',
              },
            },
          },
          {
            prisonerNumber: 'F4444FF',
            firstName: 'ALAN',
            lastName: 'SMITH',
            cellLocation: 'MDI-4-2-011',
            alerts: [],
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
        .calledWith(atLeast(['A0013DZ', 'B2222CD', 'F4444FF']))
        .mockResolvedValue([
          {
            prisonerNumber: 'A0013DZ',
            allocations: [
              { activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
              { activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
            ],
          },
          {
            prisonerNumber: 'B2222CD',
            allocations: [{ activityId: 3, scheduleId: 3, scheduleDescription: 'unemployed', isUnemployment: true }],
          },
          {
            prisonerNumber: 'F4444FF',
            allocations: [],
          },
        ] as PrisonerAllocations[])

      when(activitiesService.getActivityCandidates)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          content: [
            {
              name: 'RODNEY REINDEER',
              firstName: 'RODNEY',
              lastName: 'REINDEER',
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
        .calledWith(atLeast(1, true))
        .mockResolvedValue([
          {
            id: 1,
            scheduleId: 1,
            prisonerNumber: 'A0013DZ',
            status: 'PENDING',
            requestedDate: '2023-08-07',
            requestedBy: 'PRISONER',
            earliestReleaseDate: {
              releaseDate: '2024-02-16',
              isIndeterminateSentence: true,
              isRemand: false,
              isTariffDate: false,
              isImmigrationDetainee: false,
              isConvictedUnsentenced: false,
            },
          },
          {
            id: 2,
            scheduleId: 1,
            prisonerNumber: 'B2222CD',
            status: 'PENDING',
            requestedDate: '2023-08-07',
            requestedBy: 'PRISONER',
            earliestReleaseDate: {
              releaseDate: '2025-11-29',
              isIndeterminateSentence: false,
              isRemand: true,
              isTariffDate: false,
              isImmigrationDetainee: false,
              isConvictedUnsentenced: false,
            },
          },
          {
            id: 3,
            scheduleId: 1,
            prisonerNumber: 'F4444FF',
            status: 'PENDING',
            requestedDate: '2023-08-07',
            requestedBy: 'PRISONER',
            earliestReleaseDate: {
              releaseDate: '2025-11-29',
              isIndeterminateSentence: false,
              isRemand: true,
              isTariffDate: false,
              isImmigrationDetainee: false,
              isConvictedUnsentenced: false,
            },
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
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '10:00',
                    endTime: '11:00',
                  },
                ],
              },
              {
                day: 'Tuesday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '10:00',
                    endTime: '11:00',
                  },
                ],
              },
              {
                day: 'Wednesday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '10:00',
                    endTime: '11:00',
                  },
                ],
              },
              {
                day: 'Thursday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '11:00',
                    endTime: '12:00',
                  },
                ],
              },
              {
                day: 'Friday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '11:00',
                    endTime: '12:00',
                  },
                ],
              },
              {
                day: 'Saturday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '11:00',
                    endTime: '12:00',
                  },
                ],
              },
              {
                day: 'Sunday',
                slots: [
                  {
                    timeSlot: 'AM',
                    startTime: '11:00',
                    endTime: '12:00',
                  },
                ],
              },
            ],
          },
          scheduleWeeks: 1,
          currentWeek: 1,
          currentlyAllocated: [
            {
              allocationId: 1,
              firstName: 'Joe',
              lastName: 'Bloggs',
              prisonerNumber: 'ABC123',
              prisonerPrisonCode: undefined,
              prisonerStatus: undefined,
              cellLocation: 'MDI-1-1-101',
              earliestReleaseDate: { releaseDate: '2023-12-25' },
              startDate: new Date(2023, 1, 17),
              endDate: null,
              status: undefined,
              plannedSuspension: { plannedStartDate: '2025-04-20' },
              otherAllocations: [
                {
                  activityId: 2,
                  scheduleName: 'other schedule',
                },
              ],
              nonAssociations: undefined,
              activityId: undefined,
            },
            {
              allocationId: 2,
              firstName: 'John',
              lastName: 'Smith',
              prisonerNumber: '321CBA',
              prisonerPrisonCode: undefined,
              prisonerStatus: undefined,
              cellLocation: 'MDI-1-1-103',
              earliestReleaseDate: { releaseDate: '2023-12-26' },
              startDate: new Date(2023, 1, 16),
              endDate: null,
              status: undefined,
              plannedSuspension: undefined,
              otherAllocations: [
                {
                  activityId: 2,
                  scheduleName: 'other schedule',
                },
              ],
              nonAssociations: undefined,
              activityId: undefined,
            },
          ],
          waitlistSize: 3,
          waitlistedPrisoners: [
            {
              cellLocation: 'MDI-4-2-009',
              firstName: 'RODNEY',
              lastName: 'REINDEER',
              otherAllocations: [
                {
                  activityId: 2,
                  scheduleName: 'other schedule',
                  isUnemployment: false,
                },
              ],
              prisonerNumber: 'A0013DZ',
              requestDate: new Date(2023, 7, 7),
              requestedBy: 'Self-requested',
              status: 'PENDING',
              waitlistApplicationId: 1,
              currentIncentive: 'Standard',
              earliestReleaseDate: {
                releaseDate: '2024-02-16',
                isIndeterminateSentence: true,
                isRemand: false,
                isTariffDate: false,
                isImmigrationDetainee: false,
                isConvictedUnsentenced: false,
              },
              alerts: [
                {
                  alertCode: 'RME',
                  alertType: 'R',
                },
              ],
            },
            {
              cellLocation: 'MDI-4-2-010',
              firstName: 'JOE',
              lastName: 'BLOGGS',
              otherAllocations: [
                {
                  activityId: 3,
                  scheduleName: 'unemployed',
                  isUnemployment: true,
                },
              ],
              prisonerNumber: 'B2222CD',
              requestDate: new Date(2023, 7, 7),
              requestedBy: 'Self-requested',
              status: 'PENDING',
              waitlistApplicationId: 2,
              currentIncentive: 'Standard',
              earliestReleaseDate: {
                releaseDate: '2025-11-29',
                isIndeterminateSentence: false,
                isRemand: true,
                isTariffDate: false,
                isImmigrationDetainee: false,
                isConvictedUnsentenced: false,
              },
              alerts: [],
            },
            {
              cellLocation: 'MDI-4-2-011',
              firstName: 'ALAN',
              lastName: 'SMITH',
              otherAllocations: [],
              prisonerNumber: 'F4444FF',
              requestDate: new Date(2023, 7, 7),
              requestedBy: 'Self-requested',
              status: 'PENDING',
              waitlistApplicationId: 3,
              currentIncentive: 'Standard',
              earliestReleaseDate: {
                releaseDate: '2025-11-29',
                isIndeterminateSentence: false,
                isRemand: true,
                isTariffDate: false,
                isImmigrationDetainee: false,
                isConvictedUnsentenced: false,
              },
              alerts: [],
            },
          ],
          pagedCandidates: {
            content: [
              {
                cellLocation: '4-2-009',
                name: 'RODNEY REINDEER',
                firstName: 'RODNEY',
                lastName: 'REINDEER',
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
          activeAllocations: 3,
        }),
      )
    })

    it('should calculate suitable iep correctly', async () => {
      req.params = { activityId: '1' }
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          paid: true,
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
        undefined,
        false,
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
        false,
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
        false,
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
          waitlistSize: 3,
          waitlistedPrisoners: [
            expect.objectContaining({
              prisonerNumber: 'A0013DZ',
            }),
          ],
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        true,
        false,
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
          waitlistSize: 3,
          waitlistedPrisoners: expect.arrayContaining([
            expect.objectContaining({
              prisonerNumber: 'A0013DZ',
            }),
            expect.objectContaining({
              prisonerNumber: 'B2222CD',
            }),
            expect.objectContaining({
              prisonerNumber: 'F4444FF',
            }),
          ]),
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        undefined,
        false,
        undefined,
        0,
      )
    })

    it('should return correct candidates with employment filter set to Not allocated to any activity', async () => {
      req.params = { activityId: '1' }
      req.query.employmentFilter = 'Not allocated to any activity'

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/allocation-dashboard/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            employmentFilter: 'Not allocated to any activity',
          }),
          waitlistSize: 3,
          waitlistedPrisoners: expect.arrayContaining([
            expect.objectContaining({
              prisonerNumber: 'F4444FF',
            }),
          ]),
        }),
      )

      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        undefined,
        true,
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
          waitlistSize: 3,
          waitlistedPrisoners: [
            expect.objectContaining({
              prisonerNumber: 'B2222CD',
            }),
            expect.objectContaining({
              prisonerNumber: 'F4444FF',
            }),
          ],
        }),
      )
      expect(activitiesService.getActivityCandidates).toHaveBeenCalledWith(
        1,
        user,
        undefined,
        undefined,
        false,
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
        false,
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

      expect(res.redirect).toHaveBeenCalledWith(`/activities/allocations/create/prisoner/ABC123?scheduleId=1`)
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

      expect(res.redirect).toHaveBeenCalledWith(`/activities/allocations/create/prisoner/ABC123?scheduleId=1`)
    })

    it('should throw validation error if a pay rate doesnt exist to match the inmates iep level', async () => {
      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({ paid: true, pay: [{ incentiveLevel: 'STD' }, { incentiveLevel: 'ENH' }] } as Activity)

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
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(atLeast(['G4793VF', 'A9477DY']))
        .mockResolvedValue(prisoners)
      when(activitiesService.getAllocations).calledWith(atLeast(1)).mockResolvedValue([])
    })

    it('should set session and redirect to de-allocation end date page', async () => {
      req.body.selectedAllocations = ['G4793VF', 'A9477DY']
      req.params.activityId = '2'

      const schedule = activitySchedule
      schedule.startDate = formatIsoDate(startOfYesterday())

      when(activitiesService.getActivity)
        .calledWith(atLeast(2))
        .mockResolvedValue({
          startDate: formatIsoDate(startOfYesterday()),
          paid: true,
          pay: [{ incentiveNomisCode: 'BAS' }, { incentiveNomisCode: 'STD' }, { incentiveNomisCode: 'ENH' }],
          schedules: [schedule],
        } as unknown as Activity)

      await handler.DEALLOCATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining(
          '/activities/allocations/remove/deallocate-today-option?allocationIds=G4793VF,A9477DY&scheduleId=1',
        ),
      )
    })

    it('should set session and redirect to de-allocation end decision page when activity is yet to start', async () => {
      req.body.selectedAllocations = ['1']
      req.params.activityId = '3'

      const schedule = activitySchedule
      schedule.startDate = formatIsoDate(tomorrow)
      schedule.allocations.filter(a => a.id === 1)[0].startDate = schedule.startDate

      when(activitiesService.getActivity)
        .calledWith(atLeast(3))
        .mockResolvedValue({
          startDate: formatIsoDate(tomorrow),
          paid: true,
          pay: [{ incentiveNomisCode: 'BAS' }, { incentiveNomisCode: 'STD' }, { incentiveNomisCode: 'ENH' }],
          schedules: [schedule],
        } as unknown as Activity)

      await handler.DEALLOCATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/activities/allocations/remove/end-decision?allocationIds=1&scheduleId=1'),
      )
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
      req.body = { selectedAllocations: [45654] }
      req.params = { activityId: '1' }

      await handler.UPDATE(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/activities/allocations/view/45654`)
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
