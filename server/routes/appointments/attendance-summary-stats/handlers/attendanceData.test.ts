import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import AttendanceDataRoutes from './attendanceData'
import EventOrganiser from '../../../../enum/eventOrganisers'
import EventTier from '../../../../enum/eventTiers'
import { AttendanceStatus } from '../../../../@types/appointments'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Activities', () => {
  const handler = new AttendanceDataRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
    } as unknown as Request
  })

  describe('POST', () => {
    it('should redirect with the given search criteria', async () => {
      req = {
        body: {
          date: '9/7/2025',
          appointmentName: 'Medical & Doctor',
          customAppointmentName: 'Custom Medical & Doctor',
          attendanceState: AttendanceStatus.EVENT_TIER,
          eventTier: EventTier.TIER_1,
          organiserCode: EventOrganiser.EXTERNAL_PROVIDER,
          searchTerm: 'A & B test',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '?date=2025-07-09&appointmentName=Medical%20%26%20Doctor&customAppointmentName=Custom%20Medical%20%26%20Doctor&attendanceState=EVENT_TIER&eventTier=TIER_1&organiserCode=EXTERNAL_PROVIDER&searchTerm=A%20%26%20B%20test',
      )
    })
  })
})
