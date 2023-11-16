import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import TierRoutes, { TierForm } from './tier'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'
import Organiser from '../../../../enum/eventOrganisers'

describe('Route Handlers - Create Appointment - Tier', () => {
  const handler = new TierRoutes()
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
        appointmentJourney: {},
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/tier', {
        eventTierDescriptions,
      })
    })
  })

  describe('CREATE', () => {
    it('should save selected tier in session and redirect to location page', async () => {
      req.body = {
        tier: EventTier.TIER_1,
      }

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.tierCode).toEqual(EventTier.TIER_1)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('location')
    })

    it('should save selected tier in session and redirect to host page if tier 2 selected', async () => {
      req.body = {
        tier: EventTier.TIER_2,
      }

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.tierCode).toEqual(EventTier.TIER_2)
      expect(res.redirect).toHaveBeenCalledWith('host')
    })

    it('should remove organiser if tier 2 not selected', async () => {
      req.body = {
        tier: EventTier.TIER_1,
      }
      req.session.appointmentJourney.organiserCode = Organiser.PRISON_STAFF

      await handler.CREATE(req, res)

      expect(req.session.appointmentJourney.organiserCode).toBeNull()
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(TierForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'tier', error: 'Select an appointment tier' }]))
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        tier: 'invalid',
      }

      const requestObject = plainToInstance(TierForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'tier', error: 'Select an appointment tier' }]))
    })

    it('passes validation', async () => {
      const body = {
        tier: EventTier.TIER_1,
      }

      const requestObject = plainToInstance(TierForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
