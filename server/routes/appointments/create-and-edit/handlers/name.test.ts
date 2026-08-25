import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import NameRoutes, { Name } from './name'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentCategorySummary } from '../../../../@types/activitiesAPI/types'
import { AppointmentType } from '../appointmentJourney'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import { MetricsEventType } from '../../../../@types/metricsEvents'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/metricsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const metricsService = new MetricsService() as jest.Mocked<MetricsService>

describe('Route Handlers - Create Appointment - Name', () => {
  const handler = new NameRoutes(activitiesService, metricsService)
  let req: Request
  let res: Response

  const categories = [
    {
      code: 'CHAP',
      description: 'Chaplaincy',
    },
    {
      code: 'MEDO',
      description: 'Medical - Doctor',
    },
    {
      code: 'GYMW',
      description: 'Gym - Weights',
    },
    {
      code: 'VLB',
      description: 'Video Link - Court hearing',
    },
    {
      code: 'VLPM',
      description: 'Video Link - Probation Meeting',
    },
  ] as AppointmentCategorySummary[]

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
      session: {},
      journeyData: {
        appointmentJourney: {},
      },
      params: { journeyId: 'journeyId' },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the name view', async () => {
      req.journeyData.appointmentJourney.type = AppointmentType.GROUP

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/name', {
        categories,
      })
    })

    it('should remove VLB and VLPM category for appointment sets ', async () => {
      req.journeyData.appointmentJourney.type = AppointmentType.SET

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)
      const filteredCategories = categories
        .filter(category => category.code !== 'VLB')
        .filter(category => category.code !== 'VLPM')

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/name', {
        categories: filteredCategories,
      })
    })

    it('should start journey metrics when scheduling another appointment from the confirmation page', async () => {
      req.journeyData.appointmentJourney.type = AppointmentType.GROUP
      req.journeyData.appointmentJourney.fromAppointmentConfirmation = true

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.GET(req, res)

      expect(Date.now() - req.session.journeyMetrics.journeyStartTime).toBeLessThanOrEqual(1000)
      expect(req.session.journeyMetrics.source).toEqual('appointmentConfirmation')
      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        new MetricsEvent(MetricsEventType.CREATE_APPOINTMENT_JOURNEY_STARTED, res.locals.user)
          .addProperty('journeyId', 'journeyId')
          .addProperty('journeySource', 'appointmentConfirmation'),
      )
      expect(req.journeyData.appointmentJourney.fromAppointmentConfirmation).toBeUndefined()
    })
  })

  describe('POST', () => {
    it('should save selected category in session, use category description as appointment name and redirect to tier page', async () => {
      req.body = {
        categoryCode: 'MEDO',
        description: '',
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.journeyData.appointmentJourney.appointmentName).toEqual('Medical - Doctor')
      expect(req.journeyData.appointmentJourney.category).toEqual({
        code: 'MEDO',
        description: 'Medical - Doctor',
      })
      expect(req.journeyData.appointmentJourney.customName).toBeNull()
      expect(res.redirectOrReturn).toHaveBeenCalledWith('tier')
    })

    it('should save selected category and custom name in session, use custom name and category description as appointment name and redirect to location page', async () => {
      req.body = {
        categoryCode: 'CHAP',
        customName: 'Bible studies',
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.journeyData.appointmentJourney.appointmentName).toEqual('Bible studies (Chaplaincy)')
      expect(req.journeyData.appointmentJourney.category).toEqual({
        code: 'CHAP',
        description: 'Chaplaincy',
      })
      expect(req.journeyData.appointmentJourney.customName).toEqual('Bible studies')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('tier')
    })

    it('should trim custom name', async () => {
      req.body = {
        categoryCode: 'CHAP',
        customName: '    Bible studies   ',
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.journeyData.appointmentJourney.appointmentName).toEqual('Bible studies (Chaplaincy)')
      expect(req.journeyData.appointmentJourney.customName).toEqual('Bible studies')
    })

    it('should set custom name to null when undefined', async () => {
      req.body = {
        categoryCode: 'CHAP',
        customName: undefined,
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.journeyData.appointmentJourney.appointmentName).toEqual('Chaplaincy')
      expect(req.journeyData.appointmentJourney.customName).toBeNull()
    })

    it('should set custom name to null when null', async () => {
      req.body = {
        categoryCode: 'CHAP',
        customName: null,
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.journeyData.appointmentJourney.appointmentName).toEqual('Chaplaincy')
      expect(req.journeyData.appointmentJourney.customName).toBeNull()
    })

    it('should set custom name to null when empty string', async () => {
      req.body = {
        categoryCode: 'CHAP',
        customName: '',
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.journeyData.appointmentJourney.appointmentName).toEqual('Chaplaincy')
      expect(req.journeyData.appointmentJourney.customName).toBeNull()
    })

    it('should set custom name to null when whitespace', async () => {
      req.body = {
        categoryCode: 'CHAP',
        customName: '   ',
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.journeyData.appointmentJourney.appointmentName).toEqual('Chaplaincy')
      expect(req.journeyData.appointmentJourney.customName).toBeNull()
    })

    it('validation fails when selected category is not found', async () => {
      req.body = {
        categoryCode: 'NOT_FOUND',
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('categoryCode', `Start typing a name and select from the list`)
    })
  })

  describe('Validation', () => {
    it('validation fails when no category code is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'categoryCode', error: 'Start typing a name and select from the list' }]),
      )
    })

    it('validation fails when custom name is 41 characters', async () => {
      const body = {
        categoryCode: 'GYMW',
        customName: 'a'.repeat(41),
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { property: 'customName', error: 'You must enter a custom name which has no more than 40 characters' },
        ]),
      )
    })

    it('passes validation when valid category code is selected', async () => {
      const body = {
        categoryCode: 'GYMW',
        customName: '',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('passes validation when valid category code is selected and custom name is less than 41 characters', async () => {
      const body = {
        categoryCode: 'GYMW',
        customName: 'a'.repeat(40),
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
