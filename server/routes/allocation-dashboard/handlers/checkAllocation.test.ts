import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../services/activitiesService'
import PrisonService from '../../../services/prisonService'
import atLeast from '../../../../jest.setup'
import { Activity, ActivitySchedule } from '../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../@types/prisonerOffenderSearchImport/types'
import { IepSummary } from '../../../@types/incentivesApi/types'
import CheckAllocationRoutes from './checkAllocation'
import activitySchedule from '../../../services/fixtures/activity_schedule_1.json'

jest.mock('../../../services/prisonService')
jest.mock('../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation dashboard', () => {
  const handler = new CheckAllocationRoutes(activitiesService, prisonService)
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
        activityId: 1,
        prisonerNumber: 'ABC123',
      },
      session: {
        allocateJourney: {
          endDate: '2099-12-31',
          inmate: {
            prisonerNumber: 'ABC123',
          },
          activity: {
            scheduleId: 1,
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => jest.resetAllMocks())

  describe('GET', () => {
    beforeEach(() => {
      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          scheduleId: 1,
          activity: { id: 1, minimumIncentiveLevel: 'Basic' },
          allocations: [
            {
              id: 1,
              prisonerNumber: 'ABC123',
              bookingId: 1,
              activitySummary: 'Maths Level 1',
              prisonPayBand: { id: 1, alias: 'Low' },
            },
          ],
        } as unknown as ActivitySchedule)

      const prisonerInfo = {
        prisonerNumber: 'ABC123',
        firstName: 'John',
        lastName: 'Smith',
        cellLocation: '1-1-1',
      } as Prisoner

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith('ABC123', res.locals.user)
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

      when(prisonService.getPrisonerIepSummary)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          iepLevel: 'Standard',
        } as IepSummary)
    })

    it('should render the correct view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocation-dashboard/check-answers', {
        allocation: {
          id: 1,
          prisonerNumber: 'ABC123',
          bookingId: 1,
          activitySummary: 'Maths Level 1',
          prisonPayBand: { id: 1, alias: 'Low' },
        },
        isOnlyPay: true,
        isStarted: false,
        pay: { incentiveLevel: 'Standard', prisonPayBand: { id: 1, alias: 'Low' }, rate: 100 },
        prisonerName: 'John Smith',
      })
    })
  })

  describe('POST', () => {
    it('should redirect back to the allocation dashboard', async () => {
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`/allocation-dashboard/1`)
    })
  })
})
