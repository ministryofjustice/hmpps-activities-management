import { Request, Response } from 'express'
import HomeRoutes from './home'

describe('Route Handlers - Home', () => {
  const handler = new HomeRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          token: 'token',
          activeCaseLoad: { caseLoadId: 'EDI', isRolledOut: false },
          isActivitiesRolledOut: true,
          isAppointmentsRolledOut: true,
        },
      },
      render: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    it('renders the page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/home/index')
    })

    it('renders not-rolled-out template if neither service rolled out', async () => {
      res.locals.user.isAppointmentsRolledOut = false
      res.locals.user.isActivitiesRolledOut = false
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/not-rolled-out', {
        serviceName: 'Activities and Appointments',
      })
    })
  })

  describe('ACTIVITIES_ACCESSIBILITY_STATEMENT', () => {
    it('should render the activities accessibility statement', async () => {
      await handler.ACTIVITIES_ACCESSIBILITY_STATEMENT(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/home/activities-accessibility-statement')
    })
  })

  describe('APPOINTMENTS_ACCESSIBILITY_STATEMENT', () => {
    it('should render the appointments accessibility statement', async () => {
      await handler.APPOINTMENTS_ACCESSIBILITY_STATEMENT(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/home/appointments-accessibility-statement')
    })
  })
})
