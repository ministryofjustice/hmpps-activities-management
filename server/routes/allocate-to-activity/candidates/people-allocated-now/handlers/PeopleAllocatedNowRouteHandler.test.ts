import { getMockReq, getMockRes } from '@jest-mock/express'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import PeopleAllocatedNowRouteHandler from './PeopleAllocatedNowRouteHandler'
import { ActivitySchedule, Allocation, PrisonerAllocations } from '../../../../../@types/activitiesAPI/types'
import { InmateBasicDetails } from '../../../../../@types/prisonApiImport/types'
import CapacitiesService from '../../../../../services/capacitiesService'
import { AllocationsSummary } from '../../../../../@types/activities'

jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/capacitiesService')
jest.mock('../../../../../services/activitiesService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>
const capacitiesService = new CapacitiesService(null) as jest.Mocked<CapacitiesService>

describe('Route Handlers - Schedules dashboard', () => {
  const handler = new PeopleAllocatedNowRouteHandler(prisonService, capacitiesService, activitiesService)

  const mockAllocationData = () => {
    const bob = {
      id: 1,
      prisonerNumber: '111111',
    } as Allocation
    const fred = {
      id: 2,
      prisonerNumber: '222222',
    } as Allocation

    activitiesService.getAllocations.mockResolvedValue([bob, fred])
  }

  const mockScheduleData = () => {
    const wingCleaning1 = {
      id: 1,
      description: 'Wing cleaning 99',
    } as ActivitySchedule

    activitiesService.getActivitySchedule.mockResolvedValue(wingCleaning1)
  }

  const mockAllocationSummaryData = () => {
    const summary = {
      capacity: 10,
      allocated: 5,
      percentageAllocated: 50,
      vacancies: 5,
    } as AllocationsSummary

    capacitiesService.getScheduleAllocationsSummary.mockResolvedValue(summary)
  }

  const mockInmateDetailsData = () => {
    const bobsData = {
      offenderNo: '111111',
      firstName: 'Bob',
      lastName: 'Flemming',
      assignedLivingUnitDesc: 'Room 1',
    } as InmateBasicDetails
    const fredsData = {
      offenderNo: '222222',
      firstName: 'Fred',
      lastName: 'Bloggs',
      assignedLivingUnitDesc: 'Room 2',
    } as InmateBasicDetails

    prisonService.getInmateDetails.mockResolvedValue([bobsData, fredsData])
  }

  const mockPrisonerAllocationsDate = () => {
    const bobsData = {
      prisonerNumber: '111111',
      allocations: [{ scheduleDescription: 'Wing cleaning 99' }, { scheduleDescription: 'Kitchens' }],
    } as PrisonerAllocations
    const fredsData = {
      prisonerNumber: '222222',
      allocations: [{ scheduleDescription: 'Wing cleaning 99' }, { scheduleDescription: 'Gym' }],
    } as PrisonerAllocations

    activitiesService.getPrisonerAllocations.mockResolvedValue([bobsData, fredsData])
  }

  beforeEach(() => {
    mockAllocationData()
    mockScheduleData()
    mockInmateDetailsData()
    mockAllocationSummaryData()
    mockPrisonerAllocationsDate()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render people allocated to a schedule', async () => {
      const req = getMockReq({
        session: {
          data: {},
        },
        params: {
          scheduleId: '1',
        },
      })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/candidates/people-allocated-now/index', {
        pageHeading: 'Identify candidates for Wing cleaning 99',
        currentUrlPath: '',
        tabs: [
          {
            title: 'People allocated now',
            path: '/activities/allocate/1/candidates/people-allocated-now',
            testId: 'people-allocated-now',
          },
          {
            title: 'Identify candidates',
            path: '/activities/allocate/1/candidates/identify-candidates',
            testId: 'identify-candidates',
            titleDecorator: '5 vacancies',
            titleDecoratorClass: 'govuk-tag govuk-tag--red',
          },
          {
            title: 'Activity risk requirements',
            path: '/activities/allocate/1/candidates/activity-risk-requirements',
            testId: 'activity-risk-requirements',
          },
          {
            title: 'Wing cleaning 99 schedule',
            path: '/activities/allocate/1/candidates/schedule',
            testId: 'schedule',
          },
        ],
        rowData: [
          {
            allocations: ['Kitchens', 'Wing cleaning 99'],
            location: 'Room 1',
            name: 'Bob Flemming',
            prisonNumber: '111111',
          },
          {
            allocations: ['Gym', 'Wing cleaning 99'],
            location: 'Room 2',
            name: 'Fred Bloggs',
            prisonNumber: '222222',
          },
        ],
      })
    })
  })
})
