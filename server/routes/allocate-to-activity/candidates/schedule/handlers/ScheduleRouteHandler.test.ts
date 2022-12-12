import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonerSearchApiClient from '../../../../../data/prisonerSearchApiClient'
import ActivitiesApiClient from '../../../../../data/activitiesApiClient'
import CapacitiesService from '../../../../../services/capacitiesService'
import ActivitiesService from '../../../../../services/activitiesService'
import activitySchedule1 from '../../../../../services/fixtures/activity_schedule_2.json'
import allocationsSummary1 from '../../../../../middleware/fixtures/allocations_summary_1.json'
import atLeast from '../../../../../../jest.setup'
import ScheduleRouteHandler from './ScheduleRouteHandler'

jest.mock('../../../../../services/capacitiesService')
jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../data/prisonerSearchApiClient')
jest.mock('../../../../../data/activitiesApiClient')

describe('scheduleRouteHandler', () => {
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>

  const capacitiesService = new CapacitiesService(activitiesApiClient)
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

  let controller: ScheduleRouteHandler

  beforeEach(() => {
    controller = new ScheduleRouteHandler(capacitiesService, activitiesService)
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

      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/candidates/schedule/index', {
        pageHeading: 'Identify candidates for Entry level Maths 1',
        currentUrlPath: '',
        tabs: [
          {
            title: 'People allocated now',
            path: '/activities/allocate/12/candidates/people-allocated-now',
            testId: 'people-allocated-now',
          },
          {
            title: 'Identify candidates',
            path: '/activities/allocate/12/candidates/identify-candidates',
            testId: 'identify-candidates',
            titleDecorator: '5 vacancies',
            titleDecoratorClass: 'govuk-tag govuk-tag--red',
          },
          {
            title: 'Activity risk requirements',
            path: '/activities/allocate/12/candidates/activity-risk-requirements',
            testId: 'activity-risk-requirements',
          },
          {
            title: 'Entry level Maths 1 schedule',
            path: '/activities/allocate/12/candidates/schedule',
            testId: 'schedule',
          },
        ],
        rows: [
          [
            { text: 'Monday' },
            { html: '<strong class="govuk-tag">YES</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
          ],
          [
            { text: 'Tuesday' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
          ],
          [
            { text: 'Wednesday' },
            { html: '<strong class="govuk-tag">YES</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
          ],
          [
            { text: 'Thursday' },
            { html: '<strong class="govuk-tag">YES</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
          ],
          [
            { text: 'Friday' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
          ],
          [
            { text: 'Saturday' },
            { html: '<strong class="govuk-tag">YES</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
          ],
          [
            { text: 'Sunday' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
            { html: '<strong class="govuk-tag govuk-tag--grey">NO</strong>' },
          ],
        ],
        scheduleDescription: 'Entry level Maths 1',
      })
    })
  })
})
