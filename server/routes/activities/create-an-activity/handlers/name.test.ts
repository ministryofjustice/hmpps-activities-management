import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import NameRoutes, { Name } from './name'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity - Name', () => {
  const handler = new NameRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirectOrReturnWithSuccess: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/name')
    })
  })

  describe('POST', () => {
    beforeEach(() => {
      when(activitiesService.getActivities)
        .calledWith(atLeast(true))
        .mockResolvedValue([
          {
            id: 6,
            activityName: 'Gym Induction',
            category: {
              id: 5,
              code: 'SAA_INDUCTION',
              name: 'Induction',
              description: 'Such as gym induction, education assessments or health and safety workshops',
            },
            capacity: 102,
            allocated: 69,
            waitlisted: 1,
            createdTime: '2023-07-20T16:05:16',
            activityState: 'LIVE',
          },
        ])
    })
    it('should save entered name in session and redirect to tier page', async () => {
      req.body = {
        name: 'Maths Level 1',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.name).toEqual('Maths Level 1')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('tier')
    })

    it('should save entered name in session and redirect to risk level page if category "not in work"', async () => {
      req.body = {
        name: 'Maths Level 1',
      }
      req.session.createJourney.category = {
        id: 1,
        code: 'SAA_NOT_IN_WORK',
        name: 'Not in work',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.name).toEqual('Maths Level 1')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('risk-level')
    })

    it('should save entered activity name in database', async () => {
      const updatedActivity = {
        summary: 'Updated Activity Name',
      }

      when(activitiesService.updateActivity)
        .calledWith(atLeast(updatedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      req = {
        session: {
          createJourney: {
            activityId: '1',
          },
        },
        params: {
          mode: 'edit',
        },
        body: {
          name: 'updated activity name',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've updated the activity name for updated activity name",
      )
    })

    it('should call duplicate activity name validation upon creating new activity name', async () => {
      req = {
        session: {
          createJourney: {
            activityId: undefined,
          },
        },
        params: {
          mode: 'create',
        },
        body: {
          name: 'Gym Induction',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(req.session.createJourney.name).toEqual('Gym Induction')
      expect(res.validationFailed).toHaveBeenCalledWith(
        'name',
        'Enter a different name. There is already an activity with this name',
      )
    })

    it('should not call validation upon editing existing activity with the same name and activity ID', async () => {
      req = {
        session: {
          createJourney: {
            activityId: 6,
          },
        },
        params: {
          mode: 'edit',
        },
        body: {
          name: 'Gym Induction',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(req.session.createJourney.name).toEqual('Gym Induction')
      expect(res.validationFailed).toHaveBeenCalledTimes(0)
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        name: '',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))
      expect(errors).toEqual([{ property: 'name', error: 'Enter the name of the activity' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        name: '',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'name', error: 'Enter the name of the activity' }])
    })

    it('validation fails if name contains more than 40 characters', async () => {
      const body = {
        name: 'An unreasonably long activity name to test validation',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'name', error: 'You must enter a name which has no more than 40 characters' },
      ])
    })

    it('passes validation', async () => {
      const body = {
        name: 'Maths level 1',
      }

      const requestObject = plainToInstance(Name, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
