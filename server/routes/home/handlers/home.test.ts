import { Request, Response } from 'express'
import HomeRoutes from './home'

describe('Route Handlers - Home', () => {
  const handler = new HomeRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: { token: 'token', activeCaseLoad: { caseLoadId: 'EDI', isRolledOut: false } },
      },
      render: jest.fn(),
    } as unknown as Response
  })

  describe('GET', () => {
    it('returns the correct context', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/home/index', {
        shouldShowAlphaPrisonActivityListDps: true,
        shouldShowAlphaPrisonActivityListAm: false,
      })
    })
  })
})
