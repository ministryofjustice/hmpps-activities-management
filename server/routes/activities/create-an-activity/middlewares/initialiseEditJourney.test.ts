import { Request, Response } from 'express'
import { when } from 'jest-when'
import initialiseEditJourney from './initialiseEditJourney'
import ActivitiesService from '../../../../services/activitiesService'
import { ServiceUser } from '../../../../@types/express'
import { Activity } from '../../../../@types/activitiesAPI/types'
import atLeast from '../../../../../jest.setup'
import { mapActivityModelSlotsToJourney } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const middleware = initialiseEditJourney(activitiesService)

describe('initialiseEditJourney', () => {
  const user = {
    username: 'joebloggs',
  } as ServiceUser

  const req = {
    session: {
      createJourney: {},
    },
    params: {
      mode: 'edit',
      activityId: '1',
    },
  } as unknown as Request

  const res = {
    locals: {
      user,
    },
  } as unknown as Response

  const next = jest.fn()

  const allocation1 = {
    id: 1,
    startDate: '2022-02-01',
  }

  const allocation2 = {
    id: 2,
    startDate: '2022-02-02',
  }

  const schedule = {
    id: 1,
    scheduleWeeks: 1,
    slots: [
      {
        id: 1,
        weekNumber: 1,
        startTime: '9:00',
        endTime: '11:30',
        daysOfWeek: ['Mon', 'Tue'],
        mondayFlag: true,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ],
    runsOnBankHoliday: false,
    capacity: 10,
    internalLocation: {
      id: 14438,
      code: 'AWING',
      description: 'A-Wing',
    },
    allocations: [allocation1, allocation2],
  }

  const activity = {
    id: 1,
    category: {
      id: 1,
      code: 'LEISURE_SOCIAL',
    },
    tier: {
      id: 1,
    },
    organiser: {
      id: 1,
    },
    inCell: false,
    onWing: false,
    offWing: false,
    riskLevel: 'high',
    summary: 'activity summary',
    startDate: '2022-01-01',
    endDate: '2023-12-01',
    minimumIncentiveLevel: 'Basic',
    pay: [
      {
        id: 123456,
        incentiveNomisCode: 'BAS',
        incentiveLevel: 'Basic',
        rate: 150,
      },
    ],
    minimumEducationLevel: [
      {
        id: 123456,
        educationLevelCode: 'Basic',
        studyAreaCode: 'ENGLA',
      },
    ],
    schedules: [schedule],
  } as unknown as Activity

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should set up session object', async () => {
    when(activitiesService.getActivity).calledWith(atLeast(1, user)).defaultResolvedValue(activity)

    await middleware(req, res, next)

    expect(req.session.createJourney).toEqual({
      activityId: activity.id,
      scheduleId: schedule.id,
      category: activity.category,
      tierCode: activity.tier.code,
      organiserCode: activity.organiser.code,
      name: activity.summary,
      inCell: activity.inCell,
      onWing: activity.onWing,
      offWing: activity.offWing,
      riskLevel: activity.riskLevel,
      startDate: activity.startDate,
      endDate: activity.endDate,
      minimumIncentiveLevel: activity.minimumIncentiveLevel,
      scheduleWeeks: schedule.scheduleWeeks,
      slots: mapActivityModelSlotsToJourney(schedule.slots),
      runsOnBankHoliday: schedule.runsOnBankHoliday,
      currentCapacity: schedule.capacity,
      capacity: schedule.capacity,
      allocations: [allocation1, allocation2],
      pay: activity.pay,
      educationLevels: activity.minimumEducationLevel,
      location: {
        id: schedule.internalLocation.id,
        name: schedule.internalLocation.description,
      },
      latestAllocationStartDate: allocation2.startDate,
      earliestAllocationStartDate: allocation1.startDate,
    })

    expect(next).toBeCalledTimes(1)
  })

  it('it should skip initalisation if session object already set', async () => {
    req.session.createJourney = { activityId: 1 }

    await middleware(req, res, next)

    expect(activitiesService.getActivity).toBeCalledTimes(0)

    expect(req.session.createJourney).toEqual({
      activityId: 1,
    })

    expect(next).toBeCalledTimes(1)
  })
})
