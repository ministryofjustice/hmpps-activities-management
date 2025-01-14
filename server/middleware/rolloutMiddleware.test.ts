import { Request, Response } from 'express'
import { when } from 'jest-when'
import ActivitiesService from '../services/activitiesService'
import rolloutMiddleware from './rolloutMiddleware'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'
import ServiceName from '../enum/serviceName'

jest.mock('../services/activitiesService')

const res = { locals: { user: { activeCaseLoadId: 'MDI' } }, render: jest.fn() } as unknown as Response
const req = {} as Request
const next = jest.fn()

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

beforeEach(() => {
  jest.resetAllMocks()

  const rolloutPrisonPlan: RolloutPrisonPlan = {
    activitiesRolledOut: true,
    appointmentsRolledOut: true,
    maxDaysToExpiry: 0,
    prisonCode: 'MDI',
    prisonLive: true,
  }

  when(activitiesService.getPrisonRolloutPlan).calledWith('MDI').mockResolvedValue(rolloutPrisonPlan)
})

describe('rolloutMiddleware', () => {
  describe('activities', () => {
    const middleware = rolloutMiddleware(ServiceName.ACTIVITIES)

    it('should render the correct view if the activities service is not rolled out for the user', async () => {
      res.locals.user.isActivitiesRolledOut = false
      await middleware(req, res, next)
      expect(res.render).toHaveBeenCalledWith('pages/not-rolled-out', {
        serviceName: 'Activities',
      })
    })

    it('should call next when activities is rolled out to user', async () => {
      res.locals.user.isActivitiesRolledOut = true
      await middleware(req, res, next)
      expect(res.render).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('appointments', () => {
    const middleware = rolloutMiddleware(ServiceName.APPOINTMENTS)

    it('should render the correct view if the appointments service is not rolled out for the user', async () => {
      res.locals.user.isAppointmentsRolledOut = false
      await middleware(req, res, next)
      expect(res.render).toHaveBeenCalledWith('pages/not-rolled-out', {
        serviceName: 'Appointments',
      })
    })

    it('should call next when appointments is rolled out to user', async () => {
      res.locals.user.isAppointmentsRolledOut = true
      await middleware(req, res, next)
      expect(res.render).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })
})
