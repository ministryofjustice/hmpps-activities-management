import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import AppointmentSetAddExtraInformationRoutes, {
  AppointmentSetAppointmentExtraInformation,
} from './appointmentSetAddExtraInformation'
import { AppointmentSetJourney } from '../../appointmentSetJourney'

describe('Route Handlers - Create Appointment Set - Add Extra Information', () => {
  const handler = new AppointmentSetAddExtraInformationRoutes()
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

      expect(res.render).toHaveBeenCalledWith(
        'pages/appointments/create-and-edit/appointment-set/add-extra-information',
        {
          prisoner: testPrisonerAppointment.prisoner,
          extraInformation: undefined,
        },
      )
    })

    it('fails to find prisoner appointment and redirect to the appointment set extra information page', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
        extraInformation: 'An appointment extra information',
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.params = {
        prisonerNumber: 'INVALID',
      }

      handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('../appointment-set-extra-information')
      expect(res.render).toHaveBeenCalledTimes(0)
    })
  })

  describe('POST', () => {
    it('adds extra information to appointment and redirects back to the appointment set extra information page', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.body = {
        extraInformation: 'Extra information',
      }
      req.params = {
        prisonerNumber: 'A1234BC',
      }

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toBeUndefined()

      handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('Extra information')
      expect(res.redirect).toHaveBeenCalledWith('../appointment-set-extra-information')
    })

    it('updates existing extra information and redirects back to the appointment set extra information page', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
        extraInformation: 'Extra information',
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.body = {
        extraInformation: 'Different extra information',
      }
      req.params = {
        prisonerNumber: 'A1234BC',
      }

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('Extra information')

      handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('Different extra information')
      expect(res.redirect).toHaveBeenCalledWith('../appointment-set-extra-information')
    })

    it('fails to find prisoner and redirects back to the appointment set extra information page with session unchanged', async () => {
      const testPrisonerAppointment = {
        prisoner: {
          number: 'A1234BC',
        },
        extraInformation: 'Extra information',
      }
      req.session.appointmentSetJourney.appointments = [
        testPrisonerAppointment,
      ] as AppointmentSetJourney['appointments']

      req.body = {
        extraInformation: 'Different extra information',
      }
      req.params = {
        prisonerNumber: 'INVALID',
      }

      handler.POST(req, res)

      expect(req.session.appointmentSetJourney.appointments).toHaveLength(1)
      expect(req.session.appointmentSetJourney.appointments[0].extraInformation).toEqual('Extra information')
      expect(res.redirect).toHaveBeenCalledWith('../appointment-set-extra-information')
    })
  })

  describe('Validation', () => {
    it.each([
      { extraInformation: Array(4001).fill('a').join(''), isValid: false },
      { extraInformation: Array(4000).fill('a').join(''), isValid: true },
      { extraInformation: Array(3999).fill('a').join(''), isValid: true },
    ])('should validate extra information character length', async ({ extraInformation, isValid }) => {
      const body = {
        extraInformation,
      }

      const requestObject = plainToInstance(AppointmentSetAppointmentExtraInformation, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      if (isValid) {
        expect(errors).toHaveLength(0)
      } else {
        expect(errors).toEqual([
          {
            property: 'extraInformation',
            error: 'You must enter extra information which has no more than 4,000 characters',
          },
        ])
      }
    })
  })
})
