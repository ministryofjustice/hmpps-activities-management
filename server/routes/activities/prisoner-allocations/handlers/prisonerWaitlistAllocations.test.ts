import { Request, Response } from 'express'
import { when } from 'jest-when'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import PrisonService from '../../../../services/prisonService'
import ActivitiesService from '../../../../services/activitiesService'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import {
  Activity,
  ActivitySummary,
  PrisonerAllocations,
  WaitingListApplicationPaged,
} from '../../../../@types/activitiesAPI/types'
import PrisonerWaitlistHandler, { SelectWailistOptions } from './prisonerWaitlistAllocations'
import { associateErrorsWithProperty } from '../../../../utils/utils'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

const mockPrisoner: Prisoner = {
  prisonerNumber: 'ABC123',
  firstName: 'Joe',
  lastName: 'Bloggs',
  cellLocation: '1-2-001',
  prisonId: 'LEI',
  status: 'ACTIVE OUT',
  prisonName: 'Leicester Prison',
  lastMovementTypeCode: 'CRT',
  releaseDate: '2019-11-30',
  alerts: [{ alertType: 'R', alertCode: 'RLO', active: true, expired: false }],
} as Prisoner

const mockActivities = [
  {
    id: 1,
    activityName: 'A Wing Cleaner 2',
    activityState: 'LIVE',
  },
  {
    id: 110,
    activityName: 'A Wing Orderly',
    activityState: 'LIVE',
  },
  {
    id: 310,
    activityName: 'B Wing Orderly',
    activityState: 'LIVE',
  },
] as ActivitySummary[]

const mockWaitlistApplications = [
  {
    id: 213,
    activityId: 1,
    scheduleId: 518,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    status: 'APPROVED',
    activity: {
      id: 1,
      activityName: 'A Wing Cleaner 2',
      activityState: 'LIVE',
    },
  },
  {
    id: 213,
    activityId: 110,
    scheduleId: 518,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    status: 'ALLOCATED',
    activity: {
      id: 110,
      activityName: 'A Wing Orderly',
      activityState: 'LIVE',
    },
  },
  {
    id: 213,
    activityId: 310,
    scheduleId: 518,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    status: 'PENDING',
    activity: {
      id: 110,
      activityName: 'B Wing Orderly',
      activityState: 'LIVE',
    },
  },
]

const mockWaitingListSearchResults = {
  content: mockWaitlistApplications,
  totalPages: 1,
  pageNumber: 0,
  totalElements: 1,
  first: true,
  last: false,
} as unknown as WaitingListApplicationPaged

const mockApprovedPendingWaitlist = [
  {
    id: 213,
    activityId: 1,
    scheduleId: 518,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    status: 'APPROVED',
    activity: {
      id: 1,
      activityName: 'A Wing Cleaner 2',
      activityState: 'LIVE',
    },
  },
  {
    id: 213,
    activityId: 310,
    scheduleId: 518,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    status: 'PENDING',
    activity: {
      id: 310,
      activityName: 'B Wing Orderly',
      activityState: 'LIVE',
    },
  },
]

describe('Route Handlers - Prisoner Allocations', () => {
  const handler = new PrisonerWaitlistHandler(activitiesService, prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          activeCaseLoadId: 'LEI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
      validationFailed: jest.fn(),
    } as unknown as Response

    req = {
      params: { prisonerNumber: 'ABC123' },
      journeyData: { prisonerAllocationsJourney: {} },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render a prisoners approved and pending waitlist applications on options page', async () => {
      when(activitiesService.getActivities).calledWith(true, res.locals.user).mockResolvedValue(mockActivities)
      when(prisonService.getInmateByPrisonerNumber)
        .calledWith(atLeast(req.params.prisonerNumber))
        .mockResolvedValue(mockPrisoner)
      when(activitiesService.getWaitlistApplicationsForPrisoner)
        .calledWith(res.locals.user.activeCaseLoadId, req.params.prisonerNumber, res.locals.user)
        .mockResolvedValue(mockWaitingListSearchResults)

      await handler.GET(req, res)

      expect(mockApprovedPendingWaitlist).toHaveLength(2)
      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/waitlist-options', {
        activities: mockActivities,
        approvedPendingWaitlist: mockApprovedPendingWaitlist,
        prisonerName: 'Joe Bloggs',
      })
    })
  })

  describe('POST', () => {
    it('should redirect to allocate to activity page when approved app is selected', async () => {
      req.body = {
        waitlistScheduleId: 518,
        waitlistApplicationData: [
          {
            activityName: 'Computer Skills',
            id: '217',
            status: 'PENDING',
            scheduleId: 89,
            requestedDate: '2025-07-03',
            requestedBy: 'PRISONER',
            comments: '',
          },
          {
            activityName: 'A Wing Cleaner 2',
            id: '213',
            status: 'APPROVED',
            scheduleId: 518,
            requestedDate: '2025-06-24',
            requestedBy: 'PRISONER',
            comments: 'Test',
          },
        ],
      }

      await handler.POST(req, res)

      expect(req.journeyData.prisonerAllocationsJourney.status).toEqual('APPROVED')
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocations/create/prisoner/ABC123?scheduleId=518')
    })

    it('should redirect to the allocate activity page, when an unallocated activity or approved waitlist application is chosen from activity search list', async () => {
      req.body = {
        activityId: 1,
        waitlistScheduleId: '',
        waitlistApplicationData: [
          {
            activityName: 'Computer Skills',
            id: '217',
            status: 'PENDING',
            scheduleId: '89',
            requestedDate: '2025-07-03',
            requestedBy: 'PRISONER',
            comments: '',
          },
          {
            activityName: 'A Wing Cleaner 2',
            id: '213',
            status: 'APPROVED',
            scheduleId: '518',
            requestedDate: '2025-06-24',
            requestedBy: 'PRISONER',
            comments: 'Test',
          },
        ],
      }

      const mockActivity = {
        id: 1,
        description: 'Admin Orderly',
        schedules: [
          {
            id: 385,
          },
        ],
      } as Activity

      when(activitiesService.getActivity)
        .calledWith(req.body.activityId, res.locals.user)
        .mockResolvedValue(mockActivity)

      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith([req.params.prisonerNumber], res.locals.user)
        .mockResolvedValue([])

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocations/create/prisoner/ABC123?scheduleId=385')
    })

    it('should redirect to pending waitlist page, when pending waitlist application is chosen from activity search list', async () => {
      req.body = {
        activityId: 1,
        waitlistScheduleId: undefined,
        waitlistApplicationData: [
          {
            activityName: 'Computer Skills',
            id: '217',
            status: 'PENDING',
            scheduleId: '89',
            requestedDate: '2025-07-03',
            requestedBy: 'PRISONER',
            comments: '',
          },
          {
            activityName: 'A Wing Cleaner 2',
            id: '213',
            status: 'APPROVED',
            scheduleId: '518',
            requestedDate: '2025-06-24',
            requestedBy: 'PRISONER',
            comments: 'Test',
          },
        ],
      }

      const activity = {
        id: 1,
        description: 'Computer Skills',
        schedules: [
          {
            id: 89,
          },
        ],
      } as Activity

      when(activitiesService.getActivity).calledWith(req.body.activityId, res.locals.user).mockResolvedValue(activity)
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith([req.params.prisonerNumber], res.locals.user)
        .mockResolvedValue([])

      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith(`pending-application`)
    })
  })

  describe('Validation', () => {
    it('validation fails when no activity is selected', async () => {
      const body = {
        activityId: '-',
      }

      const requestObject = plainToInstance(SelectWailistOptions, body)
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual(
        expect.arrayContaining([{ property: 'waitlistScheduleId', error: 'You must select an activity' }]),
      )
    })

    it('should throw validation error if prisoner already allocated', async () => {
      req.body = {
        activityId: 1,
        waitlistScheduleId: '',
        waitlistApplicationData: [
          {
            activityName: 'Computer Skills',
            id: '213',
            status: 'APPROVED',
            scheduleId: '518',
            requestedDate: '2025-06-24',
            requestedBy: 'PRISONER',
            comments: 'Test',
          },
        ],
      }

      const activity = {
        id: 1,
        description: 'A Wing Cleaner 2',
        schedules: [
          {
            id: 89,
          },
        ],
      } as Activity

      when(activitiesService.getActivity).calledWith(1, res.locals.user).mockResolvedValue(activity)
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith([req.params.prisonerNumber], res.locals.user)
        .mockResolvedValue([{ allocations: [{ scheduleId: 89 }] }] as PrisonerAllocations[])

      await handler.POST(req, res)

      expect(res.validationFailed).toHaveBeenCalledWith('activityId', 'ABC123 is already allocated to A Wing Cleaner 2')
    })
  })
})
