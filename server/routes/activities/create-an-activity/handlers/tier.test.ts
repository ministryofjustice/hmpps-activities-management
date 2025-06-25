import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import TierRoutes, { TierForm } from './tier'
import ActivitiesService from '../../../../services/activitiesService'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'
import Organiser from '../../../../enum/eventOrganisers'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Create an activity - Tier', () => {
  const handler = new TierRoutes(activitiesService)
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
    activeCaseLoadId: 'MDI',
  }

  beforeEach(() => {
    res = {
      locals: {
        user,
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      query: {},
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
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/tier', {
        eventTierDescriptions,
      })
    })
  })

  describe('POST', () => {
    it('should save selected tier in session and redirect to risk level page', async () => {
      req.routeContext = { mode: 'create' }
      req.body = {
        tier: EventTier.TIER_1,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.tierCode).toEqual(EventTier.TIER_1)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('risk-level')
    })

    it('should save selected tier in session and redirect organiser page if tier 2 selected', async () => {
      req.routeContext = { mode: 'create' }
      req.body = {
        tier: EventTier.TIER_2,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.tierCode).toEqual(EventTier.TIER_2)
      expect(res.redirect).toHaveBeenCalledWith('organiser')
    })

    it('should remove organiser if tier 2 not selected', async () => {
      req.routeContext = { mode: 'create' }
      req.body = {
        tier: EventTier.TIER_1,
      }
      req.session.createJourney = {
        organiserCode: Organiser.PRISON_STAFF,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.organiserCode).toBeNull()
    })

    it('should update activity with selected activity tier', async () => {
      req.routeContext = { mode: 'edit' }
      req.body = {
        tier: EventTier.TIER_1,
      }
      req.session.createJourney = {
        activityId: 1,
        name: 'English 1',
      }

      await handler.POST(req, res)

      expect(activitiesService.updateActivity).toHaveBeenCalledWith(
        1,
        {
          tierCode: EventTier.TIER_1,
          attendanceRequired: true,
        },
        user,
      )

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "We've updated the tier for English 1",
      )
    })

    it('should set attendance required to true if tier is not foundation', async () => {
      req.routeContext = { mode: 'create' }
      req.body = {
        tier: EventTier.TIER_1,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.attendanceRequired).toEqual(true)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('risk-level')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}
      req.routeContext = { mode: 'create' }

      const requestObject = plainToInstance(TierForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'tier', error: 'Select an activity tier' }]))
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        tier: 'invalid',
      }
      req.routeContext = { mode: 'create' }

      const requestObject = plainToInstance(TierForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'tier', error: 'Select an activity tier' }]))
    })

    it('passes validation', async () => {
      const body = {
        tier: EventTier.TIER_1,
      }
      req.routeContext = { mode: 'create' }

      const requestObject = plainToInstance(TierForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
