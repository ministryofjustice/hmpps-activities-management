import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import DeallocationSelectActivities, { DeallocationSelect } from './deallocationSelectActivities'
import atLeast from '../../../../../../jest.setup'
import { Activity } from '../../../../../@types/activitiesAPI/types'
import { associateErrorsWithProperty } from '../../../../../utils/utils'

jest.mock('../../../../../services/activitiesService')
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Select activities page - deallocation after allocation', () => {
  const handler = new DeallocationSelectActivities(activitiesService)
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
      journeyData: {
        allocateJourney: {
          inmate: {
            prisonerName: 'Rebecca Miller',
          },
          otherAllocations: [
            {
              id: 6543,
              prisonerNumber: 'ABC1234',
              startDate: '2025-02-05',
              activityId: 1,
              isUnemployment: false,
            },
            {
              id: 1233,
              prisonerNumber: 'ABC1234',
              startDate: '2025-02-05',
              activityId: 2,
              isUnemployment: true,
            },
          ],
        },
      },
    } as Request

    const activity1 = {
      id: 1,
      summary: 'Maths',
      startDate: '2025-02-05',
      endDate: '2025-05-17',
      schedules: [
        {
          id: 456,
          scheduleWeeks: 1,
          internalLocation: { description: 'Maths room' },
          instances: [
            {
              id: 1,
              date: '2025-02-06',
              startTime: '17:00',
              endTime: '18:00',
              cancelled: false,
              cancelledTime: null,
              cancelledBy: null,
              attendances: [],
              timeSlot: 'ED',
            },
            {
              id: 2,
              date: '2025-02-07',
              startTime: '10:00',
              endTime: '11:00',
              cancelled: false,
              cancelledTime: null,
              cancelledBy: null,
              attendances: [],
              timeSlot: 'AM',
            },
          ],
        },
      ],
      inCell: false,
      onWing: true,
      offWing: false,
    }
    const activity2 = {
      id: 2,
      summary: 'English',
      startDate: '2025-02-05',
      endDate: '2025-05-17',
      schedules: [
        {
          id: 123,
          scheduleWeeks: 1,
          internalLocation: { description: 'English room' },
          instances: [
            {
              id: 1,
              date: '2025-02-07',
              startTime: '14:00',
              endTime: '16:00',
              cancelled: false,
              cancelledTime: null,
              cancelledBy: null,
              attendances: [],
              timeSlot: 'PM',
            },
            {
              id: 2,
              date: '2025-02-08',
              startTime: '10:00',
              endTime: '11:00',
              cancelled: false,
              cancelledTime: null,
              cancelledBy: null,
              attendances: [],
              timeSlot: 'AM',
            },
          ],
        },
      ],
      inCell: false,
      onWing: true,
      offWing: false,
    }

    when(activitiesService.getActivity)
      .calledWith(atLeast(1))
      .mockResolvedValue(activity1 as Activity)
    when(activitiesService.getActivity)
      .calledWith(atLeast(2))
      .mockResolvedValue(activity2 as Activity)

    jest.useFakeTimers().setSystemTime(new Date('2025-02-06T01:10:00Z').getTime())
  })

  describe('GET', () => {
    it('renders the correct template with the data', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/deallocationAfterAllocation/deallocation-select-activities',
        {
          otherAllocations: [
            {
              id: 6543,
              prisonerNumber: 'ABC1234',
              startDate: '2025-02-05',
              activityId: 1,
              isUnemployment: false,
            },
            {
              id: 1233,
              prisonerNumber: 'ABC1234',
              startDate: '2025-02-05',
              activityId: 2,
              isUnemployment: true,
            },
          ],
        },
      )
    })
  })
  describe('POST', () => {
    it('adds the activity details to the session if only one is chosen', async () => {
      const selectedAllocations = '6543'
      req.body = { selectedAllocations }

      await handler.POST(req, res)

      expect(activitiesService.getActivity).toHaveBeenCalledWith(1, {
        username: 'joebloggs',
      })
      expect(req.journeyData.allocateJourney).toEqual({
        inmate: {
          prisonerName: 'Rebecca Miller',
        },
        activity: {
          activityId: 1,
          scheduleId: 456,
          name: 'Maths',
          scheduleWeeks: 1,
          startDate: '2025-02-05',
          endDate: '2025-05-17',
          location: 'Maths room',
          inCell: false,
          offWing: false,
          onWing: true,
        },
        otherAllocations: [
          {
            activityId: 1,
            id: 6543,
            isUnemployment: false,
            prisonerNumber: 'ABC1234',
            startDate: '2025-02-05',
          },
          {
            activityId: 2,
            id: 1233,
            isUnemployment: true,
            prisonerNumber: 'ABC1234',
            startDate: '2025-02-05',
          },
        ],
        activitiesToDeallocate: null,
        scheduledInstance: {
          attendances: [],
          cancelled: false,
          cancelledBy: null,
          cancelledTime: null,
          date: '2025-02-06',
          endTime: '18:00',
          id: 1,
          startDateTime: '2025-02-06 17:00',
          startTime: '17:00',
          timeSlot: 'ED',
        },
      })
    })
    it('adds the activity details to the session if more than one is chosen', async () => {
      const selectedAllocations = '1233,6543'
      req.body = { selectedAllocations }

      await handler.POST(req, res)

      expect(activitiesService.getActivity).toHaveBeenCalledWith(2, {
        username: 'joebloggs',
      })
      expect(req.journeyData.allocateJourney).toEqual({
        inmate: {
          prisonerName: 'Rebecca Miller',
        },
        activitiesToDeallocate: [
          {
            activityId: 1,
            endDate: '2025-05-17',
            inCell: false,
            location: 'Maths room',
            name: 'Maths',
            offWing: false,
            onWing: true,
            schedule: {
              id: 456,
              instances: [
                {
                  attendances: [],
                  cancelled: false,
                  cancelledBy: null,
                  cancelledTime: null,
                  date: '2025-02-06',
                  endTime: '18:00',
                  id: 1,
                  startTime: '17:00',
                  timeSlot: 'ED',
                },
                {
                  attendances: [],
                  cancelled: false,
                  cancelledBy: null,
                  cancelledTime: null,
                  date: '2025-02-07',
                  endTime: '11:00',
                  id: 2,
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
              internalLocation: {
                description: 'Maths room',
              },
              scheduleWeeks: 1,
            },
            scheduleId: 456,
            scheduleWeeks: 1,
            startDate: '2025-02-05',
          },
          {
            activityId: 2,
            endDate: '2025-05-17',
            inCell: false,
            location: 'English room',
            name: 'English',
            offWing: false,
            onWing: true,
            schedule: {
              id: 123,
              instances: [
                {
                  attendances: [],
                  cancelled: false,
                  cancelledBy: null,
                  cancelledTime: null,
                  date: '2025-02-07',
                  endTime: '16:00',
                  id: 1,
                  startTime: '14:00',
                  timeSlot: 'PM',
                },
                {
                  attendances: [],
                  cancelled: false,
                  cancelledBy: null,
                  cancelledTime: null,
                  date: '2025-02-08',
                  endTime: '11:00',
                  id: 2,
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
              internalLocation: {
                description: 'English room',
              },
              scheduleWeeks: 1,
            },
            scheduleId: 123,
            scheduleWeeks: 1,
            startDate: '2025-02-05',
          },
        ],
        otherAllocations: [
          {
            activityId: 1,
            id: 6543,
            isUnemployment: false,
            prisonerNumber: 'ABC1234',
            startDate: '2025-02-05',
          },
          {
            activityId: 2,
            id: 1233,
            isUnemployment: true,
            prisonerNumber: 'ABC1234',
            startDate: '2025-02-05',
          },
        ],
        scheduledInstance: {
          attendances: [],
          cancelled: false,
          cancelledBy: null,
          cancelledTime: null,
          date: '2025-02-06',
          endTime: '18:00',
          id: 1,
          startDateTime: '2025-02-06 17:00',
          startTime: '17:00',
          timeSlot: 'ED',
        },
        activity: null,
      })
    })
  })
  describe('Validation', () => {
    it('validation fails if a value is not entered', async () => {
      const body = {
        selectedAllocations: '',
      }

      const requestObject = plainToInstance(DeallocationSelect, {
        allocateJourney: req.journeyData.allocateJourney,
        ...body,
      })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        {
          property: 'selectedAllocations',
          error: 'Select the activities you want to take Rebecca Miller off',
        },
      ])
    })
  })
})
