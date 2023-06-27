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
      redirect: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    it('renders the page', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/home/index')
    })

    it('redirects to DPS if neither service rolled out', async () => {
      res.locals.user.isAppointmentsRolledOut = false
      res.locals.user.isActivitiesRolledOut = false
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('https://digital-dev.prison.service.justice.gov.uk')
    })
  })
})
