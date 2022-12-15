import { Request, Response } from 'express'
import emptyJourneyHandler from './emptyJourneyHandler'

const res = {
  locals: {},
  redirect: jest.fn(),
} as unknown as Response
const req = {
  session: {},
} as Request
const next = jest.fn()

describe('emptyJourneyHandler', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('step requires an active journey in session', () => {
    const middleware = emptyJourneyHandler('journey', true)

    it('should redirect back to root when the journey data is not in session', async () => {
      // eslint-disable-next-line dot-notation
      req.session['journey'] = null
      await middleware(req, res, next)

      expect(res.redirect).toHaveBeenCalledWith('/')
    })

    it('should continue if journey data exists in session', async () => {
      // eslint-disable-next-line dot-notation
      req.session['journey'] = { data: 1 }
      await middleware(req, res, next)

      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('step does not require an active journey in session', () => {
    const middleware = emptyJourneyHandler('journey', false)

    it('should continue', async () => {
      // eslint-disable-next-line dot-notation
      req.session['journey'] = null
      await middleware(req, res, next)

      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })
})
