import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import OrganiserRoutes, { HostForm } from './host'
import Organiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'

describe('Route Handlers - Create Appointment - Host', () => {
  const handler = new OrganiserRoutes()
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      session: {
        appointmentJourney: {},
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
