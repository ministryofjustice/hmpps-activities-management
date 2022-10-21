import { Request, Response } from 'express'
import HomeRoutes from './home'

describe('Route Handlers - Home', () => {
  const handler = new HomeRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI' } },
      },
      render: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    describe('For any random role', () => {
      it('With correct auth source', async () => {
        req = getReqWithRoles(['ROLE_RANDOM_1'])
        await handler.GET(req, res)
        expect(res.render).toHaveBeenCalledWith('pages/index', {
          shouldShowCreateActivityCard: true,
          shouldShowPrisonCalendarCard: true,
          shouldShowAlphaPrisonActivityListDps: true,
        })
      })
    })
  })
})

const getReqWithRoles = (roles: string[]): Request => {
  return {
    user: { userRoles: roles },
  } as unknown as Request
}
