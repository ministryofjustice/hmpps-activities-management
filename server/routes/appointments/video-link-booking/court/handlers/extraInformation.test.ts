import { Request, Response } from 'express'
import ExtraInformationRoutes from './extraInformation'
import CourtBookingService from '../../../../../services/courtBookingService'
import { BookACourtHearingJourney } from '../journey'
import config from '../../../../../config'

jest.mock('../../../../../services/courtBookingService')

describe('ExtraInformationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let courtBookingService: jest.Mocked<CourtBookingService>
  let extraInformationRoutes: ExtraInformationRoutes

  beforeEach(() => {
    req = {
      session: {
        bookACourtHearingJourney: {},
      },
      body: {},
      params: {},
    } as unknown as Request
    res = {
      locals: { user: {} },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response
    courtBookingService = new CourtBookingService(null) as jest.Mocked<CourtBookingService>
    extraInformationRoutes = new ExtraInformationRoutes(courtBookingService)
  })

  describe('GET', () => {
    it('renders extra information view', async () => {
      await extraInformationRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/court/extra-information')
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend and master notes toggle is on', async () => {
      config.bvlsMasterPublicPrivateNotesEnabled = true

      req.body.notesForStaff = 'Notes for staff'
      req.body.notesForPrisoners = 'Notes for prisoners'
      req.params.mode = 'amend'
      req.session.bookACourtHearingJourney.bookingId = 1

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(courtBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        {
          bookingId: 1,
          notesForPrisoners: 'Notes for prisoners',
          notesForStaff: 'Notes for staff',
        } as BookACourtHearingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/court/1',
        "You've changed the extra information for this court hearing",
      )
    })

    it('redirects with success message when mode is amend and master notes toggle is off', async () => {
      config.bvlsMasterPublicPrivateNotesEnabled = false

      req.body.extraInformation = 'some extra information'
      req.params.mode = 'amend'
      req.session.bookACourtHearingJourney.bookingId = 2

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(courtBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        {
          bookingId: 2,
          comments: 'some extra information',
        } as BookACourtHearingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/court/2',
        "You've changed the extra information for this court hearing",
      )
    })

    it('redirects to check-answers when mode is not amend', async () => {
      req.params.mode = 'create'

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
})
