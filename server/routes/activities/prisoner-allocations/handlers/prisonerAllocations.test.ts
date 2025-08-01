import { Request, Response } from 'express'
import { when } from 'jest-when'
import PrisonService from '../../../../services/prisonService'
import NonAssociationsService from '../../../../services/nonAssociationsService'
import PrisonerAllocationsHandler from './prisonerAllocations'
import ActivitiesService from '../../../../services/activitiesService'
import config from '../../../../config'
import atLeast from '../../../../../jest.setup'
import { Prisoner } from '../../../../@types/prisonerOffenderSearchImport/types'
import { PrisonerNonAssociations } from '../../../../@types/nonAssociationsApi/types'
import { PrisonerAllocations, WaitingListApplicationPaged } from '../../../../@types/activitiesAPI/types'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/nonAssociationsService')

const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const nonAssociationsService = new NonAssociationsService(null, null) as jest.Mocked<NonAssociationsService>

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

const mockNonAssociations = {
  nonAssociations: [],
} as PrisonerNonAssociations

const mockPrisonerAllocations = [
  {
    prisonerNumber: 'ABC123',
    allocations: [
      { id: 1234, activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
      { id: 5678, activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
    ],
  },
] as PrisonerAllocations[]

const mockAllocationsData = [
  { id: 1234, activityId: 1, scheduleId: 1, scheduleDescription: 'this schedule', isUnemployment: false },
  { id: 5678, activityId: 2, scheduleId: 2, scheduleDescription: 'other schedule', isUnemployment: false },
]

const mockAllocationsIds = [1234, 5678]

const mockWaitlistApplications = [
  {
    id: 213,
    activityId: 539,
    scheduleId: 518,
    allocationId: null,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    bookingId: 1136879,
    status: 'APPROVED',
    statusUpdatedTime: '2025-07-16T15:20:10',
    requestedDate: '2025-06-24',
    requestedBy: 'PRISONER',
    comments: 'Test',
    declinedReason: null,
    creationTime: '2025-06-24T08:34:22',
    createdBy: 'SCH_ACTIVITY',
    updatedTime: '2025-07-16T15:20:10',
    updatedBy: 'DTHOMAS_GEN',
    earliestReleaseDate: {
      releaseDate: '2018-01-26',
      isTariffDate: false,
      isIndeterminateSentence: false,
      isImmigrationDetainee: false,
      isConvictedUnsentenced: false,
      isRemand: false,
    },
    nonAssociations: false,
    activity: {
      id: 539,
      activityName: 'A Wing Cleaner 2',
      category: {
        id: 3,
        code: 'SAA_PRISON_JOBS',
        name: 'Prison jobs',
        description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
      },
      capacity: 8,
      allocated: 4,
      waitlisted: 3,
      createdTime: '2023-10-23T09:59:24',
      activityState: 'LIVE',
    },
  },
  {
    id: 213,
    activityId: 110,
    scheduleId: 518,
    allocationId: null,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    bookingId: 1136879,
    status: 'ALLOCATED',
    statusUpdatedTime: '2025-07-16T15:20:10',
    requestedDate: '2025-06-24',
    requestedBy: 'PRISONER',
    comments: 'Test',
    declinedReason: null,
    creationTime: '2025-06-24T08:34:22',
    createdBy: 'SCH_ACTIVITY',
    updatedTime: '2025-07-16T15:20:10',
    updatedBy: 'DTHOMAS_GEN',
    earliestReleaseDate: {
      releaseDate: '2018-01-26',
      isTariffDate: false,
      isIndeterminateSentence: false,
      isImmigrationDetainee: false,
      isConvictedUnsentenced: false,
      isRemand: false,
    },
    nonAssociations: false,
    activity: {
      id: 110,
      activityName: 'A Wing Orderly',
      category: {
        id: 3,
        code: 'SAA_PRISON_JOBS',
        name: 'Prison jobs',
        description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
      },
      capacity: 8,
      allocated: 4,
      waitlisted: 3,
      createdTime: '2023-10-23T09:59:24',
      activityState: 'LIVE',
    },
  },
  {
    id: 213,
    activityId: 310,
    scheduleId: 518,
    allocationId: null,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    bookingId: 1136879,
    status: 'PENDING',
    statusUpdatedTime: '2025-07-16T15:20:10',
    requestedDate: '2025-06-24',
    requestedBy: 'PRISONER',
    comments: 'Test',
    declinedReason: null,
    creationTime: '2025-06-24T08:34:22',
    createdBy: 'SCH_ACTIVITY',
    updatedTime: '2025-07-16T15:20:10',
    updatedBy: 'DTHOMAS_GEN',
    earliestReleaseDate: {
      releaseDate: '2018-01-26',
      isTariffDate: false,
      isIndeterminateSentence: false,
      isImmigrationDetainee: false,
      isConvictedUnsentenced: false,
      isRemand: false,
    },
    nonAssociations: false,
    activity: {
      id: 310,
      activityName: 'B Wing Orderly',
      category: {
        id: 3,
        code: 'SAA_PRISON_JOBS',
        name: 'Prison jobs',
        description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
      },
      capacity: 8,
      allocated: 4,
      waitlisted: 3,
      createdTime: '2023-10-23T09:59:24',
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

const mockApplicationResults = [
  {
    id: 213,
    activityId: 539,
    scheduleId: 518,
    allocationId: null,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    bookingId: 1136879,
    status: 'APPROVED',
    statusUpdatedTime: '2025-07-16T15:20:10',
    requestedDate: '2025-06-24',
    requestedBy: 'PRISONER',
    comments: 'Test',
    declinedReason: null,
    creationTime: '2025-06-24T08:34:22',
    createdBy: 'SCH_ACTIVITY',
    updatedTime: '2025-07-16T15:20:10',
    updatedBy: 'DTHOMAS_GEN',
    earliestReleaseDate: {
      releaseDate: '2018-01-26',
      isTariffDate: false,
      isIndeterminateSentence: false,
      isImmigrationDetainee: false,
      isConvictedUnsentenced: false,
      isRemand: false,
    },
    nonAssociations: false,
    activity: {
      id: 539,
      activityName: 'A Wing Cleaner 2',
      category: {
        id: 3,
        code: 'SAA_PRISON_JOBS',
        name: 'Prison jobs',
        description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
      },
      capacity: 8,
      allocated: 4,
      waitlisted: 3,
      createdTime: '2023-10-23T09:59:24',
      activityState: 'LIVE',
    },
  },
  {
    id: 213,
    activityId: 310,
    scheduleId: 518,
    allocationId: null,
    prisonCode: 'LEI',
    prisonerNumber: 'ABC123',
    bookingId: 1136879,
    status: 'PENDING',
    statusUpdatedTime: '2025-07-16T15:20:10',
    requestedDate: '2025-06-24',
    requestedBy: 'PRISONER',
    comments: 'Test',
    declinedReason: null,
    creationTime: '2025-06-24T08:34:22',
    createdBy: 'SCH_ACTIVITY',
    updatedTime: '2025-07-16T15:20:10',
    updatedBy: 'DTHOMAS_GEN',
    earliestReleaseDate: {
      releaseDate: '2018-01-26',
      isTariffDate: false,
      isIndeterminateSentence: false,
      isImmigrationDetainee: false,
      isConvictedUnsentenced: false,
      isRemand: false,
    },
    nonAssociations: false,
    activity: {
      id: 310,
      activityName: 'B Wing Orderly',
      category: {
        id: 3,
        code: 'SAA_PRISON_JOBS',
        name: 'Prison jobs',
        description: 'Such as kitchen, cleaning, gardens or other maintenance and services to keep the prison running',
      },
      capacity: 8,
      allocated: 4,
      waitlisted: 3,
      createdTime: '2023-10-23T09:59:24',
      activityState: 'LIVE',
    },
  },
]

describe('Route Handlers - Prisoner Allocations', () => {
  const handler = new PrisonerAllocationsHandler(activitiesService, prisonService, nonAssociationsService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: { prisonerNumber: '12345' },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should redirect if feature toggle disabled', async () => {
      config.prisonerAllocationsEnabled = false
      await handler.GET(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities')
    })

    it('should render a prisoners allocation details', async () => {
      config.prisonerAllocationsEnabled = true
      req.params.prisonerNumber = 'ABC123'

      when(prisonService.getInmateByPrisonerNumber).calledWith(atLeast('ABC123')).mockResolvedValue(mockPrisoner)
      when(activitiesService.getActivePrisonPrisonerAllocations)
        .calledWith(atLeast(['ABC123']))
        .mockResolvedValue(mockPrisonerAllocations)
      when(nonAssociationsService.getNonAssociationByPrisonerId)
        .calledWith(atLeast('ABC123'))
        .mockResolvedValue(mockNonAssociations)
      when(activitiesService.getWaitlistApplicationsForPrisoner)
        .calledWith(res.locals.user.activeCaseLoadId, 'ABC123', res.locals.user)
        .mockResolvedValue(mockWaitingListSearchResults)

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/prisoner-allocations/dashboard', {
        prisoner: mockPrisoner,
        hasNonAssociations: false,
        allocationsData: mockAllocationsData,
        activeAllocationIdsForSuspending: mockAllocationsIds,
        locationStatus: 'Temporarily out from Leicester Prison',
        approvedPendingWaitlist: mockApplicationResults,
      })
    })
  })

  describe('POST', () => {
    it('should redirect to another page', async () => {
      await handler.POST(req, res)

      expect(res.redirect).toHaveBeenCalledWith('/activities/prisoner-allocations')
    })
  })
})
