import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import LocationRoutes, { Location } from './location'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentJourney, AppointmentJourneyMode, AppointmentType } from '../appointmentJourney'
import { EditAppointmentJourney } from '../editAppointmentJourney'
import { AppointmentLocationSummary } from '../../../../@types/activitiesAPI/types'
import EditAppointmentService from '../../../../services/editAppointmentService'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/editAppointmentService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const editAppointmentService = new EditAppointmentService(null, null) as jest.Mocked<EditAppointmentService>

describe('Route Handlers - Create Appointment - Location', () => {
  const handler = new LocationRoutes(activitiesService, editAppointmentService)
  let req: Request
  let res: Response
  const appointmentId = '2'

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
      redirectWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        appointmentJourney: {},
        editAppointmentJourney: {},
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

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/location', {
        locations,
        isCtaAcceptAndSave: false,
      })
    })

    it('should render the location view with accept and save', async () => {
      req.session.appointmentJourney.mode = AppointmentJourneyMode.EDIT
      req.params = {
        appointmentId,
      }

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/location', {
        locations,
        isCtaAcceptAndSave: true,
      })
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

    it('should save selected location in session and redirect to appointment set date page', async () => {
      req.session.appointmentJourney.type = AppointmentType.SET
      req.body = {
        locationId: 26149,
      }

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.location).toEqual({
        id: 26149,
        description: 'Gym',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('appointment-set-date')
    })

    it('validation fails when selected location is not found', async () => {
      req.body = {
        locationId: -1,
      }

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.CREATE(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'locationId',
        `Start typing the appointment location and select it from the list`,
      )
    })
  })

  describe('EDIT', () => {
    beforeEach(() => {
      req.params = {
        appointmentId: '2',
      }
    })

    it('should update the appointment and call redirect or edit', async () => {
      req.body = {
        locationId: 26149,
      }

      req.session.appointmentJourney = {
        location: {
          id: 26152,
          description: 'Chapel',
        },
      } as unknown as AppointmentJourney

      req.session.editAppointmentJourney = {} as unknown as EditAppointmentJourney

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.EDIT(req, res)

      expect(editAppointmentService.redirectOrEdit).toHaveBeenCalledWith(req, res, 'location')
    })

    it('validation fails when selected location is not found', async () => {
      req.body = {
        locationId: -1,
      }

      when(activitiesService.getAppointmentLocations).mockResolvedValue(locations)

      await handler.EDIT(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'locationId',
        `Start typing the appointment location and select it from the list`,
      )
    })
  })

  describe('Validation', () => {
    it('validation fails when no location id is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { property: 'locationId', error: 'Start typing the appointment location and select it from the list' },
        ]),
      )
    })

    it('validation fails when selected location id is not a number', async () => {
      const body = {
        locationId: 'NaN',
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { property: 'locationId', error: 'Start typing the appointment location and select it from the list' },
        ]),
      )
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
