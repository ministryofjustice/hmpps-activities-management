import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CategoryRoutes, { Category } from './category'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentCategorySummary } from '../../../../@types/activitiesAPI/types'
import { AppointmentType } from '../appointmentJourney'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Category', () => {
  const handler = new CategoryRoutes(activitiesService)
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
    it('should render the category view with back to select prisoner page', async () => {
      req.session.appointmentJourney.type = AppointmentType.INDIVIDUAL

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/category', {
        backLinkHref: 'select-prisoner',
        categories,
      })
    })

    it('should render the category view with back to select prisoner page with prisoner selected', async () => {
      req.session.appointmentJourney.type = AppointmentType.INDIVIDUAL
      req.session.appointmentJourney.prisoners = [
        {
          number: 'A1234BC',
          name: 'TEST PRISONER',
          cellLocation: '1-1-1',
        },
      ]

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/category', {
        backLinkHref: 'select-prisoner?query=A1234BC',
        categories,
      })
    })

    it('should render the category view with back to review prisoners page', async () => {
      req.session.appointmentJourney.type = AppointmentType.GROUP

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/category', {
        backLinkHref: 'review-prisoners',
        categories,
      })
    })

    it('should render the category view with back link for type = BULK', async () => {
      req.session.appointmentJourney.type = AppointmentType.BULK

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/category', {
        backLinkHref: 'review-prisoners',
        categories,
      })
    })
  })

  describe('POST', () => {
    it('should save selected category in session, use category description as appointment name and redirect to location page', async () => {
      req.body = {
        categoryCode: 'MEDO',
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.session.appointmentJourney.appointmentName).toEqual('Medical - Doctor')
      expect(req.session.appointmentJourney.category).toEqual({
        code: 'MEDO',
        description: 'Medical - Doctor',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('description')
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

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'categoryCode', error: 'Start typing a name and select from the list' }]),
      )
    })

    it('passes validation when valid category code is selected', async () => {
      const body = {
        categoryCode: 'GYMW',
      }

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
