import { Request, Response } from 'express'
import { validate } from 'class-validator'
import SelectPrisonerRoutes, { Prisoner } from './selectPrisoner'
import { AppointmentPrisonerDetails } from '../../create-and-edit/appointmentPrisonerDetails'
import { associateErrorsWithProperty } from '../../../../utils/utils'

describe('SelectPrisonerRoutes', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let selectPrisonerRoutes: SelectPrisonerRoutes

  beforeEach(() => {
    req = {
      session: {
        bookAVideoLinkJourney: {
          prisoners: [
            { number: 'A1234BC', name: 'John Doe' },
            { number: 'X9876YZ', name: 'Jane Smith' },
          ],
        },
      },
      body: {},
    } as unknown as Request
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response
    selectPrisonerRoutes = new SelectPrisonerRoutes()
  })

  describe('GET', () => {
    it('renders select-prisoner view if multiple prisoners', async () => {
      await selectPrisonerRoutes.GET(req as Request, res as Response)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/video-link-booking/select-prisoner')
    })

    it('redirects to hearing-details if only one prisoner', async () => {
      req.session.bookAVideoLinkJourney.prisoners = [
        { number: 'A1234BC', name: 'John Doe' },
      ] as AppointmentPrisonerDetails[]
      await selectPrisonerRoutes.GET(req as Request, res as Response)
      expect(res.redirect).toHaveBeenCalledWith('hearing-details')
    })
  })

  describe('POST', () => {
    it('redirects to hearing-details with selected prisoner', async () => {
      req.body = { prisonerNumber: 'A1234BC' }
      await selectPrisonerRoutes.POST(req as Request, res as Response)
      expect(res.redirect).toHaveBeenCalledWith('hearing-details')
      expect(req.session.bookAVideoLinkJourney.prisoner).toEqual({ number: 'A1234BC', name: 'John Doe' })
    })
  })

  describe('Prisoner', () => {
    it('should be valid when prisonerNumber is provided', async () => {
      const prisoner = new Prisoner()
      prisoner.prisonerNumber = 'A1234BC'

      const errors = await validate(prisoner).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors.length).toBe(0)
    })

    it('should be invalid when prisonerNumber is not provided', async () => {
      const prisoner = new Prisoner()

      const errors = await validate(prisoner).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors.length).toBeGreaterThan(0)
      expect(errors).toEqual(expect.arrayContaining([{ error: 'Select an attendee', property: 'prisonerNumber' }]))
    })
  })
})
