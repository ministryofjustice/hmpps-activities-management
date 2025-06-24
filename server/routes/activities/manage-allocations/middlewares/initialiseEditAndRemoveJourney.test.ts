import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import { ServiceUser } from '../../../../@types/express'
import initialiseEditAndRemoveJourney from './initialiseEditAndRemoveJourney'
import PrisonService from '../../../../services/prisonService'
import { AllocateToActivityJourney } from '../journey'
import atLeast from '../../../../../jest.setup'
import { Activity, ActivitySchedule, Allocation, ScheduledInstance } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { getScheduleIdFromActivity } from '../../../../utils/utils'
import findNextSchedulesInstance from '../../../../utils/helpers/nextScheduledInstanceCalculator'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../utils/helpers/nextScheduledInstanceCalculator')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const middleware = initialiseEditAndRemoveJourney(prisonService, activitiesService)

describe('initialiseEditAndRemoveJourney', () => {
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
  } as ServiceUser

  const allocation = {
    id: 6543,
    prisonerNumber: 'ABC1234',
    startDate: '2023-06-13',
    activityId: 2,
    prisonPayBand: { id: 1, alias: 'Low' },
  } as Allocation

  const instance: ScheduledInstance = {
    id: 123,
    cancelled: false,
    date: '2024-08-23',
    endTime: '14:00',
    startTime: '13:00',
    timeSlot: 'AM',
    attendances: [],
  }

  const schedule: ActivitySchedule = {
    id: 1,
    internalLocation: {
      id: 14438,
      code: 'AWING',
      description: 'A-Wing',
    },
    allocations: [allocation],
    instances: [instance],
    scheduleWeeks: 2,
  } as ActivitySchedule

  const activity = {
    id: 2,
    summary: 'Maths 2',
    inCell: false,
    onWing: false,
    offWing: false,
    startDate: '2022-01-01',
    endDate: '2023-12-01',
    pay: [
      {
        id: 123456,
        incentiveNomisCode: 'BAS',
        incentiveLevel: 'Basic',
        rate: 150,
        prisonPayBand: { id: 1, alias: 'Low' },
      },
    ],
    schedules: [schedule],
  } as unknown as Activity

  const prisoner = {
    firstName: 'John',
    lastName: 'Smith',
    prisonerNumber: 'ABC1234',
    prisonId: 'RSI',
    status: 'ACTIVE IN',
    cellLocation: 'MDI-1-1-001',
    currentIncentive: { level: { description: 'Basic' } },
  } as Prisoner

  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    req = {
      get: jest.fn(),
      session: {},
      params: {
        allocationId: '6543',
      },
      routeContext: { mode: 'remove' },
      query: {},
    } as unknown as Request

    res = {
      redirect: jest.fn(),
      locals: {
        user,
      },
    } as unknown as Response

    when(findNextSchedulesInstance).calledWith(schedule).mockReturnValue(instance)
  })

  it('it should skip initialisation if not edit or remove mode', async () => {
    req.routeContext = { mode: 'create' }

    await middleware(req, res, next)

    expect(activitiesService.getAllocation).not.toHaveBeenCalled()
    expect(activitiesService.getAllocations).not.toHaveBeenCalled()

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('it should skip initialisation if session object already set', async () => {
    req.session.allocateJourney = { inmate: { prisonerNumber: 'ABC1234' } } as AllocateToActivityJourney

    await middleware(req, res, next)

    expect(activitiesService.getAllocation).not.toHaveBeenCalled()
    expect(activitiesService.getAllocations).not.toHaveBeenCalled()

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should redirect back if there is no scheduleId, allocationId or selectActivity on the query/params', async () => {
    req.query = {}
    req.params = {}
    req.routeContext = { mode: 'remove' }

    await middleware(req, res, next)

    expect(activitiesService.getAllocation).not.toHaveBeenCalled()
    expect(activitiesService.getAllocations).not.toHaveBeenCalled()

    expect(res.redirect).toHaveBeenCalled()
  })

  it('should redirect back if there are no allocations available - allocationId used', async () => {
    req.query = {
      allocationId: '2',
    }
    req.routeContext = { mode: 'remove' }

    when(activitiesService.getAllocation)
      .calledWith(atLeast(2, user))
      .mockResolvedValueOnce({} as Allocation)

    await middleware(req, res, next)

    expect(res.redirect).toHaveBeenCalled()
  })
  it('should redirect back if there are no allocations available - scheduleId used', async () => {
    req.query = { scheduleId: '1', allocationIds: ['6543'] }
    req.params = {
      allocationId: null,
    }
    req.routeContext = { mode: 'remove' }
    when(activitiesService.getAllocations).calledWith(atLeast(1, user)).mockResolvedValueOnce([])

    await middleware(req, res, next)

    expect(res.redirect).toHaveBeenCalled()
  })

  it('should redirect back if allocations return value is null - allocationId used', async () => {
    req.query = {
      allocationId: '2',
    }
    req.routeContext = { mode: 'remove' }

    when(activitiesService.getAllocation)
      .calledWith(atLeast(2, user))
      .mockResolvedValueOnce({} as never)

    await middleware(req, res, next)

    expect(res.redirect).toHaveBeenCalled()
  })

  it('should redirect back if allocations return value is null - scheduleId used', async () => {
    req.query = { scheduleId: '1', allocationIds: ['6543'] }
    req.params = {
      allocationId: null,
    }
    req.routeContext = { mode: 'remove' }
    when(activitiesService.getAllocations)
      .calledWith(atLeast(1, user))
      .mockResolvedValueOnce({} as never)

    await middleware(req, res, next)

    expect(res.redirect).toHaveBeenCalled()
  })

  it('should populate session using allocation ID from route param', async () => {
    req.params = { allocationId: '6543' }
    req.routeContext = { mode: 'remove' }
    req.query = { allocationIds: ['6543'] }

    when(activitiesService.getAllocation).calledWith(atLeast(6543, user)).mockResolvedValueOnce(allocation)
    when(activitiesService.getActivity).calledWith(atLeast(2, user)).mockResolvedValueOnce(activity)
    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith(atLeast(['ABC1234'], user))
      .mockResolvedValueOnce([prisoner])

    await middleware(req, res, next)

    expect(req.session.allocateJourney).toEqual({
      inmate: {
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC1234',
        prisonCode: 'RSI',
        status: 'ACTIVE IN',
        cellLocation: 'MDI-1-1-001',
        incentiveLevel: 'Basic',
        payBand: {
          id: 1,
          alias: 'Low',
          rate: 150,
        },
      },
      inmates: [
        {
          prisonerName: 'John Smith',
          prisonerNumber: 'ABC1234',
          prisonCode: 'RSI',
          status: 'ACTIVE IN',
          cellLocation: 'MDI-1-1-001',
          incentiveLevel: 'Basic',
          payBand: {
            id: 1,
            alias: 'Low',
            rate: 150,
          },
        },
      ],
      activity: {
        activityId: activity.id,
        scheduleId: getScheduleIdFromActivity(activity),
        name: activity.summary,
        startDate: activity.startDate,
        endDate: activity.endDate,
        location: activity.schedules[0].internalLocation?.description,
        inCell: activity.inCell,
        onWing: activity.onWing,
        offWing: activity.offWing,
        scheduleWeeks: 2,
      },
      latestAllocationStartDate: allocation.startDate,
      exclusions: [],
      updatedExclusions: [],
      scheduledInstance: {
        id: 123,
        cancelled: false,
        date: '2024-08-23',
        endTime: '14:00',
        startTime: '13:00',
        timeSlot: 'AM',
        attendances: [],
      },
    })

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should populate session using allocation ID from query', async () => {
    req.routeContext = { mode: 'remove' }
    req.params = {}
    req.query = { scheduleId: '1', allocationIds: ['6543'] }

    when(activitiesService.getAllocations).calledWith(atLeast(1, user)).mockResolvedValueOnce([allocation])
    when(activitiesService.getActivity).calledWith(atLeast(2, user)).mockResolvedValueOnce(activity)
    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith(atLeast(['ABC1234'], user))
      .mockResolvedValueOnce([prisoner])

    await middleware(req, res, next)

    expect(req.session.allocateJourney).toEqual({
      inmate: {
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC1234',
        prisonCode: 'RSI',
        status: 'ACTIVE IN',
        cellLocation: 'MDI-1-1-001',
        incentiveLevel: 'Basic',
        payBand: {
          id: 1,
          alias: 'Low',
          rate: 150,
        },
      },
      inmates: [
        {
          prisonerName: 'John Smith',
          prisonerNumber: 'ABC1234',
          prisonCode: 'RSI',
          status: 'ACTIVE IN',
          cellLocation: 'MDI-1-1-001',
          incentiveLevel: 'Basic',
          payBand: {
            id: 1,
            alias: 'Low',
            rate: 150,
          },
        },
      ],
      activity: {
        activityId: activity.id,
        scheduleId: getScheduleIdFromActivity(activity),
        name: activity.summary,
        startDate: activity.startDate,
        endDate: activity.endDate,
        location: activity.schedules[0].internalLocation?.description,
        inCell: activity.inCell,
        onWing: activity.onWing,
        offWing: activity.offWing,
        scheduleWeeks: 2,
      },
      latestAllocationStartDate: allocation.startDate,
      exclusions: [],
      updatedExclusions: [],
      scheduledInstance: {
        id: 123,
        cancelled: false,
        date: '2024-08-23',
        endTime: '14:00',
        startTime: '13:00',
        timeSlot: 'AM',
        attendances: [],
      },
    })

    expect(next).toHaveBeenCalledTimes(1)
  })
})
