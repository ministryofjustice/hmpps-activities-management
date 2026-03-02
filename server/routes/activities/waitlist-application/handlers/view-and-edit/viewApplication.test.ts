import { NextFunction, Request, Response } from 'express'
import { parse } from 'date-fns'
import { when } from 'jest-when'
import ActivitiesService from '../../../../../services/activitiesService'
import ViewApplicationRoutes from './viewApplication'
import PrisonService from '../../../../../services/prisonService'
import atLeast from '../../../../../../jest.setup'
import { Activity, WaitingListApplication } from '../../../../../@types/activitiesAPI/types'
import { Prisoner } from '../../../../../@types/prisonerOffenderSearchImport/types'
import ActivitiesTestData from '../../../../../utils/testData/activitiesTestData'
import UserService from '../../../../../services/userService'
import { UserDetails } from '../../../../../@types/manageUsersApiImport/types'
import config from '../../../../../config'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/userService')

const activitiesService = new ActivitiesService(null)
const prisonService = new PrisonService(null, null, null)
const userService = new UserService(null)
const fakeWaitlistApplicationJourneyData = {
  prisoner: {
    name: 'Alan Key',
    prisonerNumber: 'ABC123',
  },
  requestDate: '2023-07-31',
  activity: {
    activityId: 1,
    activityName: 'Test activity',
  },
  requester: 'PRISONER',
  status: 'PENDING',
  comment: 'test comment',
  createdTime: '2023-08-16',
}

describe('Route Handlers - Waitlist application - View application', () => {
  const handler = new ViewApplicationRoutes(activitiesService, prisonService, userService)
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
      journeyData: {},
    } as unknown as Request

    next = jest.fn()
    userService.getUserMap = jest.fn().mockResolvedValue(
      new Map([
        ['joebloggs', { username: 'joebloggs', name: 'Joe Bloggs' }],
        ['TEST_NAME', { username: 'testname', name: 'Test Name' }],
      ]) as Map<string, UserDetails>,
    )

    when(activitiesService.fetchWaitlistApplicationHistory)
      .calledWith(atLeast(1))
      .mockResolvedValue(ActivitiesTestData.WaitlistApplicationHistory)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render the activity template', async () => {
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue({
          status: 'PENDING',
          activityId: 1,
          scheduleId: 1,
          prisonerNumber: 'ABC123',
          creationTime: '2023-08-16',
          requestedDate: '2023-07-31',
          requestedBy: 'PRISONER',
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

      expect(req.journeyData.waitListApplicationJourney).toEqual(fakeWaitlistApplicationJourneyData)
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
        journeyEntry: undefined,
        history: expect.any(Array),
        createdAppPreHistory: true,
      })
    })

    it('should calculate if the application is the most recent for the prisoner', async () => {
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue(ActivitiesTestData.DeclinedWaitlistApplication)

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
      when(activitiesService.fetchWaitlistApplication)
        .calledWith(atLeast(1))
        .mockResolvedValue(ActivitiesTestData.DeclinedWaitlistApplication)

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
      when(activitiesService.fetchActivityWaitlist).calledWith(atLeast(1, false)).mockResolvedValue([])

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

      expect(req.journeyData.waitListApplicationJourney.journeyEntry).toEqual('waitlist-dashboard')

      expect(res.render).toHaveBeenCalledWith(
        'pages/activities/waitlist-application/view-application',
        expect.objectContaining({
          journeyEntry: 'waitlist-dashboard',
        }),
      )
    })

    it('should return correct user history', async () => {
      config.waitlistWithdrawnEnabled = true

      activitiesService.fetchWaitlistApplication = jest.fn().mockResolvedValue({
        status: 'PENDING',
        activityId: 1,
        scheduleId: 1,
        prisonerNumber: 'ABC123',
        createdBy: 'joebloggs',
        updatedBy: 'joebloggs',
        creationTime: '2023-08-16',
        requestedDate: '2023-07-31',
        requestedBy: 'PRISONER',
        comments: 'test comment',
        statusUpdatedTime: null,
      })

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
        journeyEntry: undefined,
        history: [
          {
            applicationDate: '2024-01-20',
            change: 'Status changed',
            comments: 'Waiting for security',
            id: 1,
            note: 'Changed from Pending to Approved',
            requestedBy: 'PRISONER',
            status: 'APPROVED',
            updatedBy: 'TEST_NAME',
            updatedByUser: {
              name: 'Test Name',
              username: 'testname',
            },
            updatedDateTime: '2026-02-01T11:00:00',
          },
          {
            applicationDate: '2024-01-20',
            change: 'Date of request changed',
            comments: 'Waiting for security',
            id: 1,
            note: 'Changed from 15 January 2024 to 20 January 2024',
            requestedBy: 'PRISONER',
            status: 'PENDING',
            updatedBy: 'TEST_NAME',
            updatedByUser: {
              name: 'Test Name',
              username: 'testname',
            },
            updatedDateTime: '2026-01-01T14:00:00',
          },
          {
            applicationDate: '2024-01-15',
            change: 'Application updated',
            comments: 'Waiting for security',
            id: 1,
            note: 'Full details are not available for the first change after December 2025. You can check with who made the change.',
            requestedBy: 'PRISONER',
            status: 'PENDING',
            updatedBy: 'TEST_NAME',
            updatedByUser: {
              name: 'Test Name',
              username: 'testname',
            },
            updatedDateTime: '2026-01-01T13:00:00',
          },
          {
            applicationDate: '2023-07-31',
            change: 'Application logged',
            comments: 'test comment',
            id: undefined,
            note: '',
            requestedBy: 'PRISONER',
            status: 'PENDING',
            updatedBy: 'joebloggs',
            updatedByUser: {
              name: 'Joe Bloggs',
              username: 'joebloggs',
            },
            updatedDateTime: '2023-08-16',
          },
        ],
        createdAppPreHistory: true,
      })

      const [, model] = (res.render as jest.Mock).mock.calls[0]

      expect(model.history).toEqual(expect.any(Array))
      expect(model.history.length).toBe(4)
    })
  })
})
