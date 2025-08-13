import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import LocationRoutes, { Location } from './location'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'
import LocationType from '../../../../enum/locationType'
import LocationsService, { LocationWithDescription } from '../../../../services/locationsService'

jest.mock('../../../../services/locationsService')
jest.mock('../../../../services/activitiesService')

const locationsService = new LocationsService(null)
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
describe('Route Handlers - Create an activity schedule - location', () => {
  const handler = new LocationRoutes(activitiesService, locationsService)
  let req: Request
  let res: Response

  const aWing = {
    id: '11111111-1111-1111-1111-111111111111',
    prisonId: 'RSI',
    code: 'AWING',
    locationType: 'RESIDENTIAL_UNIT',
    localName: 'A Wing',
    description: 'A Wing',
  }

  const bWing = {
    id: '22222222-2222-2222-2222-222222222222',
    prisonId: 'RSI',
    code: 'BWING',
    locationType: 'RESIDENTIAL_UNIT',
    description: 'BWING',
  }

  const locations: LocationWithDescription[] = [aWing, bWing] as LocationWithDescription[]

  beforeEach(() => {
    res = {
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      journeyData: {
        createJourney: {},
      },
      params: {},
      routeContext: { mode: 'create' },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(locationsService.fetchActivityLocations).mockResolvedValue(locations)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/location', {
        locations: [aWing, bWing],
      })
    })
  })

  describe('POST', () => {
    it('should save selected out of cell location in session and redirect to capacity page', async () => {
      req.body = {
        locationType: LocationType.OUT_OF_CELL,
        location: '22222222-2222-2222-2222-222222222222',
      }

      when(locationsService.fetchActivityLocations).mockResolvedValue(locations)

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.location).toEqual({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'BWING',
      })
      expect(req.journeyData.createJourney.inCell).toEqual(false)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('capacity')
    })

    it('should save in cell to session and redirect to capacity page', async () => {
      req.body = {
        locationType: LocationType.IN_CELL,
      }

      when(locationsService.fetchActivityLocations).mockResolvedValue(locations)

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.location).toEqual(null)
      expect(req.journeyData.createJourney.inCell).toEqual(true)
      expect(req.journeyData.createJourney.onWing).toEqual(false)
      expect(req.journeyData.createJourney.offWing).toEqual(false)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('capacity')
    })

    it('should save on wing to session and redirect to capacity page', async () => {
      req.body = {
        locationType: LocationType.ON_WING,
      }

      when(locationsService.fetchActivityLocations).mockResolvedValue(locations)

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.location).toEqual(null)
      expect(req.journeyData.createJourney.inCell).toEqual(false)
      expect(req.journeyData.createJourney.onWing).toEqual(true)
      expect(req.journeyData.createJourney.offWing).toEqual(false)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('capacity')
    })

    it('should save off wing to session and redirect to capacity page', async () => {
      req.body = {
        locationType: LocationType.OFF_WING,
      }

      when(locationsService.fetchActivityLocations).mockResolvedValue(locations)

      await handler.POST(req, res)

      expect(req.journeyData.createJourney.location).toEqual(null)
      expect(req.journeyData.createJourney.inCell).toEqual(false)
      expect(req.journeyData.createJourney.onWing).toEqual(false)
      expect(req.journeyData.createJourney.offWing).toEqual(true)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('capacity')
    })

    it('should save entered location in database', async () => {
      const updatedActivity = {
        locationId: 1234,
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      req = {
        session: {},
        journeyData: {
          createJourney: {
            activityId: '1',
          },
        },
        routeContext: { mode: 'edit' },
        body: {
          location: 1234,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've updated the location for undefined",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if location type is not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([
          { property: 'locationType', error: 'Select whether location is in-cell or out of cell' },
        ]),
      )
    })

    it('validation fails if a out of cell location is selected and no value entered', async () => {
      const body = {
        locationType: LocationType.OUT_OF_CELL,
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'location', error: 'Select a location' }]))
    })

    it('validation passes if valid location type provided', async () => {
      const body = {
        locationType: LocationType.ON_WING,
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toBe(0)
    })

    it('validation passes if out of cell location type selected with valid location id', async () => {
      const body = {
        locationType: LocationType.OUT_OF_CELL,
        location: 1234,
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toBe(0)
    })
  })
})
