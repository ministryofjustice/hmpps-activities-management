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

jest.mock('../../../services/prisonService')
jest.mock('../../../services/capacitiesService')
jest.mock('../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>
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

    req = {} as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    it('should render the correct view', async () => {
      req.params = { scheduleId: '1' }
      req.query = { candidateQuery: 'jack' }

      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({ scheduleId: 1 } as unknown as ActivitySchedule)
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
              { scheduleId: 1, scheduleDescription: 'this schedule' },
              { scheduleId: 2, scheduleDescription: 'other schedule' },
            ],
          },
          {
            prisonerNumber: '321CBA',
            allocations: [
              { scheduleId: 1, scheduleDescription: 'this schedule' },
              { scheduleId: 2, scheduleDescription: 'other schedule' },
            ],
          },
        ] as PrisonerAllocations[])
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
            },
            {
              prisonerNumber: '321CBA',
              status: 'ACTIVE IN',
              legalStatus: 'OTHER',
              firstName: 'John',
              lastName: 'Smith',
              cellLocation: 'MDI-1-1-103',
              releaseDate: '2023-12-26',
            },
            {
              prisonerNumber: 'TEST123',
              status: 'INACTIVE OUT',
              legalStatus: 'OTHER',
              firstName: 'Jim',
              lastName: 'Hamilton',
              cellLocation: 'MDI-1-1-104',
              releaseDate: '2023-12-26',
            },
            {
              prisonerNumber: 'XYZ123',
              status: 'ACTIVE IN',
              legalStatus: 'DEAD',
              firstName: 'John',
              lastName: 'West',
              cellLocation: 'MDI-1-1-105',
              conditionalReleaseDate: '2023-12-26',
            },
            {
              prisonerNumber: 'QWERTY',
              status: 'ACTIVE IN',
              legalStatus: 'OTHER',
              firstName: 'Bill',
              lastName: 'Wilkins',
              cellLocation: 'MDI-1-1-106',
              releaseDate: '2023-12-26',
            },
            {
              prisonerNumber: 'G3439UH',
              status: 'ACTIVE IN',
              legalStatus: 'OTHER',
              firstName: 'Jack',
              lastName: 'Daniels',
              cellLocation: 'MDI-1-1-107',
              releaseDate: '2023-12-26',
            },
          ],
        } as PagePrisoner)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/allocation-dashboard', {
        allocationSummaryView: { capacity: 20, allocated: 10, vacancies: 10 },
        schedule: { scheduleId: 1 },
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
            name: 'Jack Daniels',
            prisonerNumber: 'G3439UH',
            releaseDate: new Date(2023, 11, 26),
          },
        ],
        candidateQuery: 'jack',
      })
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
