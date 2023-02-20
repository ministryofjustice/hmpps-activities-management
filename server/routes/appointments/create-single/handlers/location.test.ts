import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import LocationRoutes, { Location } from './location'
import PrisonService from '../../../../services/prisonService'
import { LocationLenient } from '../../../../@types/prisonApiImportCustom'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Create Single Appointment - Location', () => {
  const handler = new LocationRoutes(prisonService)
  let req: Request
  let res: Response

  const locations = [
    {
      locationId: 26152,
      userDescription: 'Chapel',
    },
    {
      locationId: 26149,
      userDescription: 'Gym',
    },
    {
      locationId: 26151,
      userDescription: 'Library',
    },
  ] as LocationLenient[]

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'test.user',
          activeCaseLoadId: 'TPR',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createSingleAppointmentJourney: {},
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the location view', async () => {
      when(prisonService.getLocationsForAppointments).mockResolvedValue(locations)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-single/location', { locations })
    })
  })

  describe('POST', () => {
    it('should save selected location in session and redirect to date and time page', async () => {
      req.body = {
        locationId: 26149,
      }

      when(prisonService.getLocationsForAppointments).mockResolvedValue(locations)

      await handler.POST(req, res)

      expect(req.session.createSingleAppointmentJourney.location).toEqual({
        id: 26149,
        description: 'Gym',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('date-and-time')
    })

    it('validation fails when selected location is not found', async () => {
      req.body = {
        locationId: -1,
      }

      when(prisonService.getLocationsForAppointments).mockResolvedValue(locations)

      await handler.POST(req, res)

      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify([{ field: 'locationId', message: `Selected location not found` }]),
      )
      expect(res.redirect).toHaveBeenCalledWith('back')
    })
  })

  describe('Validation', () => {
    it('validation fails when no location id is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'locationId', error: 'Select a location' }]))
    })

    it('validation fails when selected location id is not a number', async () => {
      const body = {
        locationId: 'NaN',
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'locationId', error: 'Select a location' }]))
    })

    it('passes validation when valid location id is selected', async () => {
      const body = {
        locationId: '1',
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
