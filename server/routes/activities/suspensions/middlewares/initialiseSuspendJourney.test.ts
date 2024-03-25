import { Request, Response } from 'express'
import { when } from 'jest-when'
import createHttpError from 'http-errors'
import { SuspendJourney } from '../journey'
import initialiseSuspendJourney from './initialiseSuspendJourney'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import { ServiceUser } from '../../../../@types/express'
import atLeast from '../../../../../jest.setup'
import { PrisonerAllocations } from '../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const middleware = initialiseSuspendJourney(prisonService, activitiesService)

describe('initialiseSuspendJourney', () => {
  let req: Request
  let res: Response

  const user = {
    username: 'joebloggs',
  } as ServiceUser

  const next = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    req = {
      session: {},
      params: {},
      query: {},
    } as unknown as Request

    res = {
      locals: {
        user,
      },
      redirect: jest.fn(),
    } as unknown as Response

    when(activitiesService.getActivePrisonPrisonerAllocations)
      .calledWith(atLeast(['ABC123']))
      .mockResolvedValue([
        {
          prisonerNumber: 'ABC123',
          allocations: [
            {
              id: 1,
              activityId: 10,
              activitySummary: 'Activity 1',
              endDate: '2024-06-02',
            },
            {
              id: 2,
              activityId: 20,
              activitySummary: 'Activity 2',
              endDate: '2024-07-02',
            },
          ],
        },
      ] as PrisonerAllocations[])

    when(prisonService.getInmateByPrisonerNumber)
      .calledWith(atLeast('ABC123'))
      .mockResolvedValue({
        firstName: 'John',
        lastName: 'Smith',
      } as Prisoner)
  })

  it('should call next if suspend journey is already populated', async () => {
    req.session.suspendJourney = {} as SuspendJourney

    await middleware(req, res, next)

    expect(activitiesService.getAllocation).not.toHaveBeenCalled()
    expect(activitiesService.getAllocations).not.toHaveBeenCalled()

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('should redirect back if no allocation ids are null', async () => {
    await middleware(req, res, next)

    expect(activitiesService.getAllocation).not.toHaveBeenCalled()
    expect(activitiesService.getAllocations).not.toHaveBeenCalled()

    expect(res.redirect).toHaveBeenCalledTimes(1)
    expect(res.redirect).toHaveBeenCalledWith('back')
  })

  it('should throw 404 when allocation not found', async () => {
    req.params = { prisonerNumber: 'ABC123' }
    req.query.allocationIds = '1,2,3'

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(createHttpError.NotFound())
  })

  it('should populate the session', async () => {
    req.params = { prisonerNumber: 'ABC123' }
    req.query.allocationIds = '1,2'

    await middleware(req, res, next)

    expect(req.session.suspendJourney).toEqual({
      allocations: [
        {
          activityId: 10,
          activityName: 'Activity 1',
          allocationId: 1,
        },
        {
          activityId: 20,
          activityName: 'Activity 2',
          allocationId: 2,
        },
      ],
      earliestAllocationEndDate: '2024-06-02',
      inmate: {
        prisonerName: 'John Smith',
        prisonerNumber: 'ABC123',
      },
    })
    expect(next).toHaveBeenCalled()
  })
})
