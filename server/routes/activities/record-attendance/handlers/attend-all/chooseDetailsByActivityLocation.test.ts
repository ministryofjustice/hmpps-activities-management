import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { addDays, format } from 'date-fns'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ChooseDetailsByActivityLocationRoutes, {
  ChooseDetailsByActivityLocationForm,
} from './chooseDetailsByActivityLocation'
import LocationsService, { LocationWithDescription } from '../../../../../services/locationsService'
import nonResidentialActivityLocations from '../../../../../services/fixtures/nonResidentialActivityLocations.json'
import LocationType from '../../../../../enum/locationType'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/locationsService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const locationService = new LocationsService(null) as jest.Mocked<LocationsService>

describe('Route Handlers - Choose details by activity location', () => {
  const handler = new ChooseDetailsByActivityLocationRoutes(activitiesService, locationService)
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

    when(locationService.fetchNonResidentialActivityLocations)
      .calledWith('RSI', res.locals.user)
      .mockResolvedValue(nonResidentialActivityLocations as unknown as LocationWithDescription[])
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/record-attendance/attend-all/choose-details-by-activity-location',
        {
          locations: nonResidentialActivityLocations.filter(l => l.locationType !== 'BOX'),
        },
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if values are not entered', async () => {
      const body = {
        datePresetOption: '',
        timePeriod: '',
        locationType: '',
      }

      const requestObject = plainToInstance(ChooseDetailsByActivityLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'datePresetOption', error: 'Select a date' },
        { property: 'timePeriod', error: 'Select a time period' },
        { property: 'locationType', error: 'Search for a specific location, or select a location option' },
      ])
    })

    it('validation fails for conditional date', async () => {
      const body = {
        datePresetOption: 'other',
        timePeriod: 'PM',
        locationType: LocationType.IN_CELL,
      }

      const requestObject = plainToInstance(ChooseDetailsByActivityLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a valid date' }])
    })

    it('validation fails for conditional location', async () => {
      const body = {
        datePresetOption: 'today',
        timePeriod: 'PM',
        locationType: LocationType.OUT_OF_CELL,
      }

      const requestObject = plainToInstance(ChooseDetailsByActivityLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'location', error: 'Enter a location and select it from the list' }])
    })

    it('validation fails for future date values', async () => {
      const body = {
        datePresetOption: 'other',
        date: format(addDays(new Date(), 61), 'dd/MM/yyyy'),
        timePeriod: 'PM',
        locationType: LocationType.IN_CELL,
      }

      const requestObject = plainToInstance(ChooseDetailsByActivityLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'date', error: 'Enter a date up to 60 days in the future' }])
    })

    it('passes validation', async () => {
      const body = {
        datePresetOption: 'today',
        timePeriod: 'AM',
        locationType: LocationType.IN_CELL,
      }

      const requestObject = plainToInstance(ChooseDetailsByActivityLocationForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
