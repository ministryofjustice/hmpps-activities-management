import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import LocationRoutes, { Location } from './location'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentJourney } from '../appointmentJourney'
import atLeast from '../../../../../jest.setup'
import { AppointmentLocationSummary } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Location', () => {
  const handler = new LocationRoutes(activitiesService)
  let req: Request
  let res: Response

  const locations = [
    {
      id: 26152,
      description: 'Chapel',
    },
    {
      id: 26149,
      description: 'Gym',
    },
    {
      id: 26151,
      description: 'Library',
    },
  ] as AppointmentLocationSummary[]

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
      redirectOrReturnWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the location view', async () => {
      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/location', { locations })
    })
  })

  describe('CREATE', () => {
    it('should save selected location in session and redirect to date and time page', async () => {
      req.body = {
        locationId: 26149,
      }

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.location).toEqual({
        id: 26149,
        description: 'Gym',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('date-and-time')
    })

    it('validation fails when selected location is not found', async () => {
      req.body = {
        locationId: -1,
      }

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.CREATE(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('locationId', `Selected location not found`)
    })
  })

  describe('EDIT', () => {
    beforeEach(() => {
      req.params = {
        appointmentId: '2',
        occurrenceId: '12',
      }
    })

    it('should update the occurrence and redirect back to the occurrence details page', async () => {
      req.body = {
        locationId: 26152,
      }

      req.session.appointmentJourney = {
        location: {
          id: 26152,
          description: 'Chapel',
        },
      } as unknown as AppointmentJourney

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)
      when(activitiesService.editAppointmentOccurrence).calledWith(atLeast(12))

      await handler.EDIT(req, res)

      expect(activitiesService.editAppointmentOccurrence)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/appointments/2/occurrence/12',
        'Appointment location for this occurrence changed successfully',
      )
    })

    it('validation fails when selected location is not found', async () => {
      req.body = {
        locationId: -1,
      }

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.EDIT(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('locationId', `Selected location not found`)
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
