import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'
import { Activity, Allocation } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import ViewAllocationRoutes from './viewAllocation'
import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new ViewAllocationRoutes(activitiesService, prisonService)
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
    } as unknown as Response

    req = {
      params: {
        allocationId: 1,
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    beforeEach(() => {
      const prisonerInfo = {
        prisonerNumber: 'G4793VF',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
        currentIncentive: {
          level: {
            description: 'Standard',
          },
        },
      } as Prisoner

      when(activitiesService.getAllocation)
        .calledWith(1, res.locals.user)
        .mockResolvedValue({
          id: 1,
          activityId: 1,
          prisonerNumber: 'G4793VF',
          startDate: '2022-05-19',
          prisonPayBand: { id: 1 },
          exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
        } as Allocation)

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('G4793VF', res.locals.user)
        .mockResolvedValue(prisonerInfo)

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          attendanceRequired: false,
          category: { code: 'EDUCATION', id: 1, name: 'Education' },
          createdBy: '',
          createdTime: '',
          description: '',
          eligibilityRules: [],
          endDate: '2022-12-31',
          inCell: false,
          minimumIncentiveNomisCode: 'BAS',
          minimumIncentiveLevel: 'Basic',
          outsideWork: false,
          pay: [{ incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 }],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [activitySchedule],
          startDate: '2022-01-01',
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 0 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        } as unknown as Activity)
    })

    it('should render the correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/view-allocation', {
        allocation: {
          id: 1,
          activityId: 1,
          prisonerNumber: 'G4793VF',
          startDate: '2022-05-19',
          prisonPayBand: { id: 1 },
          exclusions: [{ weekNumber: 1, timeSlot: 'AM', monday: true, daysOfWeek: ['MONDAY'] }],
        },
        isOnlyPay: true,
        isStarted: true,
        pay: { incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        prisonerName: 'John Smith',
        currentWeek: 1,
        dailySlots: {
          '1': [
            {
              day: 'Monday',
              slots: [],
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
      })
    })
  })
})
