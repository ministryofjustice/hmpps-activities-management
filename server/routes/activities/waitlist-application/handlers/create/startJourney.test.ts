import { NextFunction, Request, Response } from 'express'
import { when } from 'jest-when'
import atLeast from '../../../../../../jest.setup'
import StartJourneyRoutes from './startJourney'
import PrisonService from '../../../../../services/prisonService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Waitlist application - Start', () => {
  const handler = new StartJourneyRoutes(prisonService)
  let req: Request
  let res: Response
  let next: NextFunction

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { prisonerNumber: 'ABC123' },
      session: {
        journeyMetrics: {},
      },
    } as unknown as Request

    next = jest.fn()
  })

  describe('GET', () => {
    it('should populate the session with journey data and redirect to the request date page', async () => {
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          firstName: 'Joe',
          lastName: 'Bloggs',
        } as Prisoner)

      await handler.GET(req, res, next)

      expect(req.session.waitListApplicationJourney).toEqual({
        prisoner: {
          prisonerNumber: 'ABC123',
          name: 'Joe Bloggs',
        },
      })
      expect(res.redirect).toHaveBeenCalledWith('../request-date')
    })
  })
})
