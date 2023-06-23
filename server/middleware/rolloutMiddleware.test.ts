import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../services/activitiesService'
import rolloutMiddleware from './rolloutMiddleware'
import { Services } from '../services'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'

jest.mock('../services/activitiesService')

const res = { locals: { user: { activeCaseLoadId: 'MDI' } }, render: jest.fn() } as unknown as Response
const req = {} as Request
const next = jest.fn()

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

const middleware = rolloutMiddleware({
  activitiesService,
} as unknown as Services)

beforeEach(() => {
  jest.resetAllMocks()

  when(activitiesService.getPrisonRolloutPlan)
    .calledWith('MDI')
    .mockResolvedValue({ prisonCode: 'MDI' } as RolloutPrisonPlan)
})

describe('rolloutMiddleware', () => {
  it('should render the correct view if the service is not rolled out for the user', async () => {
    res.locals.user.isActivitiesRolledOut = false
    res.locals.user.isAppointmentsRolledOut = false
    await middleware(req, res, next)
    expect(res.render).toHaveBeenCalledWith('pages/not-rolled-out', { rolloutPlan: { prisonCode: 'MDI' } })
  })

  it('should call next when activities is rolled out to user', async () => {
    res.locals.user.isActivitiesRolledOut = true
    res.locals.user.isAppointmentsRolledOut = false
    await middleware(req, res, next)
    expect(res.render).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })

  it('should call next when appointments is rolled out to user', async () => {
    res.locals.user.isActivitiesRolledOut = false
    res.locals.user.isAppointmentsRolledOut = true
    await middleware(req, res, next)
    expect(res.render).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalled()
  })
})
