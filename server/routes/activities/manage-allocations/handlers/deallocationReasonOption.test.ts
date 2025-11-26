import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import DeallocationReasonOptionRoutes, { DeallocationReasonOption } from './deallocationReasonOption'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation - Deallocation reason option', () => {
  const handler = new DeallocationReasonOptionRoutes(activitiesService)
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
      redirectOrReturn: jest.fn(),
    } as unknown as Response

    req = {
      body: {},
      params: {
        allocationId: 1,
      },
      journeyData: {
        allocateJourney: {
          inmate: {
            prisonerName: 'John Smith',
          },
          activity: {
            scheduleId: 2,
          },
          deallocationReason: 'WITHDRAWN_STAFF',
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view - Including current deallocation reason', async () => {
      when(activitiesService.getDeallocationReasons).mockResolvedValue([
        { code: 'WITHDRAWN_STAFF', description: 'Withdrawn by staff' },
      ])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/deallocation-reason-option', {
        currentDeallocationReason: 'Withdrawn by staff',
      })
    })
  })

  describe('POST', () => {
    it('should redirect to deallocation reason page when selecting yes', async () => {
      req.body.deallocationReasonOption = 'yes'

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('reason')
    })

    it('should redirect to check answers page when selecting no', async () => {
      req.body.deallocationReasonOption = 'no'

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        deallocationReasonOption: '',
      }

      const requestObject = plainToInstance(DeallocationReasonOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'deallocationReasonOption', error: 'Select if you want to change the reason' },
      ])
    })
  })
})
