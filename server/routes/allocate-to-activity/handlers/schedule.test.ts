import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonerSearchApiClient from '../../../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../../../data/activitiesApiClient'
import CapacitiesService from '../../../services/capacitiesService'
import ActivitiesService from '../../../services/activitiesService'
import activitySchedule1 from '../../../services/fixtures/activity_schedule_2.json'
import allocationsSummary1 from '../../../middleware/fixtures/allocations_summary_1.json'
import atLeast from '../../../../jest.setup'
import ScheduleRoutes from './schedule'

jest.mock('../../../services/capacitiesService')
jest.mock('../../../services/activitiesService')
jest.mock('../../../data/prisonerSearchApiClient')
jest.mock('../../../data/activitiesApiClient')

describe('Route Handlers - Schedule', () => {
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>

  const capacitiesService = new CapacitiesService(activitiesApiClient)
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

  let controller: ScheduleRoutes

  beforeEach(() => {
    controller = new ScheduleRoutes(capacitiesService, activitiesService)
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should render', async () => {
      const req = getMockReq({
        session: {
          data: {},
        },
        params: {
          scheduleId: '12',
        },
      })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      when(capacitiesService.getScheduleAllocationsSummary)
        .calledWith(atLeast(12))
        .mockResolvedValueOnce(allocationsSummary1)
      when(activitiesService.getActivitySchedule).calledWith(atLeast(12)).mockResolvedValueOnce(activitySchedule1)

      await controller.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/schedule', {
        pageHeading: 'Identify candidates for Entry level Maths 1',
        currentUrlPath: '',
        tabs: [
          {
            title: 'People allocated now',
            path: '/allocate/12/people-allocated-now',
            testId: 'people-allocated-now',
          },
          {
            title: 'Identify candidates',
            path: '/allocate/12/identify-candidates',
            testId: 'identify-candidates',
            titleDecorator: '5 vacancies',
            titleDecoratorClass: 'govuk-tag govuk-tag--red',
          },
          {
            title: 'Activity risk requirements',
            path: '/allocate/12/activity-risk-requirements',
            testId: 'activity-risk-requirements',
          },
          {
            title: 'Entry level Maths 1 schedule',
            path: '/allocate/12/schedule',
            testId: 'schedule',
          },
        ],
        schedule: activitySchedule1,
        scheduleDescription: 'Entry level Maths 1',
      })
    })
  })
})
