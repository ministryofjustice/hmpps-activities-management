import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ExtraInformationRoutes, { ExtraInformation } from './extraInformation'
import CourtBookingService from '../../../../../services/courtBookingService'
import { BookACourtHearingJourney } from '../journey'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

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

    it('redirects to check-answers when mode is not amend', async () => {
      req.routeContext = { mode: 'create' }

      await extraInformationRoutes.POST(req as Request, res as Response)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })
})
