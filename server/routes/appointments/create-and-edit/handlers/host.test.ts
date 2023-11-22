import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import OrganiserRoutes, { HostForm } from './host'
import Organiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'
import EditAppointmentService from '../../../../services/editAppointmentService'
import { AppointmentJourney, AppointmentJourneyMode } from '../appointmentJourney'

jest.mock('../../../../services/editAppointmentService')

const editAppointmentService = new EditAppointmentService(null, null) as jest.Mocked<EditAppointmentService>

describe('Route Handlers - Create Appointment - Host', () => {
  const handler = new OrganiserRoutes(editAppointmentService)
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoadId: 'MDI',
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      session: {
        appointmentJourney: {},
        editAppointmentJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/host', {
        organiserDescriptions,
        isCtaAcceptAndSave: false,
      })
    })

    it('should render the expected view with accept and save', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.params = {
        appointmentId: '2',
      }

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/host', {
        organiserDescriptions,
        isCtaAcceptAndSave: true,
      })
    })
  })

  describe('CREATE', () => {
    it('should save selected organiser in session and redirect to location page', async () => {
      req.body = {
        host: Organiser.PRISONER,
      }

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.organiserCode).toEqual(Organiser.PRISONER)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })
  })

  describe('EDIT', () => {
    it('should update host and call redirect or edit', async () => {
      req.body = {
        host: Organiser.PRISONER,
      }

      req.session.appointmentJourney = {
        organiserCode: Organiser.PRISON_STAFF,
      } as unknown as AppointmentJourney

      await handler.EDIT(req, res)

      expect(req.session.editAppointmentJourney.organiserCode).toEqual(Organiser.PRISONER)
      expect(editAppointmentService.redirectOrEdit).toHaveBeenCalledWith(req, res, 'host')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(HostForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'host', error: 'Select an appointment host' }]))
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        host: 'invalid',
      }

      const requestObject = plainToInstance(HostForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'host', error: 'Select an appointment host' }]))
    })

    it('passes validation', async () => {
      const body = {
        host: Organiser.EXTERNAL_PROVIDER,
      }

      const requestObject = plainToInstance(HostForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
