import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../services/activitiesService'
import NotAttendedReasonRoutes from './notAttendedReason'
import { AttendanceReason } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null)

describe('Route Handlers - Non Attendance', () => {
  const handler = new NotAttendedReasonRoutes(activitiesService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { id: 1 },
      session: {
        notAttendedJourney: {
          selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123', prisonerName: 'JOE BLOGGS' }],
        },
      },
      body: {
        selectedAttendances: ['1-ABC123'],
        notAttendedData: {
          ABC123: {
            notAttendedReason: 'SICK',
            moreDetail: '',
            caseNote: '',
            absenceReason: '',
          },
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render with the expected view', async () => {
      when(activitiesService.getAttendanceReasons)
        .calledWith(res.locals.user)
        .mockResolvedValue([
          {
            id: 1,
            code: 'SICK',
            description: 'Sickness',
            attended: false,
            capturePay: true,
            captureMoreDetail: true,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 1,
            displayInAbsence: true,
          },
          {
            id: 2,
            code: 'ATTENDED',
            description: 'Attended',
            attended: true,
            capturePay: false,
            captureMoreDetail: false,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 2,
            displayInAbsence: false,
          },
        ] as AttendanceReason[])

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/record-attendance/not-attended-reason', {
        notAttendedReasons: [
          {
            id: 1,
            code: 'SICK',
            description: 'Sickness',
            attended: false,
            capturePay: true,
            captureMoreDetail: true,
            captureCaseNote: false,
            captureIncentiveLevelWarning: false,
            captureOtherText: false,
            displaySequence: 1,
            displayInAbsence: true,
          },
        ],
        selectedPrisoners: [{ attendanceId: 1, prisonerNumber: 'ABC123', prisonerName: 'JOE BLOGGS' }],
      })
    })
  })

  describe('NOT_ATTENDED', () => {
    it('non attendance should be redirected to the non attendance page', async () => {
      await handler.POST(req, res)

      expect(activitiesService.updateAttendances).toBeCalledTimes(1)
      expect(res.redirectWithSuccess).toBeCalledWith(
        'attendance-list',
        'Attendance recorded',
        "We've saved attendance details for Joe Bloggs",
      )
    })
  })
})
