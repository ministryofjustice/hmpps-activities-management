import { getMockReq, getMockRes } from '@jest-mock/express'
import { when } from 'jest-when'
import PrisonService from '../../../services/prisonService'
import CapacitiesService from '../../../services/capacitiesService'
import ActivitiesService from '../../../services/activitiesService'
import inmateDetails1 from '../../../middleware/fixtures/inmate_details_1.json'
import activitySchedule1 from '../../../services/fixtures/activity_schedule_1.json'
import allocationsSummary1 from '../../../middleware/fixtures/allocations_summary_1.json'
import atLeast from '../../../../jest.setup'
import IdentifyCandidatesRoutes from './identifyCandidates'

jest.mock('../../../services/prisonService')
jest.mock('../../../services/capacitiesService')
jest.mock('../../../services/activitiesService')

describe('Route Handlers - Identify Candidates', () => {
  const prisonService = new PrisonService(null, null, null, null)
  const capacitiesService = new CapacitiesService(null)
  const activitiesService = new ActivitiesService(null, null)

  let controller: IdentifyCandidatesRoutes

  beforeEach(() => {
    controller = new IdentifyCandidatesRoutes(prisonService, capacitiesService, activitiesService)
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

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      when(prisonService.getInmates).calledWith(atLeast('MDI')).mockResolvedValueOnce(inmateDetails1)
      when(capacitiesService.getScheduleAllocationsSummary)
        .calledWith(atLeast(12))
        .mockResolvedValueOnce(allocationsSummary1)
      when(activitiesService.getActivitySchedule).calledWith(atLeast(12)).mockResolvedValueOnce(activitySchedule1)

      await controller.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/allocate-to-activity/identify-candidates', {
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
        rowData: [
          {
            alerts: ['XER', 'XEL'],
            incentiveLevel: 'Standard',
            location: '1-1-031',
            name: 'Cholak, Alfonso',
            prisonNumber: 'A5015DY',
          },
          {
            alerts: [],
            incentiveLevel: 'Standard',
            location: '2-2-032',
            name: 'Marke, Jamie',
            prisonNumber: 'A5089DY',
          },
          {
            alerts: ['UPIU'],
            incentiveLevel: 'Standard',
            location: '3-3-025',
            name: 'Smith, Fred',
            prisonNumber: 'A5072DY',
          },
        ],
        criteria: {
          sort: {
            direction: 'asc',
            field: 'name',
          },
        },
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
      expect(res.redirect).toHaveBeenCalledWith('/allocate/12/identify-candidates')
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
      expect(res.redirect).toHaveBeenCalledWith('/allocate/12/identify-candidates')
      expect(req.session.data.activityCandidateListCriteria.sort.field).toEqual('name')
      expect(req.session.data.activityCandidateListCriteria.sort.direction).toEqual('asc')
    })
  })
})
