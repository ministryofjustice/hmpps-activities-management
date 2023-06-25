import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../utils/utils'
import LocationRoutes, { InCell, Location } from './location'
import PrisonService from '../../../services/prisonService'
import eventLocations from '../../../services/fixtures/event_locations_2.json'
import eventLocationsFiltered from '../../../services/fixtures/event_locations_filtered_2.json'
import ActivitiesService from '../../../services/activitiesService'
import atLeast from '../../../../jest.setup'
import activity from '../../../services/fixtures/activity_1.json'
import { Activity } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/prisonService')
jest.mock('../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null)
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
describe('Route Handlers - Create an activity schedule - location', () => {
  const handler = new LocationRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

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
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      when(prisonService.getEventLocations).mockResolvedValue(eventLocations)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/create-an-activity/location', {
        locations: eventLocationsFiltered,
      })
    })
  })

  describe('POST', () => {
    it('should save selected out of cell location in session and redirect to capacity page', async () => {
      req.body = {
        inCell: InCell.OUT_OF_CELL,
        location: 27019,
      }

      when(prisonService.getEventLocations).mockResolvedValue(eventLocations)

      await handler.POST(req, res)

      expect(req.session.createJourney.location).toEqual({
        id: 27019,
        name: 'Workshop 9',
      })
      expect(req.session.createJourney.inCell).toEqual(false)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('capacity')
    })

    it('should save in cell to session and redirect to capacity page', async () => {
      req.body = {
        inCell: InCell.IN_CELL,
      }

      when(prisonService.getEventLocations).mockResolvedValue(eventLocations)

      await handler.POST(req, res)

      expect(req.session.createJourney.location).toEqual(null)
      expect(req.session.createJourney.inCell).toEqual(true)

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
        session: {
          createJourney: {},
        },
        query: {
          fromEditActivity: true,
        },
        body: {
          location: 1234,
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/schedule/activities/undefined',
        'Activity updated',
        "We've updated the location for undefined",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if in cell / out of cell option is not selected', async () => {
      const body = {}

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'inCell', error: 'Select whether location is in-cell or out of cell' }]),
      )
    })

    it('validation fails if a out of cell location is selected and no value entered', async () => {
      const body = {
        inCell: InCell.OUT_OF_CELL,
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'location', error: 'Select a location' }]))
    })

    it('validation fails if a bad location value is entered', async () => {
      const body = {
        inCell: InCell.OUT_OF_CELL,
        category: 'bad',
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'location', error: 'Select a location' }]))
    })
  })
})
