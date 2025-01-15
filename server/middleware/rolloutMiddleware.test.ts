import { Request, Response } from 'express'
import rolloutMiddleware from './rolloutMiddleware'
import ServiceName from '../enum/serviceName'

jest.mock('../services/activitiesService')

const res = { locals: { user: { activeCaseLoadId: 'MDI' } }, render: jest.fn() } as unknown as Response
const req = {} as Request
const next = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()
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
