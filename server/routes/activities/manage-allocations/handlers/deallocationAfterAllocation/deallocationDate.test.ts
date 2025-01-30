import { Request, Response } from 'express'
import { addDays, subDays, addMinutes, subMinutes, startOfTomorrow, startOfToday } from 'date-fns'
import { formatDate } from 'date-fns/format'
import { when } from 'jest-when'
import DeallocationDateRoutes from './deallocationDate'
import { formatDatePickerDate, formatIsoDate, isoDateToDatePickerDate } from '../../../../../utils/datePickerUtils'
import ActivitiesService from '../../../../../services/activitiesService'
import atLeast from '../../../../../../jest.setup'
import { Allocation } from '../../../../../@types/activitiesAPI/types'
import { DeallocateAfterAllocationDateOption } from '../../journey'

jest.mock('../../../../../services/activitiesService')
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Edit allocation - End date', () => {
  const handler = new DeallocationDateRoutes(activitiesService)
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
      params: { mode: 'remove' },
      session: {
        allocateJourney: {
          startDate: formatIsoDate(subDays(new Date(), 1)),
          activity: {
            name: 'Maths Level 1',
            activityId: 1,
          },
          inmate: {
            prisonerName: 'John Smith',
          },
        },
      },
    } as unknown as Request

    when(activitiesService.getAllocations)
      .calledWith(atLeast('ABC123'))
      .defaultResolvedValue([
        {
          id: 6543,
          prisonerNumber: 'ABC1234',
          startDate: '',
          activityId: 1,
          isUnemployment: true,
        } as Allocation,
      ])
  })

  describe('GET', () => {
    const now = new Date()

    beforeEach(() => {
      const inmate = {
        prisonerNumber: 'ABC1234',
        prisonerName: '',
        prisonCode: '',
        status: '',
      }

      req.session.allocateJourney = {
        inmate,
        inmates: [inmate],
        activity: {
          activityId: 1,
          scheduleId: 0,
          name: '',
          startDate: '',
        },
        scheduledInstance: {
          attendances: [],
          cancelled: false,
          endTime: '',
          id: 0,
          timeSlot: undefined,
          date: formatIsoDate(now),
          startTime: formatDate(addMinutes(now, 2), 'HH:mm'),
        },
      }

      req.params.mode = 'remove'
    })

    it('when next session is later today', async () => {
      req.session.allocateJourney.scheduledInstance.date = formatIsoDate(addMinutes(now, 60))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-date',
        {
          showImmediateDeallocationOption: true,
        },
      )
    })
    it('when the next session is tomorrow', async () => {
      req.session.allocateJourney.scheduledInstance.date = formatIsoDate(addDays(now, 1))

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-date',
        {
          showImmediateDeallocationOption: false,
        },
      )
    })

    it('when there are no sessions later today', async () => {
      req.session.allocateJourney.scheduledInstance.startTime = formatDate(subMinutes(now, 1), 'HH:mm')

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-date',
        {
          showImmediateDeallocationOption: false,
        },
      )
    })
  })

  describe('POST', () => {
    it('should redirect to the deallocation-check-and-confirm if removing a "not in work" activity - user chooses end of today option', async () => {
      req.params.mode = 'remove'

      const deallocationAfterAllocationDate = DeallocateAfterAllocationDateOption.TODAY
      req.body = { deallocationAfterAllocationDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(startOfToday()))
      expect(req.session.allocateJourney.deallocateAfterAllocationDateOption).toEqual(
        DeallocateAfterAllocationDateOption.TODAY,
      )
      expect(res.redirect).toHaveBeenCalledWith('deallocation-check-and-confirm?notInWorkActivity=true')
    })
    it('should redirect to the deallocation-check-and-confirm if removing a "not in work" activity - user chooses now option', async () => {
      req.params.mode = 'remove'

      const deallocationAfterAllocationDate = DeallocateAfterAllocationDateOption.NOW
      req.body = { deallocationAfterAllocationDate }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(formatIsoDate(startOfToday()))
      expect(req.session.allocateJourney.deallocateAfterAllocationDateOption).toEqual(
        DeallocateAfterAllocationDateOption.NOW,
      )
      expect(res.redirect).toHaveBeenCalledWith('deallocation-check-and-confirm?notInWorkActivity=true')
    })
    it.skip('should redirect to the deallocation-check-and-confirm if removing a "not in work" activity - user chooses other date', async () => {
      req.params.mode = 'remove'

      const deallocationAfterAllocationDate = DeallocateAfterAllocationDateOption.FUTURE_DATE
      const date = formatDatePickerDate(addDays(new Date(), 3))
      req.body = { deallocationAfterAllocationDate, date }

      await handler.POST(req, res)

      expect(req.session.allocateJourney.endDate).toEqual(date)
      expect(req.session.allocateJourney.deallocateAfterAllocationDateOption).toEqual(
        DeallocateAfterAllocationDateOption.FUTURE_DATE,
      )
      expect(res.redirect).toHaveBeenCalledWith('deallocation-check-and-confirm?notInWorkActivity=true')
    })
  })
})
