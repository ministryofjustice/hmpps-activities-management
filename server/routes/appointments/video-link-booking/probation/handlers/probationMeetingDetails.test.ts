import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { ProbationTeam, ReferenceCode } from '../../../../../@types/bookAVideoLinkApi/types'
import ProbationBookingService from '../../../../../services/probationBookingService'
import ProbationMeetingDetailsRoutes, { ProbationMeetingDetails } from './probationMeetingDetails'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

jest.mock('../../../../../services/bookAVideoLinkService')
jest.mock('../../../../../services/probationBookingService')

describe('MeetingDetailsRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let bookAVideoLinkService: jest.Mocked<BookAVideoLinkService>
  let probationBookingService: jest.Mocked<ProbationBookingService>
  let meetingDetailsRoutes: ProbationMeetingDetailsRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAProbationMeetingJourney: {},
      },
      body: {},
      params: {},
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response
    bookAVideoLinkService = new BookAVideoLinkService(null) as jest.Mocked<BookAVideoLinkService>
    probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>
    meetingDetailsRoutes = new ProbationMeetingDetailsRoutes(bookAVideoLinkService, probationBookingService)
  })

  describe('GET', () => {
    it('renders meeting details view with probation teams and hearing types', async () => {
      const meetingTypes = [{ code: 'TYPE1', description: 'Type 1' }] as ReferenceCode[]
      const probationTeams = [{ code: 'TEAM1', description: 'Team 1' }] as ProbationTeam[]

      bookAVideoLinkService.getAllProbationTeams.mockResolvedValue(probationTeams)
      bookAVideoLinkService.getProbationMeetingTypes.mockResolvedValue(meetingTypes)

      await meetingDetailsRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/video-link-booking/probation/probation-meeting-details',
        {
          probationTeams,
          meetingTypes,
        },
      )
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.probationTeamCode = 'TEAM1'
      req.body.meetingTypeCode = 'TYPE1'
      req.routeContext = { mode: 'amend' }
      req.session.bookAProbationMeetingJourney.bookingId = 1

      await meetingDetailsRoutes.POST(req as Request, res as Response)

      expect(probationBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        req.session.bookAProbationMeetingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/probation/1',
        "You've changed the details for this probation meeting",
      )
    })

    it('redirects to date and time when mode is create', async () => {
      req.body.meetingTypeCode = 'TYPE1'
      req.routeContext = { mode: 'create' }

      await meetingDetailsRoutes.POST(req as Request, res as Response)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('date-and-time')
    })
  })

  describe('Class Validation', () => {
    it('validation fails for an empty form', async () => {
      const body = {
        probationTeamCode: '',
        meetingTypeCode: '',
        officerDetailsNotKnown: '',
        officerFullName: '',
        officerEmail: '',
        officerTelephone: '',
      }

      const requestObject = plainToInstance(ProbationMeetingDetails, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([
        {
          error: 'Select if you know the team this meeting is for',
          property: 'probationTeamRequired',
        },
        {
          error: 'Select a meeting type',
          property: 'meetingTypeCode',
        },
        {
          error: "Enter the probation officer's details",
          property: 'officerDetailsOrUnknown',
        },
      ])
    })

    it('validation fails for missing probation team', async () => {
      const body = {
        probationTeamRequired: 'YES',
        meetingTypeCode: 'code',
        officerDetailsNotKnown: 'true',
        officerFullName: '',
        officerEmail: '',
        officerTelephone: '',
      }

      const requestObject = plainToInstance(ProbationMeetingDetails, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([
        {
          error: 'Select a probation team',
          property: 'probationTeamCode',
        },
      ])
    })

    it('validation fails for an empty email', async () => {
      const body = {
        probationTeamRequired: 'NO',
        probationTeamCode: 'code',
        meetingTypeCode: 'code',
        officerDetailsNotKnown: '',
        officerFullName: 'Joe Bloggs',
        officerEmail: '',
        officerTelephone: '',
      }

      const requestObject = plainToInstance(ProbationMeetingDetails, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([
        {
          error: "Enter the probation officer's email address",
          property: 'officerEmail',
        },
      ])
    })

    it('validation fails for an invalid email', async () => {
      const body = {
        probationTeamRequired: 'NO',
        probationTeamCode: 'code',
        meetingTypeCode: 'code',
        officerDetailsNotKnown: '',
        officerFullName: 'Joe Bloggs',
        officerEmail: 'invalid',
        officerTelephone: '',
      }

      const requestObject = plainToInstance(ProbationMeetingDetails, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([
        {
          error: 'Enter a valid email address',
          property: 'officerEmail',
        },
      ])
    })

    it('validation fails for an invalid telephone', async () => {
      const body = {
        probationTeamRequired: 'NO',
        probationTeamCode: 'code',
        meetingTypeCode: 'code',
        officerDetailsNotKnown: '',
        officerFullName: 'Joe Bloggs',
        officerEmail: 'test@gmail.com',
        officerTelephone: 'invalid',
      }

      const requestObject = plainToInstance(ProbationMeetingDetails, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([
        {
          error: 'Enter a valid UK phone number',
          property: 'officerTelephone',
        },
      ])
    })

    it('validation fails for both details entered and not known selected', async () => {
      const body = {
        probationTeamRequired: 'NO',
        probationTeamCode: 'code',
        meetingTypeCode: 'code',
        officerDetailsNotKnown: 'true',
        officerFullName: 'Joe Bloggs',
        officerEmail: 'test@gmail.com',
        officerTelephone: '',
      }

      const requestObject = plainToInstance(ProbationMeetingDetails, body)
      const errors = await validate(requestObject, { stopAtFirstError: true }).then(errs =>
        errs.flatMap(associateErrorsWithProperty),
      )

      expect(errors).toEqual([
        {
          error: "Enter either the probation officer's details, or select 'Not yet known'",
          property: 'officerDetailsOrUnknown',
        },
      ])
    })
  })
})
