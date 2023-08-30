import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { when } from 'jest-when'
import EndDateOptionRoutes, { EndDateOption } from './endDateOption'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import allocation from '../../../../services/fixtures/allocation_1.json'
import { Allocation } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit allocation - End Date option', () => {
  const handler = new EndDateOptionRoutes(activitiesService)
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
    } as unknown as Response

    req = {
      params: {
        allocationId: 1,
      },
    } as unknown as Request
  })

  describe('GET', () => {
    beforeEach(() => {
      when(activitiesService.getAllocation)
        .calledWith(atLeast(1))
        .mockResolvedValue(allocation as Allocation)
    })
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/allocation-dashboard/end-date-option', {
        allocation,
        allocationId: 1,
        prisonerNumber: 'ABC123',
        scheduleId: 2,
      })
    })
  })

  describe('POST', () => {
    it('should save selected option in session and redirect to change date page', async () => {
      req.body = {
        endDateOption: 'change',
      }

      await handler.POST(req, res)

      expect(res.redirectOrReturn).toHaveBeenCalledWith('end-date')
    })

    it('should save entered end date in database', async () => {
      const updatedAllocation = {
        removeEndDate: true,
      }

      when(activitiesService.updateAllocation)
        .calledWith(atLeast(updatedAllocation))
        .mockResolvedValueOnce(allocation as unknown as Allocation)

      req = {
        session: {},
        body: {
          endDateOption: 'remove',
          scheduleId: 1,
          prisonerNumber: 'ABC123',
        },
      } as unknown as Request

      await handler.POST(req, res)

      expect(res.redirectOrReturnWithSuccess).toHaveBeenCalledWith(
        '/activities/allocation-dashboard/1/check-allocation/ABC123',
        'Allocation updated',
        "We've removed the end date for this allocation",
      )
    })
  })

  describe('type validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        endDateOption: '',
      }

      const requestObject = plainToInstance(EndDateOption, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'endDateOption', error: 'Choose whether you want to change or remove the end date.' },
      ])
    })
  })
})
