import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ChooseDetailsByResidentialLocationRoutes, {
  ChooseDetailsByResidentialLocationForm,
} from './chooseDetailsByResidentialLocation'
import ActivitiesService from '../../../../../services/activitiesService'
import { LocationGroup } from '../../../../../@types/activitiesAPI/types'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const mockLocations = [
  {
    name: 'A-Wing',
    key: 'A-Wing',
    children: [],
  },
  {
    name: 'B-Wing',
    key: 'B-Wing',
    children: [],
  },
  {
    name: 'C-Wing',
    key: 'C-Wing',
    children: [],
  },
]

describe('Route Handlers - Choose details by activity location', () => {
  const handler = new ChooseDetailsByResidentialLocationRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'RSI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      query: {},
    } as unknown as Request

    when(activitiesService.getLocationGroups)
      .calledWith(res.locals.user)
      .mockResolvedValue(mockLocations as unknown as LocationGroup[])
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/attend-all/choose-details-by-residential-location',
        {
          locationGroups: mockLocations,
        },
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {
        datePresetOption: '',
        timePeriod: '',
        locationKey: '',
      }

      const requestObject = plainToInstance(ChooseDetailsByResidentialLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select a date' },
        { property: 'timePeriod', error: 'Select a time period' },
        { property: 'locationKey', error: 'Select a residential location' },
      ])
    })

    it('validation fails for conditional date', async () => {
      const body = {
        datePresetOption: 'other',
        timePeriod: 'PM',
        locationKey: 'A',
      }

      const requestObject = plainToInstance(ChooseDetailsByResidentialLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails for future date values', async () => {
      const body = {
        datePresetOption: 'other',
        date: format(addDays(new Date(), 61), 'dd/MM/yyyy'),
        timePeriod: 'PM',
        locationKey: 'A',
      }

      const requestObject = plainToInstance(ChooseDetailsByResidentialLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 60 days in the future' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: 'today',
        timePeriod: 'AM',
        locationKey: 'A',
      }

      const requestObject = plainToInstance(ChooseDetailsByResidentialLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
