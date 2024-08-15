import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import RemoveEndDateRoutes, { RemoveEndDateOptions } from './removeEndDate'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import activity from '../../../../services/fixtures/activity_1.json'
import { Activity } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Create an activity schedule - Remove end date', () => {
  const handler = new RemoveEndDateRoutes(activitiesService)
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {},
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/remove-end-date')
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to end date edit page', async () => {
      req.body = {
        removeEndDate: 'change',
      }

      req.session.createJourney = {
        activityId: 1,
        name: 'Maths level 1',
      }

      req.params = {
        mode: 'edit',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.removeEndDate).toEqual('change')
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`/activities/edit/1/end-date?preserveHistory=true`)
    })

    it('should send a null end date to the API', async () => {
      when(activitiesService.updateActivity)
        .calledWith(
          atLeast({
            endDate: null,
          }),
        )
        .mockResolvedValueOnce(activity as unknown as Activity)

      req.body = {
        removeEndDate: 'remove',
      }

      req.session.createJourney = {
        activityId: 1,
        name: 'Maths level 1',
      }

      req.params = {
        mode: 'edit',
      }

      await handler.POST(req, res)

      expect(req.session.createJourney.removeEndDate).toEqual('remove')
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        '/activities/view/1',
        'Activity updated',
        "You've successfully removed the end date for Maths level 1.",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        removeEndDate: '',
      }

      const requestObject = plainToInstance(RemoveEndDateOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'removeEndDate', error: "Please select if you want to change or remove this activity's end date." },
      ])
    })
  })
})
