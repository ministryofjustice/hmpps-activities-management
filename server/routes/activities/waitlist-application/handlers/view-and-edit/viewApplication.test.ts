import { NextFunction, Request, Response } from 'express'
import { parse } from 'date-fns'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import ViewApplicationRoutes from './viewApplication'
import PrisonService from '../../../../../services/prisonService'
import atLeast from '../../../../../../jest.setup'
import { Activity, WaitingListApplication } from '../../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)

describe('Route Handlers - Waitlist application - View application', () => {
  const handler = new ViewApplicationRoutes(activitiesService, prisonService)
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
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: { applicationId: 1 },
      query: {},
      session: {},
    } as unknown as Request

    next = jest.fn()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the activity template', async () => {
      activitiesService.fetchWaitlistApplication = jest.fn()
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          status: 'PENDING',
          activityId: 1,
          scheduleId: 1,
          prisonerNumber: 'ABC123',
          creationTime: '2023-08-16',
          requestedDate: '2023-07-31',
          requestedBy: 'Self-requested',
          comments: 'test comment',
          statusUpdatedTime: null,
        } as WaitingListApplication)

      prisonService.getInmateByPrisonerNumber = jest.fn()
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          prisonerNumber: 'ABC123',
          firstName: 'Alan',
          lastName: 'Key',
        } as Prisoner)

      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          description: 'Test activity',
          schedules: [{ allocations: [] }],
        } as Activity)

      activitiesService.fetchActivityWaitlist = jest.fn()
      when(activitiesService.fetchActivityWaitlist).calledWith(atLeast(1)).mockResolvedValue([])

      await handler.GET(req, res, next)

      expect(req.session.waitListApplicationJourney).toEqual({
        prisoner: {
          name: 'Alan Key',
          prisonerNumber: 'ABC123',
        },
        requestDate: '2023-07-31',
        activity: {
          activityId: 1,
          activityName: 'Test activity',
        },
        requester: 'Self-requested',
        status: 'PENDING',
        comment: 'test comment',
        createdTime: '2023-08-16',
      })
      expect(res.render).toHaveBeenCalledWith(`pages/activities/waitlist-application/view-application`, {
        prisoner: {
          name: 'Alan Key',
          prisonerNumber: 'ABC123',
        },
        requestDate: parse('2023-07-31', 'yyyy-MM-dd', new Date()),
        activityName: 'Test activity',
        requester: 'Self-requested',
        comment: 'test comment',
        status: 'PENDING',
        statusUpdatedTime: null,
        activityId: 1,
        isMostRecent: true,
        isNotAlreadyAllocated: true,
      })
    })

    it('should calculate if the application is the most recent for the prisoner', async () => {
      activitiesService.fetchWaitlistApplication = jest.fn()
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          status: 'DECLINED',
          activityId: 1,
          scheduleId: 1,
          prisonerNumber: 'ABC123',
          creationTime: '2023-08-16',
          requestedDate: '2023-07-31',
          requestedBy: 'Self-requested',
          comments: 'test comment',
        } as WaitingListApplication)

      prisonService.getInmateByPrisonerNumber = jest.fn()
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          prisonerNumber: 'ABC123',
          firstName: 'Alan',
          lastName: 'Key',
        } as Prisoner)

      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          description: 'Test activity',
          schedules: [{ allocations: [] }],
        } as Activity)

      activitiesService.fetchActivityWaitlist = jest.fn()
      when(activitiesService.fetchActivityWaitlist)
        .calledWith(atLeast(1))
        .mockResolvedValue([{ prisonerNumber: 'ABC123', creationTime: '2023-08-17' } as WaitingListApplication])

      await handler.GET(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        `pages/activities/waitlist-application/view-application`,
        expect.objectContaining({
          isMostRecent: false,
        }),
      )
    })

    it('should calculate if the prisoner is already allocated', async () => {
      activitiesService.fetchActivityWaitlist = jest.fn()
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          status: 'DECLINED',
          scheduleId: 1,
          prisonerNumber: 'ABC123',
          creationTime: '2023-08-16',
          requestedDate: '2023-07-31',
          requestedBy: 'Self-requested',
          comments: 'test comment',
        } as WaitingListApplication)

      prisonService.getInmateByPrisonerNumber = jest.fn()
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          prisonerNumber: 'ABC123',
          firstName: 'Alan',
          lastName: 'Key',
        } as Prisoner)

      activitiesService.getActivity = jest.fn()
      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          description: 'Test activity',
          schedules: [{ allocations: [{ prisonerNumber: 'ABC123', status: 'ACTIVE' }] }],
        } as Activity)

      activitiesService.fetchActivityWaitlist = jest.fn()
      when(activitiesService.fetchActivityWaitlist).calledWith(atLeast(1)).mockResolvedValue([])

      await handler.GET(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        `pages/activities/waitlist-application/view-application`,
        expect.objectContaining({
          isNotAlreadyAllocated: false,
        }),
      )
    })

    it('should return the user to the journey entry URL', async () => {
      req.query = {
        journeyEntry: 'waitlist-dashboard',
      }

      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          prisonerNumber: 'ABC123',
          activityId: 1,
        } as WaitingListApplication)

      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue({
          prisonerNumber: 'ABC123',
          firstName: 'Alan',
          lastName: 'Key',
        } as Prisoner)

      when(activitiesService.getActivity)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          id: 1,
          description: 'Test activity',
          schedules: [{ allocations: [] }],
        } as Activity)

      when(activitiesService.fetchActivityWaitlist)
        .calledWith(atLeast(1))
        .mockResolvedValue([{ prisonerNumber: 'ABC123', creationTime: '2023-08-17' } as WaitingListApplication])

      await handler.GET(req, res, next)

      expect(req.session.waitListApplicationJourney.journeyEntry).toEqual('waitlist-dashboard')

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/waitlist-application/view-application',
        expect.objectContaining({
          journeyEntry: 'waitlist-dashboard',
        }),
      )
    })
  })
})
