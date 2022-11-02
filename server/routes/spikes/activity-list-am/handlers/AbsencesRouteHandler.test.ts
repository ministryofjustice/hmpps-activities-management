import { getMockReq, getMockRes } from '@jest-mock/express'
import ActivitiesService from '../../../../services/activitiesService'
import ActivitiesApiClient from '../../../../data/activitiesApiClient'
import PrisonerSearchApiClient from '../../../../data/prisonerSearchApiClient'
import AbsencesRouteHandler from './AbsencesRouteHandler'
import activityScheduleAllocations1 from '../../../../middleware/fixtures/activity_schedule_allocation_1.json'
import activityScheduleAllocations2 from '../../../../middleware/fixtures/activity_schedule_allocation_2.json'
import absenceReasons from '../../../../middleware/fixtures/absence_reasons_am_1.json'
import payDetails from '../fixtures/update_attendences_pay_details_request_1.json'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../data/activitiesApiClient')
jest.mock('../../../../data/prisonerSearchApiClient')

describe('activityListAbsencesRouteHandler', () => {
  const activitiesApiClient = new ActivitiesApiClient()
  const prisonerSearchApiClient = new PrisonerSearchApiClient()
  const activitiesService = new ActivitiesService(activitiesApiClient, prisonerSearchApiClient)
  let controller: AbsencesRouteHandler

  beforeEach(() => {
    controller = new AbsencesRouteHandler(activitiesService)
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
          activityScheduleAllocations: activityScheduleAllocations1,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityListAm/absences', {
        locationId: '10003',
        date: '2022-08-01',
        period: 'AM',
        rowData: [],
        paidAbsenceReasons: absenceReasons.paidAbsenceReasons,
        unpaidAbsenceReasons: absenceReasons.unpaidAbsenceReasons,
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
                id: 7,
                attendanceId: 1,
              },
              {
                id: 7,
                attendanceId: 2,
              },
            ],
          },
        },
      })

      const { res } = getMockRes({
        locals: {
          activityScheduleAllocations: activityScheduleAllocations2,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })

      await controller.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/spikes/activityListAm/absences', {
        locationId: '10003',
        date: '2022-08-01',
        period: 'AM',
        rowData: [
          {
            activity: 'Thursday AM Houseblock 3',
            attendanceId: 1,
            attended: false,
            id: 7,
            location: '2-1-007',
            name: 'Harrison, Tim',
            payDecision: false,
            prisonNumber: 'G4793VF',
            relevantAlerts: [],
            unpaidReason: 'UNACAB',
          },
          {
            activity: 'Thursday AM Houseblock 3',
            attendanceId: 2,
            attended: undefined,
            id: 7,
            location: '2-1-008',
            name: 'Daniels, Jack',
            prisonNumber: 'G4444VF',
            relevantAlerts: [],
          },
        ],
        paidAbsenceReasons: absenceReasons.paidAbsenceReasons,
        unpaidAbsenceReasons: absenceReasons.unpaidAbsenceReasons,
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
          activityScheduleAllocations: activityScheduleAllocations2,
          user: { token: 'token', activeCaseLoad: { caseLoadId: 'MDI' } },
        },
      })
      await controller.POST(req, res)
      expect(activitiesService.updateAttendances).toHaveBeenCalledTimes(1)
      expect(activitiesService.updateAttendances).nthCalledWith(
        1,
        [
          { attendanceReason: 'ABS', id: 484814578 },
          { attendanceReason: 'ACCAB', id: 484729770 },
        ],
        { activeCaseLoad: { caseLoadId: 'MDI' }, token: 'token' },
      )
      expect(res.redirect).toHaveBeenCalledWith('/activity-list-am?locationId=27187&date=2022-10-13&period=AM')
    })
  })
})
