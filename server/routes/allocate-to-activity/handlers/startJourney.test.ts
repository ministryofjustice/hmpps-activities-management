import { Request, Response } from 'express'
import { when } from 'jest-when'
import atLeast from '../../../../jest.setup'
import ActivitiesService from '../../../services/activitiesService'
import StartJourneyRoutes from './startJourney'
import PrisonService from '../../../services/prisonService'
import { InmateDetail } from '../../../@types/prisonApiImport/types'
import { ActivitySchedule } from '../../../@types/activitiesAPI/types'

jest.mock('../../../services/prisonService')
jest.mock('../../../services/activitiesService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

describe('Route Handlers - Allocate - Start', () => {
  const handler = new StartJourneyRoutes(prisonService, activitiesService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { scheduleId: '1', prisonerNumber: 'ABC123' },
      session: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should populate the session with journey data and redirect to the pay band page', async () => {
      when(prisonService.getInmate)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          offenderNo: 'ABC123',
          firstName: 'Joe',
          lastName: 'Bloggs',
          assignedLivingUnit: { description: '1-2-001' },
          privilegeSummary: { iepLevel: 'Standard' },
        } as InmateDetail)

      when(activitiesService.getActivitySchedule)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          activity: { id: 1 },
          description: 'Maths',
          internalLocation: { description: 'Education room 1' },
        } as unknown as ActivitySchedule)

      await handler.GET(req, res)

      expect(req.session.allocateJourney).toEqual({
        inmate: {
          prisonerNumber: 'ABC123',
          prisonerName: 'Joe Bloggs',
          cellLocation: '1-2-001',
          incentiveLevel: 'Standard',
        },
        activity: {
          activityId: 1,
          scheduleId: 1,
          name: 'Maths',
          location: 'Education room 1',
        },
      })
      expect(res.redirect).toHaveBeenCalledWith('/allocate/pay-band')
    })
  })
})
