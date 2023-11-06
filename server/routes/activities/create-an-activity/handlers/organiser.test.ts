import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import OrganiserRoutes, { OrganiserForm } from './organiser'
import ActivitiesService from '../../../../services/activitiesService'
import Organiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'
import EventTier from '../../../../enum/eventTiers'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Create an activity - Organiser', () => {
  const handler = new OrganiserRoutes(activitiesService)
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
      redirectOrReturn: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
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

      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/organiser', {
        organiserDescriptions,
      })
    })
  })

  describe('POST', () => {
    it('should save selected organiser in session and redirect to name page', async () => {
      req.body = {
        organiser: Organiser.PRISONER,
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.organiserCode).toEqual(Organiser.PRISONER)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('risk-level')
    })

    it('should update activity with selected organiser', async () => {
      req.body = {
        organiser: Organiser.PRISONER,
      }
      req.session.createJourney = {
        activityId: 1,
        name: 'English 1',
        tierCode: EventTier.FOUNDATION,
      }
      req.params = {
        mode: 'edit',
      }

      await handler.POST(req, res)

      expect(activitiesService.updateActivity).toBeCalledWith(user.activeCaseLoadId, 1, {
        organiserCode: Organiser.PRISONER,
        tierCode: EventTier.FOUNDATION,
      })

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "We've updated the organiser for English 1",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(OrganiserForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'organiser', error: 'Select an organiser' }]))
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        organiser: 'invalid',
      }

      const requestObject = plainToInstance(OrganiserForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(expect.arrayContaining([{ property: 'organiser', error: 'Select an organiser' }]))
    })

    it('passes validation', async () => {
      const body = {
        organiser: Organiser.EXTERNAL_PROVIDER,
      }

      const requestObject = plainToInstance(OrganiserForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
