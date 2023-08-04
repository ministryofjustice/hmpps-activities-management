import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import ActivityRoutes, { Activity as Body } from './activity'
import atLeast from '../../../../../jest.setup'
import {
  Activity,
  ActivityLite,
  PrisonerAllocations,
  WaitingListApplication,
} from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null)

describe('Route Handlers - Waitlist application - Request date', () => {
  const handler = new ActivityRoutes(activitiesService)
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
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        waitListApplicationJourney: {
          prisoner: {
            name: 'Alan Key',
            prisonerNumber: 'ABC123',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the activity template', async () => {
      when(activitiesService.getActivities)
        .calledWith(atLeast(true))
        .mockResolvedValue([
          {
            id: 1,
            description: 'test activity',
            category: { code: 'EDU' },
          },
          {
            id: 2,
            description: 'filtered activity',
            category: { code: 'SAA_NOT_IN_WORK' },
          },
        ] as ActivityLite[])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/activity`, {
        activities: [
          {
            id: 1,
            name: 'test activity',
          },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should set the activity in session and redirect to the requester route', async () => {
      req.body = {
        activityId: 1,
      }

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          description: 'test activity',
        } as unknown as Activity)
      when(activitiesService.getActivePrisonPrisonerAllocations).mockResolvedValue([])
      when(activitiesService.fetchActivityWaitlist).mockResolvedValue([])

      await handler.POST(req, res)

      expect(req.session.waitListApplicationJourney.activity).toEqual({
        activityId: 1,
        activityName: 'test activity',
      })
      expect(res.redirectOrReturn).toHaveBeenCalledWith(`requester`)
    })

    it('should throw validation error if prisoner already allocated', async () => {
      req.body = {
        activityId: 1,
      }

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          description: 'test activity',
        } as unknown as Activity)
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue([{ allocations: [{ scheduleId: 1 }] }] as PrisonerAllocations[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'activityId',
        'Alan Key is already allocated or on the waitlist for test activity',
      )
    })

    it('should throw validation error if prisoner already on a waitlist', async () => {
      req.body = {
        activityId: 1,
      }

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          description: 'test activity',
        } as unknown as Activity)
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue([])
      when(activitiesService.fetchActivityWaitlist)
        .calledWith(atLeast(1))
        .mockResolvedValue([{ prisonerNumber: 'ABC123', status: 'PENDING' }] as WaitingListApplication[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith(
        'activityId',
        'Alan Key is already allocated or on the waitlist for test activity',
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {}

      const requestObject = plainToInstance(Body, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'activityId', error: 'Select an activity' }])
    })

    it('validation fails if a bad value is entered', async () => {
      const body = {
        activityId: 'test',
      }

      const requestObject = plainToInstance(Body, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'activityId', error: 'Select an activity' }])
    })

    it('validation passes', async () => {
      const body = {
        activityId: '1',
      }

      const requestObject = plainToInstance(Body, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })
  })
})
