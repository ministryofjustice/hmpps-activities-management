import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonApiClient from '../../../../../data/prisonApiClient'
import PrisonerSearchApiClient from '../../../../../data/prisonerSearchApiClient'
import PrisonRegisterApiClient from '../../../../../data/prisonRegisterApiClient'
import WhereaboutsApiClient from '../../../../../data/whereaboutsApiClient'
import ActivitiesApiClient from '../../../../../data/activitiesApiClient'
import PrisonService from '../../../../../services/prisonService'
import CapacitiesService from '../../../../../services/capacitiesService'
import ActivitiesService from '../../../../../services/activitiesService'
import IdentifyCandidatesRouteHandler from './IdentifyCandidatesRouteHandler'
import inmateDetails1 from '../../../../../middleware/fixtures/inmate_details_1.json'
import activitySchedule1 from '../../../../../services/fixtures/activity_schedule_1.json'
import allocationsSummary1 from '../../../../../middleware/fixtures/allocations_summary_1.json'
import atLeast from '../../../../../../jest.setup'

jest.mock('../../../../../services/prisonService')
jest.mock('../../../../../services/capacitiesService')
jest.mock('../../../../../services/activitiesService')
jest.mock('../../../../../data/prisonApiClient')
jest.mock('../../../../../data/prisonerSearchApiClient')
jest.mock('../../../../../data/prisonRegisterApiClient')
jest.mock('../../../../../data/whereaboutsApiClient')
jest.mock('../../../../../data/activitiesApiClient')

describe('identifyCandidatestRouteHandler', () => {
  const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
  const prisonerSearchApiClient = new PrisonerSearchApiClient() as jest.Mocked<PrisonerSearchApiClient>
  const prisonRegisterApiClient = new PrisonRegisterApiClient() as jest.Mocked<PrisonRegisterApiClient>
  const whereaboutsApiClient = new WhereaboutsApiClient() as jest.Mocked<WhereaboutsApiClient>
  const activitiesApiClient = new ActivitiesApiClient() as jest.Mocked<ActivitiesApiClient>

  const prisonService = new PrisonService(
    prisonApiClient,
    prisonerSearchApiClient,
    prisonRegisterApiClient,
    whereaboutsApiClient,
  )
  const capacitiesService = new CapacitiesService(activitiesApiClient)
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)

  let controller: IdentifyCandidatesRouteHandler

  beforeEach(() => {
    controller = new IdentifyCandidatesRouteHandler(prisonService, capacitiesService, activitiesService)
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
          offenderListPage: inmateDetails1,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(prisonService.getInmates).calledWith(atLeast('MDI')).mockResolvedValueOnce(inmateDetails1)
      when(capacitiesService.getScheduleAllocationsSummary)
        .calledWith(atLeast(12))
        .mockResolvedValueOnce(allocationsSummary1)
      when(activitiesService.getActivitySchedule).calledWith(atLeast(12)).mockResolvedValueOnce(activitySchedule1)

      await controller.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/candidates/identify-candidates/index', {
        pageHeading: 'Identify candidates for Entry level Maths 1',
        currentUrlPath: '',
        tabs: [
          {
            title: 'People allocated now',
            path: '/activities/allocate/12/candidates/people-allocated-now/',
            testId: 'people-allocated-now',
          },
          {
            title: 'Identify candidates',
            path: '/activities/allocate/12/candidates/identify-candidates/',
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
            title: 'Wing cleaning 1 schedule',
            path: '/activities/allocate/12/candidates/schedule',
            testId: 'schedule',
          },
        ],
        rowData: [
          {
            alerts: ['UPIU'],
            incentiveLevel: 'Standard',
            location: '3-3-025',
            name: 'Smith, Fred',
            prisonNumber: 'A5072DY',
          },
          {
            alerts: [],
            incentiveLevel: 'Standard',
            location: '2-2-032',
            name: 'Marke, Jamie',
            prisonNumber: 'A5089DY',
          },
          {
            alerts: ['XER', 'XEL'],
            incentiveLevel: 'Standard',
            location: '1-1-031',
            name: 'Cholak, Alfonso',
            prisonNumber: 'A5015DY',
          },
        ],
        criteria: {},
      })
    })
  })

  describe('POST with query param sort', () => {
    it('should redirect', async () => {
      const req = getMockReq({
        query: {
          sort: 'prisonNumber:desc',
        },
        params: {
          scheduleId: '12',
        },
        session: {
          data: {},
        },
      })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })
      await controller.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocate/12/candidates/identify-candidates')
      expect(req.session.data.activityCandidateListCriteria.sort.field).toEqual('prisonNumber')
      expect(req.session.data.activityCandidateListCriteria.sort.direction).toEqual('desc')
    })
  })

  describe('POST with default sort', () => {
    it('should redirect', async () => {
      const req = getMockReq({
        query: {},
        params: {
          scheduleId: '12',
        },
        session: {
          data: {},
        },
      })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })
      await controller.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('/activities/allocate/12/candidates/identify-candidates')
      expect(req.session.data.activityCandidateListCriteria.sort.field).toEqual('name')
      expect(req.session.data.activityCandidateListCriteria.sort.direction).toEqual('asc')
    })
  })
})
