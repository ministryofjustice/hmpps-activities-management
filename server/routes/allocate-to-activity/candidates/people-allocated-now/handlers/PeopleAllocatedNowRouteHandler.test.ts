import { getMockReq, getMockRes } from '@jest-mock/express'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import PeopleAllocatedNowRouteHandler from './PeopleAllocatedNowRouteHandler'
import { ActivitySchedule, Allocation } from '../../../../../@types/activitiesAPI/types'
import { InmateBasicDetails } from '../../../../../@types/prisonApiImport/types'

jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../services/prisonService')

const activitiesService = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null, null) as jest.Mocked<PrisonService>

describe('Route Handlers - Schedules dashboard', () => {
  const handler = new PeopleAllocatedNowRouteHandler(activitiesService, prisonService)

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

    activitiesService.getSchedule.mockResolvedValue(wingCleaning1)
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

  beforeEach(() => {
    mockAllocationData()
    mockScheduleData()
    mockInmateDetailsData()
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
            path: '/activities/allocate/1/candidates/people-allocated-now/',
            testId: 'people-allocated-now',
          },
          {
            title: 'Identify candidates',
            path: '/activities/allocate/1/candidates/identify-candidates/',
            testId: 'identify-candidates',
            titleDecorator: '1 vacancy',
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
            alerts: [],
            incentiveLevel: '',
            location: 'Room 1',
            name: 'Bob Flemming',
            prisonNumber: '111111',
          },
          {
            alerts: [],
            incentiveLevel: '',
            location: 'Room 2',
            name: 'Fred Bloggs',
            prisonNumber: '222222',
          },
        ],
      })
    })
  })
})
