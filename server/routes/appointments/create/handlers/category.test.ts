import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import CategoryRoutes, { Category } from './category'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentCategory } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create Appointment - Category', () => {
  const handler = new CategoryRoutes(activitiesService)
  let req: Request
  let res: Response

  const categories = [
    {
      id: 51,
      code: 'CHAP',
      description: 'Chaplaincy',
    },
    {
      id: 11,
      code: 'MEDO',
      description: 'Medical - Doctor',
    },
    {
      id: 20,
      code: 'GYMW',
      description: 'Gym - Weights',
    },
  ] as AppointmentCategory[]

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
    } as unknown as Response

    req = {
      session: {
        createAppointmentJourney: {},
      },
      flash: jest.fn(),
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the category view', async () => {
      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create/category', { categories })
    })
  })

  describe('POST', () => {
    it('should save selected category in session and redirect to location page', async () => {
      req.body = {
        categoryId: 11,
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.session.createAppointmentJourney.category).toEqual({
        id: 11,
        description: 'Medical - Doctor',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })

    it('validation fails when selected category is not found', async () => {
      req.body = {
        categoryId: -1,
      }

      when(activitiesService.getAppointmentCategories).mockResolvedValue(categories)

      await handler.POST(req, res)

      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify([{ field: 'categoryId', message: `Selected category not found` }]),
      )
      expect(res.redirect).toHaveBeenCalledWith('back')
    })
  })

  describe('Validation', () => {
    it('validation fails when no category id is selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'categoryId', error: 'Select a category' }]))
    })

    it('validation fails when selected category id is not a number', async () => {
      const body = {
        categoryId: 'NaN',
      }

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'categoryId', error: 'Select a category' }]))
    })

    it('passes validation when valid category id is selected', async () => {
      const body = {
        categoryId: '1',
      }

      const requestObject = plainToInstance(Category, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
