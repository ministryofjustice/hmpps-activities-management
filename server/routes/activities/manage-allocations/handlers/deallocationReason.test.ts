import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import DeallocationReasonRoutes, { DeallocationReason } from './deallocationReason'
import ActivitiesService from '../../../../services/activitiesService'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Deallocation reason', () => {
  const handler = new DeallocationReasonRoutes(activitiesService)

  let req: Request
  let res: Response

  const mockActivitiesData = () => {
    when(activitiesService.getDeallocationReasons).mockResolvedValue([{ code: 'OTHER', description: 'OTHER' }])
  }

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirectOrReturn: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { allocationId: 1 },
      session: {
        allocateJourney: {
          endDate: formatIsoDate(new Date()),
          inmate: {
            prisonerNumber: 'ABC123',
          },
          inmates: [{ prisonerNumber: 'ABC123' }],
          activity: {
            activityId: 1,
            scheduleId: 1,
          },
          deallocationCaseNote: {
            type: 'GEN',
            text: 'Preset case note',
          },
        },
      },
    } as unknown as Request

    mockActivitiesData()
  })

  describe('GET', () => {
    it('should render the expected view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/deallocation-reason', {
        deallocationReasons: [{ code: 'OTHER', description: 'OTHER' }],
        allocationId: 1,
      })
    })
  })

  describe('POST', () => {
    it('redirect to case note when reason for deallocation is eligible', async () => {
      req.body = {
        deallocationReason: 'OTHER',
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocationReason).toEqual('OTHER')
      expect(res.redirectOrReturn).toHaveBeenCalledWith('case-note-question')
    })

    it('redirect to check answers when reason for deallocation is ineligible', async () => {
      req.body = {
        deallocationReason: 'HEALTH',
      }
      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocationReason).toEqual('HEALTH')
      expect(req.session.allocateJourney.deallocationCaseNote).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })
  })

  describe('validation', () => {
    it('should fail validation if no deallocation reason is provided', async () => {
      const body = {}

      const requestObject = plainToInstance(DeallocationReason, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'deallocationReason', error: "Select why you're taking this person off the activity" },
      ])
    })

    it('should succeed validation if deallocation reason is provided', async () => {
      const body = {
        deallocationReason: 'HEALTH',
      }

      const requestObject = plainToInstance(DeallocationReason, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
