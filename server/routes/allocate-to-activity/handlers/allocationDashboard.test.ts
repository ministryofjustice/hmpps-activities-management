import { Request, Response } from 'express'

import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'
import CapacitiesService from '../../../services/capacitiesService'
import PrisonService from '../../../services/prisonService'
import AllocationDashboardRoutes, { SelectedAllocation } from './allocationDashboard'
import atLeast from '../../../../jest.setup'
import { ActivitySchedule, Allocation, PrisonerAllocations } from '../../../@types/activitiesAPI/types'
import { AllocationsSummary } from '../../../@types/activities'
import { PagePrisoner, Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'
import { associateErrorsWithProperty } from '../../../utils/utils'
import { IepLevel } from '../../../@types/incentivesApi/types'
import { Education } from '../../../@types/prisonApiImport/types'

jest.mock('../../../services/prisonService')
jest.mock('../../../services/capacitiesService')
jest.mock('../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const capacitiesService = new CapacitiesService(null) as jest.Mocked<CapacitiesService>
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new AllocationDashboardRoutes(prisonService, capacitiesService, activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoad: {
            caseLoadId: 'MDI',
          },
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    beforeEach(() => {
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          scheduleId: 1,
          activity: { minimumIncentiveLevel: 'Basic' },
        } as unknown as ActivitySchedule)
      when(prisonService.getIncentiveLevels)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue([
          { sequence: 0, iepDescription: 'Basic' },
          { sequence: 1, iepDescription: 'Standard' },
          { sequence: 2, iepDescription: 'Enhanced' },
        ] as IepLevel[])
      when(capacitiesService.getScheduleAllocationsSummary)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          capacity: 20,
          allocated: 10,
          vacancies: 10,
        } as AllocationsSummary)
      when(activitiesService.getAllocations)
        .calledWith(atLeast(1))
        .mockResolvedValue([
          {
            prisonerNumber: 'ABC123',
            allocatedTime: '2023-02-17T15:22:00',
          },
          {
            prisonerNumber: '321CBA',
            allocatedTime: '2023-02-16T12:43:00',
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
      when(activitiesService.getPrisonerAllocations)
        .calledWith(atLeast('MDI', ['ABC123', '321CBA']))
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
      when(activitiesService.getPrisonerAllocations)
        .calledWith(atLeast('MDI', ['G3439UH']))
        .mockResolvedValue([
          {
            prisonerNumber: 'G3439UH',
            allocations: [
              { scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
              { scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
            ],
          },
        ] as PrisonerAllocations[])
      when(prisonService.getEducations)
        .calledWith(atLeast(['G3439UH']))
        .mockResolvedValue([
          {
            bookingId: 100001,
            studyArea: 'Mathematics',
            educationLevel: 'Level 1',
          },
          {
            bookingId: 100002,
            studyArea: 'Spanish',
            educationLevel: 'Level 1',
          },
        ] as Education[])
      when(prisonService.getInmates)
        .calledWith(atLeast('MDI'))
        .mockResolvedValue({
          content: [
            {
              prisonerNumber: 'ABC123',
              status: 'ACTIVE IN',
              legalStatus: 'OTHER',
              firstName: 'Joe',
              lastName: 'Bloggs',
              cellLocation: 'MDI-1-1-101',
              releaseDate: '2023-12-25',
              alerts: [],
            },
            {
              prisonerNumber: '321CBA',
              status: 'ACTIVE IN',
              legalStatus: 'OTHER',
              firstName: 'John',
              lastName: 'Smith',
              cellLocation: 'MDI-1-1-103',
              releaseDate: '2023-12-26',
              alerts: [],
            },
            {
              prisonerNumber: 'TEST123',
              status: 'INACTIVE OUT',
              legalStatus: 'OTHER',
              firstName: 'Jim',
              lastName: 'Hamilton',
              cellLocation: 'MDI-1-1-104',
              releaseDate: '2023-12-26',
              alerts: [],
            },
            {
              prisonerNumber: 'XYZ123',
              status: 'ACTIVE IN',
              legalStatus: 'DEAD',
              firstName: 'John',
              lastName: 'West',
              cellLocation: 'MDI-1-1-105',
              conditionalReleaseDate: '2023-12-26',
              alerts: [],
            },
            {
              prisonerNumber: 'QWERTY',
              status: 'ACTIVE IN',
              legalStatus: 'OTHER',
              firstName: 'Bill',
              lastName: 'Wilkins',
              cellLocation: 'MDI-1-1-106',
              releaseDate: '2024-01-26',
              alerts: [
                {
                  alertType: 'R',
                  alertCode: 'RLO',
                },
              ],
              currentIncentive: {
                level: { description: 'Basic' },
              },
            },
            {
              prisonerNumber: 'G3439UH',
              bookingId: '100001',
              status: 'ACTIVE IN',
              legalStatus: 'OTHER',
              firstName: 'Jack',
              lastName: 'Daniels',
              cellLocation: 'MDI-1-1-107',
              releaseDate: '2023-12-26',
              alerts: [
                {
                  alertType: 'R',
                  alertCode: 'RLO',
                },
              ],
              currentIncentive: {
                level: { description: 'Standard' },
              },
            },
          ],
        } as PagePrisoner)
    })

    it('should render the correct view', async () => {
      req.params = { scheduleId: '1' }
      req.query = { candidateQuery: 'jack' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/allocation-dashboard', {
        allocationSummaryView: { capacity: 20, allocated: 10, vacancies: 10 },
        schedule: { scheduleId: 1, activity: { minimumIncentiveLevel: 'Basic' } },
        currentlyAllocated: [
          {
            cellLocation: 'MDI-1-1-101',
            dateAllocated: new Date(2023, 1, 17, 15, 22),
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
            cellLocation: 'MDI-1-1-103',
            dateAllocated: new Date(2023, 1, 16, 12, 43),
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
        candidates: [
          {
            cellLocation: 'MDI-1-1-107',
            inWork: true,
            name: 'Jack Daniels',
            otherAllocations: [
              {
                id: 1,
                scheduleName: 'this schedule',
                isUnemployment: false,
              },
              {
                id: 2,
                scheduleName: 'other schedule',
                isUnemployment: false,
              },
            ],
            prisonerNumber: 'G3439UH',
            releaseDate: new Date(2023, 11, 26),
            educationLevels: [
              {
                bookingId: 100001,
                educationLevel: 'Level 1',
                studyArea: 'Mathematics',
              },
            ],
          },
        ],
        incentiveLevels: [
          { sequence: 0, iepDescription: 'Basic' },
          { sequence: 1, iepDescription: 'Standard' },
          { sequence: 2, iepDescription: 'Enhanced' },
        ],
        filters: {
          candidateQuery: 'jack',
        },
        suitableForIep: 'All Incentive Levels',
        suitableForWra: 'Low or Medium or High',
      })
    })

    it('should calculate suitable iep correctly', async () => {
      req.params = { scheduleId: '1' }
      activitiesService.getActivitySchedule = jest.fn()
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          scheduleId: 1,
          activity: { minimumIncentiveLevel: 'Standard' },
        } as unknown as ActivitySchedule)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          candidates: [],
          filters: expect.objectContaining({
            incentiveLevelFilter: 'Standard or Enhanced',
          }),
          suitableForIep: 'Standard or Enhanced',
        }),
      )
    })

    it('should calculate suitable workplace risk assessment correctly - LOW', async () => {
      req.params = { scheduleId: '1' }
      activitiesService.getActivitySchedule = jest.fn()
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          scheduleId: 1,
          activity: { minimumIncentiveLevel: 'Standard', riskLevel: 'low' },
        } as unknown as ActivitySchedule)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            riskLevelFilter: 'Low',
          }),
          suitableForWra: 'Low',
        }),
      )
    })

    it('should calculate suitable workplace risk assessment correctly - MEDIUM', async () => {
      req.params = { scheduleId: '1' }
      activitiesService.getActivitySchedule = jest.fn()
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          scheduleId: 1,
          activity: { minimumIncentiveLevel: 'Standard', riskLevel: 'medium' },
        } as unknown as ActivitySchedule)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            riskLevelFilter: 'Low or Medium',
          }),
          suitableForWra: 'Low or Medium',
        }),
      )
    })

    it('should calculate suitable workplace risk assessment correctly - HIGH', async () => {
      req.params = { scheduleId: '1' }
      activitiesService.getActivitySchedule = jest.fn()
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          scheduleId: 1,
          activity: { minimumIncentiveLevel: 'Standard', riskLevel: 'high' },
        } as unknown as ActivitySchedule)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          filters: expect.objectContaining({
            riskLevelFilter: 'Low or Medium or High',
          }),
          suitableForWra: 'Low or Medium or High',
        }),
      )
    })

    it('should return correct candidates with risk level filter set to any', async () => {
      req.params = { scheduleId: '1' }
      req.query = { candidateQuery: 'jack', riskLevelFilter: 'Any Workplace Risk Assessment' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          candidates: [
            expect.objectContaining({
              prisonerNumber: 'G3439UH',
            }),
          ],
          filters: expect.objectContaining({
            riskLevelFilter: 'Any Workplace Risk Assessment',
          }),
        }),
      )
    })

    it('should return correct candidates with risk level filter set to none', async () => {
      req.params = { scheduleId: '1' }
      req.query = { candidateQuery: 'jack', riskLevelFilter: 'No Workplace Risk Assessment' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          candidates: [],
          filters: expect.objectContaining({
            riskLevelFilter: 'No Workplace Risk Assessment',
          }),
        }),
      )
    })

    it('should return correct candidates with employlent filter set to In work', async () => {
      req.params = { scheduleId: '1' }
      req.query = { candidateQuery: 'jack', employmentFilter: 'In work' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          candidates: [
            expect.objectContaining({
              prisonerNumber: 'G3439UH',
            }),
          ],
          filters: expect.objectContaining({
            employmentFilter: 'In work',
          }),
        }),
      )
    })

    it('should return correct candidates with employlent filter set to Everyone', async () => {
      req.params = { scheduleId: '1' }
      req.query = { candidateQuery: 'jack', employmentFilter: 'Everyone' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          candidates: [
            expect.objectContaining({
              prisonerNumber: 'G3439UH',
            }),
          ],
          filters: expect.objectContaining({
            employmentFilter: 'Everyone',
          }),
        }),
      )
    })

    it('should return correct candidates with employlent filter set to Not in work', async () => {
      req.params = { scheduleId: '1' }
      req.query = { candidateQuery: 'jack', employmentFilter: 'Not in work' }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/allocate-to-activity/allocation-dashboard',
        expect.objectContaining({
          candidates: [],
          filters: expect.objectContaining({
            employmentFilter: 'Not in work',
          }),
        }),
      )
    })
  })

  describe('POST', () => {
    it('should redirect to allocate the selected candidate', async () => {
      req.body = { selectedAllocation: 'ABC123' }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`allocate/ABC123`)
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
})
