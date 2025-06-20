import { Request, Response } from 'express'
import ActivitiesService from '../../../../../services/activitiesService'
import CheckAndConfirmMultipleRoutes from './checkAndConfirmMultiple'
import { AllocateToActivityJourney, Inmate, StartDateOption } from '../../journey'

jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

describe('Allocate multiple people - check and confirm answers', () => {
  const handler = new CheckAndConfirmMultipleRoutes(activitiesService)
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

    const allocateJourney = {
      inmates: [
        {
          prisonerName: 'Joe Bloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
          prisonerNumber: 'G3096GX',
          cellLocation: '1-2-001',
          payBand: {
            id: 1,
            alias: 'A',
            rate: 100,
          },
        },
        {
          prisonerName: 'Jane Cash',
          firstName: 'Jane',
          lastName: 'Cash',
          prisonerNumber: 'G4977UO',
          cellLocation: '2-2-002',
          payBand: {
            id: 2,
            alias: 'B',
            rate: 200,
          },
        },
      ],
      activity: {
        activityId: 1,
        scheduleId: 1,
        name: 'Maths',
        location: 'Education room 1',
      },
      startDate: '2025-01-01',
      endDate: '2026-01-01',
      scheduledInstance: { id: 123 },
    } as AllocateToActivityJourney

    req = {
      routeContext: { mode: 'create' },
      session: {
        allocateJourney,
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('Renders the page - shows pay rates section', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/checkAndConfirmMultiple',
        {
          showPayRates: true,
        },
      )
    })
    it('Renders the page - hides pay rates section', async () => {
      req.session.allocateJourney.inmates = [
        {
          prisonerName: 'Joe Bloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
          prisonerNumber: 'G3096GX',
          cellLocation: '1-2-001',
        },
        {
          prisonerName: 'Jane Cash',
          firstName: 'Jane',
          lastName: 'Cash',
          prisonerNumber: 'G4977UO',
          cellLocation: '2-2-002',
        },
      ] as Inmate[]

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/manage-allocations/allocateMultiplePeople/checkAndConfirmMultiple',
        {
          showPayRates: false,
        },
      )
    })
  })
  describe('POST', () => {
    it('Start date next session', async () => {
      req.session.allocateJourney.startDateOption = StartDateOption.NEXT_SESSION

      await handler.POST(req, res)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledTimes(2)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G3096GX',
        1,
        { username: 'joebloggs' },
        '2025-01-01',
        '2026-01-01',
        [],
        123,
      )
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G4977UO',
        2,
        { username: 'joebloggs' },
        '2025-01-01',
        '2026-01-01',
        [],
        123,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
    it('Start date in future', async () => {
      req.session.allocateJourney.startDateOption = StartDateOption.START_DATE

      await handler.POST(req, res)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledTimes(2)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G3096GX',
        1,
        { username: 'joebloggs' },
        '2025-01-01',
        '2026-01-01',
        [],
        null,
      )
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G4977UO',
        2,
        { username: 'joebloggs' },
        '2025-01-01',
        '2026-01-01',
        [],
        null,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
    it('No end date', async () => {
      req.session.allocateJourney.startDateOption = StartDateOption.NEXT_SESSION
      req.session.allocateJourney.endDate = null

      await handler.POST(req, res)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledTimes(2)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G3096GX',
        1,
        { username: 'joebloggs' },
        '2025-01-01',
        null,
        [],
        123,
      )
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G4977UO',
        2,
        { username: 'joebloggs' },
        '2025-01-01',
        null,
        [],
        123,
      )
    })
    it('No payband id', async () => {
      req.session.allocateJourney.startDateOption = StartDateOption.NEXT_SESSION
      req.session.allocateJourney.inmates = [
        {
          prisonerName: 'Joe Bloggs',
          firstName: 'Joe',
          lastName: 'Bloggs',
          prisonerNumber: 'G3096GX',
          cellLocation: '1-2-001',
        },
        {
          prisonerName: 'Jane Cash',
          firstName: 'Jane',
          lastName: 'Cash',
          prisonerNumber: 'G4977UO',
          cellLocation: '2-2-002',
        },
      ] as Inmate[]

      await handler.POST(req, res)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledTimes(2)
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G3096GX',
        null,
        { username: 'joebloggs' },
        '2025-01-01',
        '2026-01-01',
        [],
        123,
      )
      expect(activitiesService.allocateToSchedule).toHaveBeenCalledWith(
        1,
        'G4977UO',
        null,
        { username: 'joebloggs' },
        '2025-01-01',
        '2026-01-01',
        [],
        123,
      )
      expect(res.redirect).toHaveBeenCalledWith('confirmation')
    })
  })
})
