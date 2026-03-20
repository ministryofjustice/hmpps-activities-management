import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../../utils/utils'
import ReinstateReasonRoutes, { ReinstateReasonForm } from './reinstateReason'
import ActivitiesService from '../../../../../services/activitiesService'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null)
const fakeWaitlistApplicationJourneyData = { prisoner: { name: 'Alan Key' } }

describe('Route Handlers - Waitlist application - Reinstate Reason', () => {
  const handler = new ReinstateReasonRoutes(activitiesService)
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
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { applicationId: 1 },
      journeyData: { waitListApplicationJourney: fakeWaitlistApplicationJourneyData },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the reinstate reason template', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/waitlist-application/reinstate-reason', {})
    })
  })

  describe('POST', () => {
    it('should redirect to view when reason is provided', async () => {
      req.body = {
        reinstateReason: 'The prisoner has completed their required courses',
      }

      await handler.POST(req, res)

      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        './view',
        `You have updated the status of ${fakeWaitlistApplicationJourneyData.prisoner.name}'s application`,
      )
    })
  })

  describe('type validation', () => {
    it('validation fails when no reason is provided', async () => {
      const body = {
        reinstateReason: '',
      }

      const requestObject = plainToInstance(ReinstateReasonForm, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toContainEqual({
        property: 'reinstateReason',
        error: 'Enter the reason',
      })
    })

    it('validation passes when a reason is provided', async () => {
      const body = {
        reinstateReason: 'Example text reason',
      }

      const requestObject = plainToInstance(ReinstateReasonForm, body)
      const errors = await validate(requestObject)

      expect(errors).toHaveLength(0)
    })
  })
})
