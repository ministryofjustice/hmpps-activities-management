import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import BulkAppointmentAddComment, { BulkAppointmentComment } from './bulkAppointmentAddComment'
import { AppointmentSetJourney } from '../../appointmentSetJourney'

describe('Route Handlers - Create Bulk Appointment - Add Comment', () => {
  const handler = new BulkAppointmentAddComment()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentSetJourney: {},
      },
      params: {},
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('retrieves prisoner appointment and renders add comment page with correct context', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.params = {
        prisonerNumber: 'A1234BC',
      }

      handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/bulk-appointments/add-comment', {
        prisoner: testPrisonerAppointment.prisoner,
        extraInformation: testPrisonerAppointment.extraInformation,
      })
    })

    it('fails to find prisoner appointment and redirect to bulk appointment comments review page', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
        comment: 'An appointment comment',
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.params = {
        prisonerNumber: 'INVALID',
      }

      handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../bulk-appointment-comments')
      expect(res.render).toHaveBeenCalledTimes(0)
    })
  })

  describe('POST', () => {
    it('adds comment to appointment and redirects back to the comments review page', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.body = {
        comment: 'A comment',
      }
      req.params = {
        prisonerNumber: 'A1234BC',
      }

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toBeUndefined()

      handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('A comment')
      expect(res.redirect).toHaveBeenCalledWith('../bulk-appointment-comments')
    })

    it('updates existing comment and redirects back to the comments review page', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
        comment: 'A comment',
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.body = {
        comment: 'A different comment',
      }
      req.params = {
        prisonerNumber: 'A1234BC',
      }

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('A comment')

      handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('A different comment')
      expect(res.redirect).toHaveBeenCalledWith('../bulk-appointment-comments')
    })

    it('fails to find prisoner and redirects back to the comments review page with session unchanged', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
        comment: 'A comment',
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.body = {
        comment: 'A comment',
      }
      req.params = {
        prisonerNumber: 'INVALID',
      }

      handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments).toHaveLength(1)
      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('A comment')
      expect(res.redirect).toHaveBeenCalledWith('../bulk-appointment-comments')
    })
  })

  describe('Validation', () => {
    it.each([
      { comment: Array(4001).fill('a').join(''), isValid: false },
      { comment: Array(4000).fill('a').join(''), isValid: true },
      { comment: Array(3999).fill('a').join(''), isValid: true },
    ])('should validate comment character length', async ({ comment, isValid }) => {
      const body = {
        comment,
      }

      const requestObject = plainToInstance(BulkAppointmentComment, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      if (isValid) {
        expect(errors).toHaveLength(0)
      } else {
        expect(errors).toEqual([
          { property: 'comment', error: 'You must enter a comment which has no more than 4,000 characters' },
        ])
      }
    })
  })
})
