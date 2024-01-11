import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import RemoveDateOptionRoutes, { RemoveDateOption } from './removeDateOption'

import ActivitiesService from '../../../../services/activitiesService'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocation - Remove Date option', () => {
  const handler = new RemoveDateOptionRoutes(activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'user',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      redirectWithSuccess: jest.fn(),
    } as unknown as Response

    req = {
      params: { mode: 'create', allocationId: 1 },
      query: { preserveHistory: true },
      session: {
        allocateJourney: {
          endDate: '2026-04-24',
          inmate: {
            prisonerName: 'John Smith',
          },
        },
      },
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/remove-date-option', {
        prisonerName: 'John Smith',
      })
    })
  })

  describe('POST', () => {
    it('should redirect to enter a new end date', async () => {
      req.body = {
        endDateOption: 'change',
      }

      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('end-date?preserveHistory=true')
    })

    it('create mode should remove the end date redirect to check answers', async () => {
      req.body = {
        endDateOption: 'remove',
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })

    it('edit mode should update the allocation and redirect with success', async () => {
      req.params.mode = 'edit'
      req.body = {
        endDateOption: 'remove',
      }

      await handler.POST(req, res)

      expect(activitiesService.updateAllocation).toHaveBeenCalledWith(
        1,
        {
          removeEndDate: true,
        },
        res.locals.user,
      )
      expect(res.redirectWithSuccess).toHaveBeenCalledWith(
        `/activities/allocations/view/1`,
        'Allocation updated',
        `You have removed the end date for this allocation`,
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        endDateOption: '',
      }

      const requestObject = plainToInstance(RemoveDateOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'endDateOption', error: 'Choose whether you want to change or remove the end date.' },
      ])
    })
  })
})
