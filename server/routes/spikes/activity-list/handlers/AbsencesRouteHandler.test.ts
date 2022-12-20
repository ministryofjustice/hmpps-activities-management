import { getMockReq, getMockRes } from '@jest-mock/express'

import activityList from '../../../../middleware/fixtures/activity_list_1.json'
import absenceReasons from '../../../../middleware/fixtures/absence_reasons_1.json'

import PrisonService from '../../../../services/prisonService'
import PrisonApiClient from '../../../../data/prisonApiClient'
import PrisonerSearchApiClient from '../../../../data/prisonerSearchApiClient'
import WhereaboutsApiClient from '../../../../data/whereaboutsApiClient'
import AbsencesRouteHandler from './AbsencesRouteHandler'
import { CodeNameStringPair } from '../../../../@types/dps'
import payDetails from '../fixtures/update_attendences_pay_details_request_1.json'

jest.mock('../../../../services/prisonService')
jest.mock('../../../../data/prisonApiClient')
jest.mock('../../../../data/prisonerSearchApiClient')
jest.mock('../../../../data/whereaboutsApiClient')

describe('activityListAbsencesRouteHandler', () => {
  const prisonApiClient = new PrisonApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const whereaboutsApiClient = new WhereaboutsApiClient()
  const prisonService = new PrisonService(prisonApiClient, prisonerSearchApiClient, whereaboutsApiClient)
  let controller: AbsencesRouteHandler

  beforeEach(() => {
    controller = new AbsencesRouteHandler(prisonService)
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
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityList/absences', {
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
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityList/absences', {
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
          activityList,
          absenceReasons,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })
      await controller.POST(req, res)
      expect(prisonService.createUpdateAttendance).toHaveBeenCalledTimes(2)
      expect(prisonService.createUpdateAttendance).nthCalledWith(
        1,
        undefined,
        '2022-10-13',
        {
          absentReason: 'ApprovedCourse',
          absentSubReason: undefined,
          attended: false,
          bookingId: 949173,
          comments: 'more details for Dieter',
          eventDate: '2022-10-13',
          eventId: 484814578,
          eventLocationId: '27187',
          paid: true,
          period: 'AM',
          prisonId: 'MDI',
        },
        { activeCaseLoad: { caseLoadId: 'MDI' }, token: 'token' },
      )
      expect(prisonService.createUpdateAttendance).nthCalledWith(
        2,
        undefined,
        '2022-10-13',
        {
          absentReason: 'NotRequired',
          absentSubReason: undefined,
          attended: false,
          bookingId: 1089812,
          comments: 'more details for Emmett',
          eventDate: '2022-10-13',
          eventId: 484729770,
          eventLocationId: '27187',
          paid: true,
          period: 'AM',
          prisonId: 'MDI',
        },
        { activeCaseLoad: { caseLoadId: 'MDI' }, token: 'token' },
      )
      expect(res.redirect).toHaveBeenCalledWith('/activity-list?locationId=27187&date=2022-10-13&period=AM')
    })
  })
})
