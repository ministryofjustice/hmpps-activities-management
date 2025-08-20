import { Request, Response } from 'express'
import ActivitiesService from '../../../../services/activitiesService'
import PrisonService from '../../../../services/prisonService'
import AttendanceDataRoutes from './attendanceData'
import EventOrganiser from '../../../../enum/eventOrganisers'
import EventTier from '../../../../enum/eventTiers'
import { AttendanceStatus } from '../../../../@types/appointments'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Attendance data', () => {
  const handler = new AttendanceDataRoutes(activitiesService, prisonService)

  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'MDI',
          username: 'USER1',
          displayName: 'John Smith',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {
        appointmentName: 'Medical & Doctor',
        customAppointmentName: 'Custom Medical & Doctor',
        attendanceState: AttendanceStatus.EVENT_TIER,
        eventTier: EventTier.TIER_1,
        organiserCode: EventOrganiser.EXTERNAL_PROVIDER,
        searchTerm: 'A & B test',
      },
    } as unknown as Request

    activitiesService.getAppointmentCategories.mockReturnValue(
      Promise.resolve([
        {
          code: 'ACTI',
          description: 'Activities',
        },
        {
          code: 'OIC',
          description: 'Adjudication Review',
        },
        {
          code: 'CANT',
          description: 'Canteen',
        },
      ]),
    )

    activitiesService.getAppointmentsByStatusAndDate.mockReturnValue(
      Promise.resolve([
        {
          prisonerNumber: 'G3757GX',
          bookingId: 11,
          appointmentId: 1,
          appointmentAttendeeId: 2,
          appointmentName: 'Medical & Doctor',
          startDate: '2022-01-01',
          startTime: '09:00',
          endTime: '2023-01-01',
        },
      ]),
    )

    prisonService.searchInmatesByPrisonerNumbers.mockReturnValue(
      Promise.resolve([
        {
          prisonerNumber: 'G3757GX',
          pncNumber: '06/842979X',
          pncNumberCanonicalShort: '06/842979X',
          pncNumberCanonicalLong: '2006/842979X',
          croNumber: '472465/06M',
          bookingId: '1116666',
          bookNumber: 'W35506',
          firstName: 'EGURZTOF',
          lastName: 'AISHO',
          dateOfBirth: '1976-01-27',
          gender: 'Male',
          ethnicity: 'White: Any other background',
          youthOffender: false,
          maritalStatus: 'Single-not married/in civil partnership',
          religion: 'Roman Catholic',
          nationality: 'Polish',
          status: 'ACTIVE IN',
          lastMovementTypeCode: 'ADM',
          lastMovementReasonCode: 'INT',
          inOutStatus: 'IN',
          prisonId: 'MDI',
          prisonName: 'Moorland (HMP & YOI)',
          cellLocation: '2-3-009',
          aliases: [],
          alerts: [
            {
              alertType: 'H',
              alertCode: 'HA',
              active: true,
              expired: false,
            },
            {
              alertType: 'X',
              alertCode: 'XNR',
              active: true,
              expired: false,
            },
            {
              alertType: 'X',
              alertCode: 'XILLENT',
              active: true,
              expired: false,
            },
          ],
          csra: 'Standard',
          category: 'U',
          legalStatus: 'REMAND',
          imprisonmentStatus: 'TRL',
          imprisonmentStatusDescription: 'Committed to Crown Court for Trial',
          mostSeriousOffence: 'Drive vehicle for more than 13 hours or more in a working day - domestic',
          recall: false,
          indeterminateSentence: false,
          receptionDate: '2016-07-19',
          locationDescription: 'Moorland (HMP & YOI)',
          restrictedPatient: false,
          currentIncentive: {
            level: {
              code: 'BAS',
              description: 'Basic',
            },
            dateTime: '2022-12-16T11:44:53',
            nextReviewDate: '2022-12-23',
          },
          heightCentimetres: 176,
          weightKilograms: 76,
          hairColour: 'Blonde',
          rightEyeColour: 'Brown',
          leftEyeColour: 'Brown',
          facialHair: 'Clean Shaven',
          shapeOfFace: 'Oval',
          build: 'Thin',
          shoeSize: 9,
        },
      ]),
    )
  })

  describe('GET', () => {
    it('should redirect with the current date', async () => {
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith(`?date=${formatIsoDate(new Date())}`)
    })

    it('should render with attendance data', async () => {
      req.query.date = new Date().toISOString()
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/attendance-summary-stats/attendanceData', {
        appointmentName: 'Medical & Doctor',
        appointments: [],
        attendanceState: 'EVENT_TIER',
        categories: [
          {
            code: 'ACTI',
            description: 'Activities',
          },
          {
            code: 'OIC',
            description: 'Adjudication Review',
          },
          {
            code: 'CANT',
            description: 'Canteen',
          },
        ],
        customAppointmentName: 'Custom Medical & Doctor',
        date: req.query.date,
        eventTier: 'TIER_1',
        organiserCode: 'EXTERNAL_PROVIDER',
        searchTerm: 'A & B test',
        showHostsFilter: false,
        subTitle: '1 attendances recorded at 1 Tier 1 appointments',
        title: 'Tier 1 appointments',
      })
    })
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

    it('should redirect without the given search criteria', async () => {
      req = {
        body: {
          date: '9/7/2025',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith(
        '?date=2025-07-09&appointmentName=&customAppointmentName=&attendanceState=&eventTier=&organiserCode=&searchTerm=',
      )
    })
  })
})
