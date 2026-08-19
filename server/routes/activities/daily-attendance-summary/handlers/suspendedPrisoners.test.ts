import { Request, Response } from 'express'
import { when } from 'jest-when'
import { parse } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import { ActivityCategory } from '../../../../@types/activitiesAPI/types'
import PrisonService from '../../../../services/prisonService'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import SuspendedPrisonersRoutes from './suspendedPrisoners'
import { ActivityCategoryEnum } from '../../../../data/activityCategoryEnum'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Suspended prisoners list', () => {
  const handler = new SuspendedPrisonersRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          externalActivitiesRolledOut: true,
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
      journeyData: {
        attendanceSummaryJourney: {},
      },
    } as unknown as Request

    when(activitiesService.getActivityCategories).mockResolvedValue([
      { id: 1, code: 'SAA_NOT_IN_WORK', name: 'Not in work' },
      { id: 2, code: 'SAA_ROTL', name: 'Outside activity' },
    ] as ActivityCategory[])
  })

  describe('GET', () => {
    const mockSuspendedPrisonerAttendance = [
      {
        prisonerNumber: 'ABC123',
        attendance: [
          {
            sessionDate: '2022-10-10',
            startTime: '10:00',
            endTime: '11:00',
            timeSlot: 'AM',
            attendanceReasonCode: 'AUTO_SUSPENDED',
            issuePayment: false,
            prisonerNumber: 'ABC123',
            scheduledInstanceId: 1,
            activitySummary: 'Maths Level 1',
            categoryName: 'Education',
            inCell: false,
            offWing: false,
            onWing: false,
            internalLocation: 'Classroom',
          },
        ],
      },
    ]
    const mockPrisonApiResponse = [
      {
        prisonerNumber: 'ABC123',
        firstName: 'Joe',
        lastName: 'Bloggs',
        cellLocation: 'MDI-1-001',
        alerts: [{ alertCode: 'HA' }, { alertCode: 'XCU' }],
        category: 'A',
      },
    ] as Prisoner[]

    it('should redirect to the select period page if date is not provided', async () => {
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('select-period')
    })

    it('should exclude the outside activity category when the feature is not enabled', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      res.locals.user.externalActivitiesRolledOut = false
      req.query = { date: dateString }

      when(activitiesService.getSuspendedPrisonersActivityAttendance)
        .calledWith(date, res.locals.user, null, null)
        .mockResolvedValue([])
      when(prisonService.searchInmatesByPrisonerNumbers).calledWith([], res.locals.user).mockResolvedValue([])

      await handler.GET(req, res)

      expect(activitiesService.getActivityCategories).toHaveBeenCalledWith(res.locals.user, false)
      expect(req.journeyData.attendanceSummaryJourney.categoryFilters).toEqual(['Not in work'])
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/daily-attendance-summary/suspended-prisoners',
        expect.objectContaining({
          uniqueCategories: [{ value: 'Not in work', text: 'Not in work' }],
        }),
      )
    })

    it('should ignore a stale SAA_ROTL filter when the feature is not enabled', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      res.locals.user.externalActivitiesRolledOut = false
      req.query = { date: dateString }
      req.journeyData.attendanceSummaryJourney.categoryFilters = [ActivityCategoryEnum.SAA_ROTL]

      when(activitiesService.getSuspendedPrisonersActivityAttendance)
        .calledWith(date, res.locals.user, [], null)
        .mockResolvedValue([])
      when(prisonService.searchInmatesByPrisonerNumbers).calledWith([], res.locals.user).mockResolvedValue([])

      await handler.GET(req, res)

      expect(activitiesService.getSuspendedPrisonersActivityAttendance).toHaveBeenCalledWith(
        date,
        res.locals.user,
        [],
        null,
      )
      expect(req.journeyData.attendanceSummaryJourney.categoryFilters).toEqual(['Not in work'])
    })

    it('should pass SAA_ROTL to the API when the outside activity category is selected', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req.query = { date: dateString }
      req.journeyData.attendanceSummaryJourney.categoryFilters = [ActivityCategoryEnum.SAA_ROTL]

      when(activitiesService.getSuspendedPrisonersActivityAttendance)
        .calledWith(date, res.locals.user, [ActivityCategoryEnum.SAA_ROTL], null)
        .mockResolvedValue([])
      when(prisonService.searchInmatesByPrisonerNumbers).calledWith([], res.locals.user).mockResolvedValue([])

      await handler.GET(req, res)

      expect(activitiesService.getSuspendedPrisonersActivityAttendance).toHaveBeenCalledWith(
        date,
        res.locals.user,
        [ActivityCategoryEnum.SAA_ROTL],
        null,
      )
    })

    it('should render with the expected suspended prisoners view', async () => {
      const dateString = '2022-10-10'
      const date = parse(dateString, 'yyyy-MM-dd', new Date())

      req = {
        query: {
          date: dateString,
        },
        journeyData: {},
      } as unknown as Request

      when(activitiesService.getSuspendedPrisonersActivityAttendance).mockResolvedValue(mockSuspendedPrisonerAttendance)
      when(prisonService.searchInmatesByPrisonerNumbers)
        .calledWith(['ABC123'], res.locals.user)
        .mockResolvedValue(mockPrisonApiResponse)

      await handler.GET(req, res)

      expect(activitiesService.getActivityCategories).toHaveBeenCalledWith(res.locals.user, true)
      expect(req.journeyData.attendanceSummaryJourney.categoryFilters).toEqual(['Not in work', 'SAA_ROTL'])
      expect(res.render).toHaveBeenCalledWith('pages/activities/daily-attendance-summary/suspended-prisoners', {
        activityDate: date,
        uniqueCategories: [
          { value: 'Not in work', text: 'Not in work' },
          { value: 'SAA_ROTL', text: 'Outside activity' },
        ],
        suspendedAttendancesByPrisoner: [
          {
            cellLocation: 'MDI-1-001',
            prisonerName: 'Joe Bloggs',
            firstName: 'Joe',
            lastName: 'Bloggs',
            prisonerNumber: 'ABC123',
            prisonCode: undefined,
            status: undefined,
            reason: 'Temporarily released or transferred',
            sessions: [
              {
                sessionEndTime: '11:00',
                sessionId: 1,
                sessionLocation: 'Classroom',
                sessionSlot: 'AM',
                sessionStartTime: '10:00',
                sessionSummary: 'Maths Level 1',
              },
            ],
            timeSlots: ['AM'],
          },
        ],
      })
    })
  })
})
