import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import EditCommentRoutes, { Comment } from './editComment'
import ActivitiesService from '../../../../../services/activitiesService'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null)

describe('Route Handlers - Waitlist application - Edit Comment', () => {
  const handler = new EditCommentRoutes(activitiesService)
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
    it('should render the edit comment template', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/edit-comment`)
    })
  })

  describe('POST', () => {
    it('should patch the application with the new comment and redirect', async () => {
      req.body = {
        comment: 'test comment',
      }

      await handler.POST(req, res)

      expect(activitiesService.patchWaitlistApplication).toHaveBeenCalledWith(
        1,
        { comments: 'test comment' },
        { username: 'joebloggs' },
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `view`,
        `You have updated the comment for Alan Key's application`,
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a long comment is entered', async () => {
      const body = {
        comment:
          'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus',
      }

      const requestObject = plainToInstance(Comment, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([{ property: 'comment', error: 'Comment must be 500 characters or less' }])
    })

    it('validation passes', async () => {
      const body = {
        comment: 'test comment',
      }

      const requestObject = plainToInstance(Comment, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors.length).toEqual(0)
    })

    it('transforms blank comment to undefined', async () => {
      const body = {
        comment: '',
      }

      const requestObject = plainToInstance(Comment, body)

      expect(requestObject.comment).toBeUndefined()
    })

    it('does not transform a non-blank comment', async () => {
      const body = {
        comment: 'test comment',
      }

      const requestObject = plainToInstance(Comment, body)

      expect(requestObject.comment).toEqual('test comment')
    })
  })
})
