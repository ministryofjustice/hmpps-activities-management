import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import LocationRoutes, { Location } from './location'
import PrisonService from '../../../../services/prisonService'
import eventLocations from '../../../../services/fixtures/event_locations_2.json'
import eventLocationsFiltered from '../../../../services/fixtures/event_locations_filtered_2.json'

jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Create an activity schedule - location', () => {
  const handler = new LocationRoutes(prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createScheduleJourney: {},
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
      expect(res.render).toHaveBeenCalledWith('pages/manage-schedules/create-schedule/location', {
        locations: eventLocationsFiltered,
      })
    })
  })

  describe('POST', () => {
    it('should save selected location in session and redirect to capacity page', async () => {
      req.body = {
        location: 27019,
      }

      when(prisonService.getEventLocations).mockResolvedValue(eventLocations)

      await handler.POST(req, res)

      expect(req.session.createScheduleJourney.location).toEqual({
        id: 27019,
        name: 'Workshop 9',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith('capacity')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'location', error: 'Select a location' }]))
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        category: 'bad',
      }

      const requestObject = plainToInstance(Location, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'location', error: 'Select a location' }]))
    })
  })
})
