import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import DeallocationReasonRoutes, { DeallocationReason } from './deallocationReason'
import ActivitiesService from '../../../../services/activitiesService'
import { formatIsoDate } from '../../../../utils/datePickerUtils'
import { associateErrorsWithProperty } from '../../../../utils/utils'
import { DeallocateAfterAllocationDateOption } from '../journey'
import ReasonForDeallocation from '../../../../enum/reasonForDeallocation'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Deallocation reason', () => {
  const handler = new DeallocationReasonRoutes(activitiesService)

  let req: Request
  let res: Response

  const mockActivitiesData = () => {
    when(activitiesService.getDeallocationReasons).mockResolvedValue([{ code: 'OTHER', description: 'Other reason' }])
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
    it('should render the expected view - one activity to remove', async () => {
      req.session.allocateJourney.deallocateAfterAllocationDateOption = DeallocateAfterAllocationDateOption.TODAY
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/deallocation-reason', {
        deallocationReasons: [{ code: 'OTHER', description: 'Other reason' }],
        deallocateAfterAllocationPath: true,
        multipleActivitiesToRemove: false,
      })
    })
    it('should render the expected view - multiple activities to remove', async () => {
      req.session.allocateJourney.deallocationCaseNote = null
      req.session.allocateJourney.deallocateAfterAllocationDateOption = DeallocateAfterAllocationDateOption.TODAY
      req.session.allocateJourney.activity = null
      req.session.allocateJourney.activitiesToDeallocate = [
        {
          scheduleId: 1,
          name: 'activity 1',
          startDate: '2025-02-01',
        },
        {
          scheduleId: 2,
          name: 'activity 2',
          startDate: '2025-02-01',
        },
      ]
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-allocations/deallocation-reason', {
        deallocationReasons: [{ code: 'OTHER', description: 'Other reason' }],
        deallocateAfterAllocationPath: true,
        multipleActivitiesToRemove: true,
      })
    })
  })

  describe('POST', () => {
    it('redirect to case note when reason for deallocation is eligible', async () => {
      req.body = {
        deallocationReason: ReasonForDeallocation.OTHER,
      }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocationReason).toEqual(ReasonForDeallocation.OTHER)
      expect(res.redirectOrReturn).toHaveBeenCalledWith('case-note-question')
    })

    it('redirect to check answers when reason for deallocation is ineligible for collecting a case note and the user is not on the deallocate-after-allocation flow', async () => {
      req.body = {
        deallocationReason: ReasonForDeallocation.HEALTH,
      }
      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocationReason).toEqual(ReasonForDeallocation.HEALTH)
      expect(req.session.allocateJourney.deallocationCaseNote).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith('check-answers')
    })

    it('redirects to deallocate-check-and-confirm page when the user is on the deallocate-after-allocation flow', async () => {
      req.session.allocateJourney.deallocateAfterAllocationDateOption = DeallocateAfterAllocationDateOption.TODAY
      req.body = {
        deallocationReason: ReasonForDeallocation.OTHER,
      }
      await handler.POST(req, res)

      expect(req.session.allocateJourney.deallocationReason).toEqual(ReasonForDeallocation.OTHER)
      expect(req.session.allocateJourney.deallocationCaseNote).toBeNull()
      expect(res.redirect).toHaveBeenCalledWith('deallocation-check-and-confirm')
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
