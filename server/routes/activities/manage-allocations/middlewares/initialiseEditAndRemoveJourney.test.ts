import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import { ServiceUser } from '../../../../@types/express'
import initialiseEditAndRemoveJourney from './initialiseEditAndRemoveJourney'
import PrisonService from '../../../../services/prisonService'
import { AllocateToActivityJourney } from '../journey'
import atLeast from '../../../../../jest.setup'
import { Activity, Allocation } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { getScheduleIdFromActivity } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

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

  const schedule = {
    id: 1,
    internalLocation: {
      id: 14438,
      code: 'AWING',
      description: 'A-Wing',
    },
    allocations: [allocation],
  }

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
    cellLocation: 'MDI-1-1-001',
    currentIncentive: { level: { description: 'Basic' } },
  } as Prisoner

  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    req = {
      session: {},
      params: {
        mode: 'remove',
        allocationId: '6543',
      },
      query: {},
    } as unknown as Request

    res = {
      locals: {
        user,
      },
    } as unknown as Response
  })

  it('it should skip initialisation if not edit or remove mode', async () => {
    req.params.mode = 'create'

    await middleware(req, res, next)

    expect(activitiesService.getAllocation).not.toHaveBeenCalled()
    expect(activitiesService.getAllocations).not.toHaveBeenCalled()

    expect(next).toBeCalledTimes(1)
  })

  it('it should skip initialisation if session object already set', async () => {
    req.session.allocateJourney = { inmate: { prisonerNumber: 'ABC1234' } } as AllocateToActivityJourney

    await middleware(req, res, next)

    expect(activitiesService.getAllocation).not.toHaveBeenCalled()
    expect(activitiesService.getAllocations).not.toHaveBeenCalled()

    expect(next).toBeCalledTimes(1)
  })

  it.each(['route param', 'query param'])('should populate session using allocation ID from %s', async routeOrQuery => {
    if (routeOrQuery === 'route param') {
      req.query = {}
    } else {
      req.params = { mode: 'remove' }
      req.query = { scheduleId: '1', allocationIds: ['6543'] }
    }

    when(activitiesService.getAllocation).calledWith(atLeast(6543, user)).defaultResolvedValue(allocation)
    when(activitiesService.getAllocations).calledWith(atLeast(6543, user)).defaultResolvedValue([allocation])
    when(activitiesService.getActivity).calledWith(atLeast(2, user)).defaultResolvedValue(activity)
    when(prisonService.searchInmatesByPrisonerNumbers)
      .calledWith(atLeast(['ABC1234'], user))
      .defaultResolvedValue([prisoner])

    await middleware(req, res, next)

    expect(req.session.allocateJourney).toEqual({
      inmate: {
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC1234',
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
      },
      latestAllocationStartDate: allocation.startDate,
    })

    expect(next).toBeCalledTimes(1)
  })
})
