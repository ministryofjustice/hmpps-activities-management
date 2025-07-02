import { Request, Response } from 'express'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import ExtraInformationRoutes, { ExtraInformation } from './extraInformation'
import ProbationBookingService from '../../../../../services/probationBookingService'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import { BookAProbationMeetingJourney } from '../journey'

jest.mock('../../../../../services/probationBookingService')

describe('ExtraInformationRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let probationBookingService: jest.Mocked<ProbationBookingService>
  let extraInformationRoutes: ExtraInformationRoutes

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
    } as unknown as Response
    probationBookingService = new ProbationBookingService(null) as jest.Mocked<ProbationBookingService>
    extraInformationRoutes = new ExtraInformationRoutes(probationBookingService)
  })

  describe('GET', () => {
    it('renders extra information view', async () => {
      await extraInformationRoutes.GET(req as Request, res as Response)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/probation/extra-information')
    })
  })

  describe('ExtraInformation', () => {
    it('it should validate staff notes', async () => {
      const extraInformation = plainToInstance(ExtraInformation, {
        notesForStaff: 'x'.repeat(401),
      })

      const errors = await validate(extraInformation).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Notes for prison staff must be 400 characters or less',
            property: 'notesForStaff',
          },
        ]),
      )
    })

    it('it should validate prisoners notes', async () => {
      const extraInformation = plainToInstance(ExtraInformation, {
        notesForPrisoners: 'x'.repeat(401),
      })

      const errors = await validate(extraInformation).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual(
        expect.arrayContaining([
          {
            error: 'Notes for prisoner must be 400 characters or less',
            property: 'notesForPrisoners',
          },
        ]),
      )
    })
  })

  describe('POST', () => {
    it('redirects with success message when mode is amend', async () => {
      req.body.notesForStaff = 'Notes for staff'
      req.body.notesForPrisoners = 'Notes for prisoners'
      req.routeContext = { mode: 'amend' }
      req.session.bookAProbationMeetingJourney.bookingId = 1

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(probationBookingService.amendVideoLinkBooking).toHaveBeenCalledWith(
        {
          bookingId: 1,
          notesForPrisoners: 'Notes for prisoners',
          notesForStaff: 'Notes for staff',
        } as BookAProbationMeetingJourney,
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/appointments/video-link-booking/probation/1',
        "You've changed the extra information for this probation meeting",
      )
    })

    it('redirects to check-answers when mode is create', async () => {
      req.routeContext = { mode: 'create' }

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
})
