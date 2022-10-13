import { getMockReq, getMockRes } from '@jest-mock/express'

import activityList from '../../../middleware/fixtures/activity_list_1.json'
import absenceReasons from '../../../middleware/fixtures/absence_reasons_1.json'
import payDetails from '../fixtures/update_attendences_pay_details_request_1.json'

import PrisonService from '../../../services/prisonService'
import PrisonApiClient from '../../../data/prisonApiClient'
import PrisonerSearchApiClient from '../../../data/prisonerSearchApiClient'
import PrisonRegisterApiClient from '../../../data/prisonRegisterApiClient'
import WhereaboutsApiClient from '../../../data/whereaboutsApiClient'
import ActivityListAbsencesRouteHandler from './ActivityListAbsencesRouteHandler'
import { CodeNameStringPair } from '../../../@types/dps'

jest.mock('../../../services/prisonService')
jest.mock('../../../data/prisonApiClient')
jest.mock('../../../data/prisonerSearchApiClient')
jest.mock('../../../data/prisonRegisterApiClient')
jest.mock('../../../data/whereaboutsApiClient')

describe('activityListAbsencesRouteHandler', () => {
  const prisonApiClient = new PrisonApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const prisonRegisterApiClient = new PrisonRegisterApiClient()
  const whereaboutsApiClient = new WhereaboutsApiClient()
  const prisonService = new PrisonService(
    prisonApiClient,
    prisonerSearchApiClient,
    prisonRegisterApiClient,
    whereaboutsApiClient,
  )
  let controller: ActivityListAbsencesRouteHandler

  beforeEach(() => {
    controller = new ActivityListAbsencesRouteHandler(prisonService)
    jest.clearAllMocks()
  })

  describe('GET No activities not attended', () => {
    it('should render', async () => {
      const req = getMockReq({
        query: {
          locationId: '10003',
          date: '2022-08-01',
          period: 'AM',
        },
        session: {
          data: {
            activitiesNotAttended: [],
          },
        },
      })
      const { res } = getMockRes({
        locals: {
          activityList,
          absenceReasons,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activityList/absences', {
        locationId: '10003',
        date: '2022-08-01',
        period: 'AM',
        rowData: [],
        paidAbsenceReasons: absenceReasons?.paidReasons,
        paidAbsenceSubReasons: absenceReasons?.paidSubReasons,
        unpaidAbsenceReasons: absenceReasons?.unpaidReasons.filter(
          (r: CodeNameStringPair) => !r.code.includes('Warning'),
        ),
        unpaidAbsenceSubReasons: absenceReasons?.unpaidSubReasons,
      })
    })
  })

  describe('GET 2 activities not attended', () => {
    it('should render', async () => {
      const req = getMockReq({
        query: {
          locationId: '10003',
          date: '2022-08-01',
          period: 'AM',
        },
        session: {
          data: {
            activitiesNotAttended: [
              {
                bookingId: 1148278,
                activityId: 484055183,
              },
              {
                bookingId: 924477,
                activityId: 484055180,
              },
            ],
          },
        },
      })

      const { res } = getMockRes({
        locals: {
          activityList,
          absenceReasons,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activityList/absences', {
        locationId: '10003',
        date: '2022-08-01',
        period: 'AM',
        rowData: [
          {
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            bookingId: 1148278,
            eventId: 484055183,
            location: 'MDI-2-1-035',
            name: 'Colt, Barnett',
            otherActivities: '13:15 - 16:15 - PICTA PM',
            prisonNumber: 'G3577UD',
            relevantAlerts: [],
          },
          {
            activity: '15:00 -  Res1 Elderly Tues 15.00 Wed /Fri 10.00',
            bookingId: 924477,
            eventId: 484055180,
            location: 'MDI-2-3-008',
            name: 'Moragne, Berke',
            otherActivities: '13:15 - 16:15 - ED1-Rm1 L1/Num PM',
            prisonNumber: 'G5824GU',
            relevantAlerts: [],
          },
        ],
        paidAbsenceReasons: absenceReasons?.paidReasons,
        paidAbsenceSubReasons: absenceReasons?.paidSubReasons,
        unpaidAbsenceReasons: absenceReasons?.unpaidReasons.filter(
          (r: CodeNameStringPair) => !r.code.includes('Warning'),
        ),
        unpaidAbsenceSubReasons: absenceReasons?.unpaidSubReasons,
      })
    })
  })

  describe('POST with 2 absences pay details', () => {
    it('should redirect', async () => {
      const req = getMockReq({
        body: payDetails,
      })
      const { res } = getMockRes({
        locals: {
          absenceReasons,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })
      await controller.POST(req, res)
      expect(prisonService.batchUpdateAttendance).toHaveBeenCalledTimes(1)
      expect(prisonService.batchUpdateAttendance).toHaveBeenCalledWith(
        'MDI',
        '27187',
        '2022-10-13',
        'AM',
        [
          { activityId: 484814578, bookingId: 949173 },
          { activityId: 484729770, bookingId: 1089812 },
        ],
        false,
        true,
        'NotRequired',
        '. more details for Emmett',
        { activeCaseLoad: { caseLoadId: 'MDI' }, token: 'token' },
      )
      expect(res.redirect).toHaveBeenCalledWith('/activity-list?locationId=27187&date=2022-10-13&period=AM')
    })
  })
})
