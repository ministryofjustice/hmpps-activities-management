import { getMockReq, getMockRes } from '@jest-mock/express'

import activityList from '../../../../middleware/fixtures/activity_list_1.json'

import PrisonService from '../../../../services/prisonService'
import ActivityListRouteHandler from './ActivityListRouteHandler'
import PrisonApiClient from '../../../../data/prisonApiClient'
import PrisonerSearchApiClient from '../../../../data/prisonerSearchApiClient'
import WhereaboutsApiClient from '../../../../data/whereaboutsApiClient'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../data/prisonApiClient')
jest.mock('../../../../data/prisonerSearchApiClient')
jest.mock('../../../../data/whereaboutsApiClient')

describe('activityListRouteHandler', () => {
  const prisonApiClient = new PrisonApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const whereaboutsApiClient = new WhereaboutsApiClient()
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, whereaboutsApiClient)
  let controller: ActivityListRouteHandler

  beforeEach(() => {
    controller = new ActivityListRouteHandler(prisonService)
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
          activityList,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityList/index', {
        rowData: [
          {
            bookingId: 1148278,
            eventId: 484055183,
            name: 'Colt, Barnett',
            location: 'MDI-2-1-035',
            prisonNumber: 'G3577UD',
            relevantAlerts: [],
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            otherActivities: '13:15 - 16:15 - PICTA PM',
          },
          {
            bookingId: 924477,
            eventId: 484055180,
            name: 'Moragne, Berke',
            location: 'MDI-2-3-008',
            prisonNumber: 'G5824GU',
            relevantAlerts: [],
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            otherActivities: '13:15 - 16:15 - ED1-Rm1 L1/Num PM',
          },
          {
            bookingId: 1037644,
            eventId: 484055181,
            name: 'Raygoza, Bard',
            location: 'MDI-2-1-031',
            prisonNumber: 'G9318UI',
            relevantAlerts: ['PEEP'],
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            otherActivities: '13:15 - 16:15 - Tailors PM',
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
      expect(prisonService.batchUpdateAttendance).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/activity-list?locationId=10001G&date=01%2F08%2F2022&period=AM')
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
      expect(prisonService.batchUpdateAttendance).toHaveBeenCalledTimes(1)
      expect(prisonService.batchUpdateAttendance).toHaveBeenCalledWith(
        'MDI',
        '10001G',
        '2022-08-01',
        'AM',
        [
          { activityId: 484814578, bookingId: 949173 },
          { activityId: 484729770, bookingId: 1089812 },
        ],
        true,
        true,
        undefined,
        undefined,
        { activeCaseLoad: { caseLoadId: 'MDI' }, token: 'token' },
      )
      expect(res.redirect).toHaveBeenCalledWith('/activity-list?locationId=10001G&date=2022-08-01&period=AM')
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
      expect(prisonService.batchUpdateAttendance).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(
        '/activity-list/absences?locationId=10001G&date=01%2F08%2F2022&period=AM',
      )
    })
  })
})
