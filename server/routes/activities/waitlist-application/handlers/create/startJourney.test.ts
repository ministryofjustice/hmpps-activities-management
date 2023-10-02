import { NextFunction, Request, Response } from 'express'
import { when } from 'jest-when'
import atLeast from '../../../../../../jest.setup'
import StartJourneyRoutes from './startJourney'
import PrisonService from '../../../../../services/prisonService'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import MetricsService from '../../../../../services/metricsService'
import MetricsEvent from '../../../../../data/metricsEvent'

jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/metricsService')

const prisonService = new PrisonService(null, null, null)
const metricsService = new MetricsService(null)

describe('Route Handlers - Waitlist application - Start', () => {
  const handler = new StartJourneyRoutes(prisonService, metricsService)
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
      expect(
        metricsService.trackEvent(
          MetricsEvent.WAITLIST_APPLICATION_JOURNEY_STARTED(res.locals.user).addJourneyStartedMetrics(req),
        ),
      )
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
