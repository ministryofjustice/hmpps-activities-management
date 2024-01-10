import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import EditRequesterRoutes from './editRequester'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)

describe('Route Handlers - Waitlist application - Edit Requester', () => {
  const handler = new EditRequesterRoutes(activitiesService)
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
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { applicationId: 1 },
      session: { waitListApplicationJourney: { prisoner: { name: 'Alan Key' } } },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the edit requester template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/edit-requester`, {
        prisonerName: 'Alan Key',
      })
    })
  })

  describe('POST', () => {
    it('should set the requester in session if PRISONER is selected', async () => {
      req.body = {
        requester: 'PRISONER',
      }

      await handler.POST(req, res)

      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        1,
        { requestedBy: 'PRISONER' },
        { username: 'joebloggs' },
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `view`,
        `You have updated the requester of Alan Key's application`,
      )
    })

    it('should set the requester in session if GUIDANCE_STAFF is selected', async () => {
      req.body = {
        requester: 'GUIDANCE_STAFF',
      }

      await handler.POST(req, res)

      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        1,
        { requestedBy: 'GUIDANCE_STAFF' },
        { username: 'joebloggs' },
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `view`,
        `You have updated the requester of Alan Key's application`,
      )
    })

    it('should set the requester in session if SOMEONE_ELSE is selected', async () => {
      req.body = {
        requester: 'SOMEONE_ELSE',
        otherRequester: 'ACTIVITY_LEADER',
      }

      await handler.POST(req, res)

      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        1,
        { requestedBy: 'ACTIVITY_LEADER' },
        { username: 'joebloggs' },
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `view`,
        `You have updated the requester of Alan Key's application`,
      )
    })
  })
})
