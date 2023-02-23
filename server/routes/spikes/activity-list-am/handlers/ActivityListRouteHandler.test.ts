import { getMockReq, getMockRes } from '@jest-mock/express'
import activityScheduleAllocations from '../../../../middleware/fixtures/activity_schedule_allocation_1.json'
import ActivityListRouteHandler from './ActivityListRouteHandler'

import ActivitiesService from '../../../../services/activitiesService'
import ActivitiesApiClient from '../../../../data/activitiesApiClient'
import PrisonerSearchApiClient from '../../../../data/prisonerSearchApiClient'
import PrisonApiClient from '../../../../data/prisonApiClient'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../data/activitiesApiClient')
jest.mock('../../../../data/prisonerSearchApiClient')
jest.mock('../../../../data/prisonApiClient')

describe('activityListRouteHandler', () => {
  const activitiesApiClient = new ActivitiesApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const prisonApiClient = new PrisonApiClient() as jest.Mocked<PrisonApiClient>
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient, prisonApiClient)

  let controller: ActivityListRouteHandler

  beforeEach(() => {
    controller = new ActivityListRouteHandler(activitiesService)
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should render', async () => {
      const req = getMockReq({
        session: {
          data: {},
        },
      })
      const { res } = getMockRes({
        locals: {
          activityScheduleAllocations,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityListAm/index', {
        rowData: [
          {
            activity: 'Wednesday AM Houseblock 3',
            id: 3,
            location: 'MDI-3-3-006',
            name: 'Daniels, Jack',
            prisonNumber: 'G3439UH',
            relevantAlerts: ['ACCT'],
          },
        ],
      })
    })
  })

  describe('POST with nothing selected', () => {
    it('should redirect', async () => {
      const req = getMockReq({
        body: {
          locationId: '10001G',
          date: '01/08/2022',
          period: 'AM',
        },
      })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })
      await controller.POST(req, res)
      expect(activitiesService.updateAttendances).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/activity-list-am?locationId=10001G&date=01%2F08%2F2022&period=AM')
    })
  })

  describe('POST with just attended', () => {
    it('should redirect', async () => {
      const req = getMockReq({
        body: {
          locationId: '10001G',
          date: '2022-08-01',
          period: 'AM',
          'attended-id-949173-484814578': 'yes',
          'attended-id-1089812-484729770': 'yes',
        },
      })
      const { res } = getMockRes({
        locals: {
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })
      await controller.POST(req, res)
      expect(activitiesService.updateAttendances).toHaveBeenCalledTimes(1)
      expect(activitiesService.updateAttendances).toHaveBeenCalledWith(
        [
          { attendanceReason: 'ATT', id: 484814578 },
          { attendanceReason: 'ATT', id: 484729770 },
        ],
        { activeCaseLoad: { caseLoadId: 'MDI' }, token: 'token' },
      )
      expect(res.redirect).toHaveBeenCalledWith('/activity-list-am?locationId=10001G&date=2022-08-01&period=AM')
    })
  })

  describe('POST with just NOT attended', () => {
    it('should redirect', async () => {
      const req = getMockReq({
        body: {
          locationId: '10001G',
          date: '01/08/2022',
          period: 'AM',
          'attended-id-949173-484814578': 'no',
          'attended-id-1089812-484729770': 'no',
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
      expect(activitiesService.updateAttendances).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(
        '/activity-list-am/absences?locationId=10001G&date=01%2F08%2F2022&period=AM',
      )
    })
  })
})
