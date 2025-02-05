import { Request, Response } from 'express'

import { when } from 'jest-when'
import { addDays, subDays } from 'date-fns'
import ActivitiesService from '../../../../../services/activitiesService'
import DeallocationCheckAndConfirmRoutes from './deallocationCheckAndConfirm'
import { formatIsoDate } from '../../../../../utils/datePickerUtils'
import ReasonForDeallocation from '../../../../../enum/reasonForDeallocation'
import { DeallocateAfterAllocationDateOption } from '../../journey'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocate - Check answers', () => {
  const handler = new DeallocationCheckAndConfirmRoutes(activitiesService)
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
    } as unknown as Response

    const inmate = {
      prisonerName: 'Joe Bloggs',
      prisonerNumber: 'ABC123',
      cellLocation: '1-2-001',
      incentiveLevel: 'standard',
      payBand: { id: 1, alias: 'A', rate: 150 },
    }

    req = {
      params: { mode: 'remove' },
      session: {
        allocateJourney: {
          inmate,
          inmates: [inmate],
          activity: {
            activityId: 1,
            scheduleId: 1,
            name: 'Maths',
            location: 'Education room 1',
            startDate: '2022-01-01',
            notInWork: true,
          },
          deallocateAfterAllocationDateOption: DeallocateAfterAllocationDateOption.FUTURE_DATE,
          startDate: formatIsoDate(subDays(new Date(), 10)),
          endDate: formatIsoDate(addDays(new Date(), 1)),
          updatedExclusions: [],
          scheduledInstance: { id: 123 },
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page - "not in work activity"', async () => {
      when(activitiesService.getDeallocationReasons).mockResolvedValue([
        { code: 'TRANSFERRED', description: 'Transferred to another activity' },
      ])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-check-and-confirm',
        {
          activityIsUnemployment: true,
          deallocationReason: null,
        },
      )
    })
    it('should render page - "in work" activity', async () => {
      req.session.allocateJourney.activity.notInWork = false
      req.session.allocateJourney.deallocationReason = ReasonForDeallocation.HEALTH

      when(activitiesService.getDeallocationReasons).mockResolvedValue([
        { code: 'HEALTH', description: 'Health reasons' },
      ])

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-check-and-confirm',
        {
          activityIsUnemployment: false,
          deallocationReason: { code: 'HEALTH', description: 'Health reasons' },
        },
      )
    })
  })
  describe('POST', () => {
    describe('Should call the remove allocation endpoint with the correct params and redirect', () => {
      it('should include instanceId and provided reason', async () => {
        req.session.allocateJourney.deallocateAfterAllocationDateOption = DeallocateAfterAllocationDateOption.NOW
        req.session.allocateJourney.deallocationReason = ReasonForDeallocation.SECURITY
        await handler.POST(req, res)

        expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(
          1,
          ['ABC123'],
          ReasonForDeallocation.SECURITY,
          null,
          formatIsoDate(addDays(new Date(), 1)),
          { username: 'joebloggs' },
          123,
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })
    })
    describe('reason should be TRANSFERRED as none is supplied', () => {
      it('should not include instanceId', async () => {
        await handler.POST(req, res)

        expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(
          1,
          ['ABC123'],
          ReasonForDeallocation.TRANSFERRED,
          null,
          formatIsoDate(addDays(new Date(), 1)),
          { username: 'joebloggs' },
          null,
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })
      it('should include instanceId', async () => {
        req.session.allocateJourney.deallocateAfterAllocationDateOption = DeallocateAfterAllocationDateOption.NOW
        await handler.POST(req, res)

        expect(activitiesService.deallocateFromActivity).toHaveBeenCalledWith(
          1,
          ['ABC123'],
          ReasonForDeallocation.TRANSFERRED,
          null,
          formatIsoDate(addDays(new Date(), 1)),
          { username: 'joebloggs' },
          123,
        )
        expect(res.redirect).toHaveBeenCalledWith('confirmation')
      })
    })
  })
})
