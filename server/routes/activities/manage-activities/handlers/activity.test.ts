import { Request, Response } from 'express'
import { when } from 'jest-when'

import { addDays } from 'date-fns'
import ActivitiesService from '../../../../services/activitiesService'
import ActivityRoutes, { editPay } from './activity'
import PrisonService from '../../../../services/prisonService'
import atLeast from '../../../../../jest.setup'

import activitySchedule from '../../../../services/fixtures/activity_schedule_1.json'
import { Activity, ActivitySchedule, Allocation } from '../../../../@types/activitiesAPI/types'
import { toDateString } from '../../../../utils/utils'
import { eventTierDescriptions } from '../../../../enum/eventTiers'
import { organiserDescriptions } from '../../../../enum/eventOrganisers'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>

const today = new Date()
const nextWeek = addDays(today, 7)

describe('Route Handlers - View Activity', () => {
  const handler = new ActivityRoutes(activitiesService, prisonService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      params: {
        activityId: '1',
      },
      session: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render page with view activity', async () => {
      const mockActivity = {
        attendanceRequired: false,
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        createdBy: '',
        createdTime: '',
        description: '',
        eligibilityRules: [],
        endDate: toDateString(nextWeek),
        inCell: false,
        outsideWork: false,
        pay: [],
        payPerSession: 'H',
        pieceWork: false,
        prisonCode: '',
        riskLevel: '',
        schedules: [activitySchedule],
        startDate: toDateString(today),
        summary: 'Maths Level 1',
        tier: { code: '', description: '', id: 1 },
        organiser: { id: 1 },
        waitingList: [],
        id: 1,
        minimumEducationLevel: [],
      } as unknown as Activity
      when(activitiesService.getActivity).calledWith(atLeast(1)).mockResolvedValueOnce(mockActivity)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-activities/view-activity', {
        activity: {
          attendanceRequired: false,
          category: { code: 'EDUCATION', id: 1, name: 'Education' },
          createdBy: '',
          createdTime: '',
          description: '',
          eligibilityRules: [],
          inCell: false,
          outsideWork: false,
          pay: [],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [activitySchedule],
          startDate: toDateString(today),
          endDate: toDateString(nextWeek),
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 1 },
          organiser: { id: 1 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        },
        incentiveLevelPays: [],
        displayPays: [],
        schedule: activitySchedule,
        payEditable: true,
        slots: {
          '1': [
            {
              day: 'Monday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Sunday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
          ],
        },
        currentWeek: 1,
        tier: eventTierDescriptions[1],
        organiser: organiserDescriptions[1],
      })
    })

    it('should render page with view activity when the pay is not editable', async () => {
      const mockActivity = {
        attendanceRequired: false,
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        createdBy: '',
        createdTime: '',
        description: '',
        eligibilityRules: [],
        endDate: toDateString(nextWeek),
        inCell: false,
        outsideWork: false,
        pay: [],
        payPerSession: 'H',
        pieceWork: false,
        prisonCode: '',
        riskLevel: '',
        schedules: [activitySchedule],
        startDate: toDateString(today),
        summary: 'Maths Level 1',
        tier: { code: '', description: '', id: 1 },
        organiser: { id: 1 },
        waitingList: [],
        id: 1,
        minimumEducationLevel: [],
      } as unknown as Activity
      mockActivity.schedules[0].activity.paid = false
      when(activitiesService.getActivity).calledWith(atLeast(1)).mockResolvedValueOnce(mockActivity)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-activities/view-activity', {
        activity: {
          attendanceRequired: false,
          category: { code: 'EDUCATION', id: 1, name: 'Education' },
          createdBy: '',
          createdTime: '',
          description: '',
          eligibilityRules: [],
          inCell: false,
          outsideWork: false,
          pay: [],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [activitySchedule],
          startDate: toDateString(today),
          endDate: toDateString(nextWeek),
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 1 },
          organiser: { id: 1 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        },
        displayPays: [],
        incentiveLevelPays: [],
        schedule: activitySchedule,
        payEditable: false,
        slots: {
          '1': [
            {
              day: 'Monday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Sunday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
          ],
        },
        currentWeek: 1,
        tier: eventTierDescriptions[1],
        organiser: organiserDescriptions[1],
      })
    })

    it('should render page with view activity when allocations are all ended', async () => {
      const mockActivity = {
        attendanceRequired: false,
        category: { code: 'EDUCATION', id: 1, name: 'Education' },
        createdBy: '',
        createdTime: '',
        description: '',
        eligibilityRules: [],
        endDate: toDateString(nextWeek),
        inCell: false,
        outsideWork: false,
        pay: [],
        payPerSession: 'H',
        pieceWork: false,
        prisonCode: '',
        riskLevel: '',
        schedules: [activitySchedule],
        startDate: toDateString(today),
        summary: 'Maths Level 1',
        tier: { code: '', description: '', id: 1 },
        organiser: { id: 1 },
        waitingList: [],
        id: 1,
        minimumEducationLevel: [],
      } as unknown as Activity
      mockActivity.schedules[0].activity.paid = false

      const modifiedAllocs: Allocation[] = mockActivity.schedules[0].allocations.map(obj => {
        return { ...obj, status: 'ENDED' }
      })
      mockActivity.schedules[0].allocations = modifiedAllocs

      when(activitiesService.getActivity).calledWith(atLeast(1)).mockResolvedValueOnce(mockActivity)

      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/manage-activities/view-activity', {
        activity: {
          attendanceRequired: false,
          category: { code: 'EDUCATION', id: 1, name: 'Education' },
          createdBy: '',
          createdTime: '',
          description: '',
          eligibilityRules: [],
          inCell: false,
          outsideWork: false,
          pay: [],
          payPerSession: 'H',
          pieceWork: false,
          prisonCode: '',
          riskLevel: '',
          schedules: [activitySchedule],
          startDate: toDateString(today),
          endDate: toDateString(nextWeek),
          summary: 'Maths Level 1',
          tier: { code: '', description: '', id: 1 },
          organiser: { id: 1 },
          waitingList: [],
          id: 1,
          minimumEducationLevel: [],
        },
        displayPays: [],
        incentiveLevelPays: [],
        schedule: activitySchedule,
        payEditable: true,
        slots: {
          '1': [
            {
              day: 'Monday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [
                {
                  endTime: '11:00',
                  startTime: '10:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Thursday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Friday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
            {
              day: 'Sunday',
              slots: [
                {
                  endTime: '12:00',
                  startTime: '11:00',
                  timeSlot: 'AM',
                },
              ],
            },
          ],
        },
        currentWeek: 1,
        tier: eventTierDescriptions[1],
        organiser: organiserDescriptions[1],
      })
    })
  })

  describe('pay is editable', () => {
    it('should return true when schedule activity is paid', async () => {
      const schedule: ActivitySchedule = {
        id: 34,
        usePrisonRegimeTime: true,
        instances: [
          {
            id: 153,
            date: '2024-07-29',
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
          {
            id: 154,
            date: '2024-08-05',
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
        ],
        allocations: [
          {
            id: 25,
            prisonerNumber: 'G2343GK',
            bookingId: 1089295,
            activitySummary: 'pay to unpaid test',
            activityId: 37,
            scheduleId: 34,
            scheduleDescription: 'pay to unpaid test',
            isUnemployment: false,
            prisonPayBand: {
              id: 17,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'RSI',
            },
            startDate: '2024-07-24',
            endDate: '2024-07-24',
            allocatedTime: '2024-07-25T12:05:00',
            allocatedBy: 'DHOUSTON_GEN',
            deallocatedTime: '2024-07-25T12:08:48',
            deallocatedBy: 'DHOUSTON_GEN',
            deallocatedReason: {
              code: 'OTHER',
              description: 'Other',
            },
            suspendedTime: null,
            suspendedBy: null,
            suspendedReason: null,
            status: 'ENDED',
            plannedDeallocation: {
              id: 11,
              plannedDate: '2024-07-24',
              plannedBy: 'DHOUSTON_GEN',
              plannedReason: {
                code: 'OTHER',
                description: 'Other',
              },
              plannedAt: '2024-07-25T12:07:54.761622',
            },
            plannedSuspension: null,
            exclusions: [],
            prisonerName: null,
            prisonerStatus: null,
            prisonerPrisonCode: null,
            cellLocation: null,
            earliestReleaseDate: null,
          },
          {
            id: 26,
            prisonerNumber: 'G9630GL',
            bookingId: 274005,
            activitySummary: 'pay to unpaid test',
            activityId: 37,
            scheduleId: 34,
            scheduleDescription: 'pay to unpaid test',
            isUnemployment: false,
            prisonPayBand: null,
            startDate: '2024-07-24',
            endDate: '2024-07-24',
            allocatedTime: '2024-07-25T12:27:00',
            allocatedBy: 'DHOUSTON_GEN',
            deallocatedTime: '2024-07-25T12:28:28',
            deallocatedBy: 'DHOUSTON_GEN',
            deallocatedReason: {
              code: 'OTHER',
              description: 'Other',
            },
            suspendedTime: null,
            suspendedBy: null,
            suspendedReason: null,
            status: 'ENDED',
            plannedDeallocation: null,
            plannedSuspension: null,
            exclusions: [],
            prisonerName: null,
            prisonerStatus: null,
            prisonerPrisonCode: null,
            cellLocation: null,
            earliestReleaseDate: null,
          },
        ],
        description: 'pay to unpaid test',
        suspensions: [],
        internalLocation: {
          id: 67128,
          code: 'AWING',
          description: 'A WING',
        },
        capacity: 2,
        activity: {
          id: 37,
          prisonCode: 'RSI',
          attendanceRequired: false,
          inCell: false,
          onWing: false,
          offWing: false,
          pieceWork: false,
          outsideWork: false,
          payPerSession: 'H',
          summary: 'pay to unpaid test',
          description: 'pay to unpaid test',
          category: {
            id: 1,
            code: 'SAA_EDUCATION',
            name: 'Education',
            description: 'Such as classes in English, maths, construction or barbering',
          },
          riskLevel: 'low',
          minimumEducationLevel: [],
          endDate: null,
          capacity: 2,
          allocated: 0,
          createdTime: '2024-07-25T12:05:28',
          activityState: 'LIVE',
          paid: true,
        },
        scheduleWeeks: 1,
        slots: [
          {
            id: 33,
            timeSlot: 'AM',
            weekNumber: 1,
            startTime: '08:30',
            endTime: '11:45',
            daysOfWeek: ['Mon'],
            mondayFlag: true,
            tuesdayFlag: false,
            wednesdayFlag: false,
            thursdayFlag: false,
            fridayFlag: false,
            saturdayFlag: false,
            sundayFlag: false,
          },
        ],
        startDate: '2024-07-24',
        endDate: null,
        runsOnBankHoliday: false,
        updatedTime: '2024-07-25T12:26:28',
        updatedBy: 'DHOUSTON_GEN',
      }

      expect(editPay(schedule)).toBe(true)
    })

    it('should return true when schedule not paid and allocations are all ended', async () => {
      const schedule: ActivitySchedule = {
        id: 34,
        usePrisonRegimeTime: true,
        instances: [
          {
            id: 153,
            date: '2024-07-29',
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
          {
            id: 154,
            date: '2024-08-05',
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
        ],
        allocations: [
          {
            id: 25,
            prisonerNumber: 'G2343GK',
            bookingId: 1089295,
            activitySummary: 'pay to unpaid test',
            activityId: 37,
            scheduleId: 34,
            scheduleDescription: 'pay to unpaid test',
            isUnemployment: false,
            prisonPayBand: {
              id: 17,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'RSI',
            },
            startDate: '2024-07-24',
            endDate: '2024-07-24',
            allocatedTime: '2024-07-25T12:05:00',
            allocatedBy: 'DHOUSTON_GEN',
            deallocatedTime: '2024-07-25T12:08:48',
            deallocatedBy: 'DHOUSTON_GEN',
            deallocatedReason: {
              code: 'OTHER',
              description: 'Other',
            },
            suspendedTime: null,
            suspendedBy: null,
            suspendedReason: null,
            status: 'ENDED',
            plannedDeallocation: {
              id: 11,
              plannedDate: '2024-07-24',
              plannedBy: 'DHOUSTON_GEN',
              plannedReason: {
                code: 'OTHER',
                description: 'Other',
              },
              plannedAt: '2024-07-25T12:07:54.761622',
            },
            plannedSuspension: null,
            exclusions: [],
            prisonerName: null,
            prisonerStatus: null,
            prisonerPrisonCode: null,
            cellLocation: null,
            earliestReleaseDate: null,
          },
          {
            id: 26,
            prisonerNumber: 'G9630GL',
            bookingId: 274005,
            activitySummary: 'pay to unpaid test',
            activityId: 37,
            scheduleId: 34,
            scheduleDescription: 'pay to unpaid test',
            isUnemployment: false,
            prisonPayBand: null,
            startDate: '2024-07-24',
            endDate: '2024-07-24',
            allocatedTime: '2024-07-25T12:27:00',
            allocatedBy: 'DHOUSTON_GEN',
            deallocatedTime: '2024-07-25T12:28:28',
            deallocatedBy: 'DHOUSTON_GEN',
            deallocatedReason: {
              code: 'OTHER',
              description: 'Other',
            },
            suspendedTime: null,
            suspendedBy: null,
            suspendedReason: null,
            status: 'ENDED',
            plannedDeallocation: null,
            plannedSuspension: null,
            exclusions: [],
            prisonerName: null,
            prisonerStatus: null,
            prisonerPrisonCode: null,
            cellLocation: null,
            earliestReleaseDate: null,
          },
        ],
        description: 'pay to unpaid test',
        suspensions: [],
        internalLocation: {
          id: 67128,
          code: 'AWING',
          description: 'A WING',
        },
        capacity: 2,
        activity: {
          id: 37,
          prisonCode: 'RSI',
          attendanceRequired: false,
          inCell: false,
          onWing: false,
          offWing: false,
          pieceWork: false,
          outsideWork: false,
          payPerSession: 'H',
          summary: 'pay to unpaid test',
          description: 'pay to unpaid test',
          category: {
            id: 1,
            code: 'SAA_EDUCATION',
            name: 'Education',
            description: 'Such as classes in English, maths, construction or barbering',
          },
          riskLevel: 'low',
          minimumEducationLevel: [],
          endDate: null,
          capacity: 2,
          allocated: 0,
          createdTime: '2024-07-25T12:05:28',
          activityState: 'LIVE',
          paid: false,
        },
        scheduleWeeks: 1,
        slots: [
          {
            id: 33,
            timeSlot: 'AM',
            weekNumber: 1,
            startTime: '08:30',
            endTime: '11:45',
            daysOfWeek: ['Mon'],
            mondayFlag: true,
            tuesdayFlag: false,
            wednesdayFlag: false,
            thursdayFlag: false,
            fridayFlag: false,
            saturdayFlag: false,
            sundayFlag: false,
          },
        ],
        startDate: '2024-07-24',
        endDate: null,
        runsOnBankHoliday: false,
        updatedTime: '2024-07-25T12:26:28',
        updatedBy: 'DHOUSTON_GEN',
      }

      expect(editPay(schedule)).toBe(true)
    })

    it('should return false when schedule activity is not paid and not all allocations are ended', async () => {
      const schedule: ActivitySchedule = {
        id: 34,
        usePrisonRegimeTime: true,
        instances: [
          {
            id: 153,
            date: '2024-07-29',
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
          {
            id: 154,
            date: '2024-08-05',
            startTime: '08:30',
            endTime: '11:45',
            timeSlot: 'AM',
            cancelled: false,
            cancelledTime: null,
            cancelledBy: null,
            attendances: [],
          },
        ],
        allocations: [
          {
            id: 25,
            prisonerNumber: 'G2343GK',
            bookingId: 1089295,
            activitySummary: 'pay to unpaid test',
            activityId: 37,
            scheduleId: 34,
            scheduleDescription: 'pay to unpaid test',
            isUnemployment: false,
            prisonPayBand: {
              id: 17,
              displaySequence: 1,
              alias: 'Pay band 1 (Lowest)',
              description: 'Pay band 1 (Lowest)',
              nomisPayBand: 1,
              prisonCode: 'RSI',
            },
            startDate: '2024-07-24',
            endDate: '2024-07-24',
            allocatedTime: '2024-07-25T12:05:00',
            allocatedBy: 'DHOUSTON_GEN',
            deallocatedTime: '2024-07-25T12:08:48',
            deallocatedBy: 'DHOUSTON_GEN',
            deallocatedReason: {
              code: 'OTHER',
              description: 'Other',
            },
            suspendedTime: null,
            suspendedBy: null,
            suspendedReason: null,
            status: 'ENDED',
            plannedDeallocation: {
              id: 11,
              plannedDate: '2024-07-24',
              plannedBy: 'DHOUSTON_GEN',
              plannedReason: {
                code: 'OTHER',
                description: 'Other',
              },
              plannedAt: '2024-07-25T12:07:54.761622',
            },
            plannedSuspension: null,
            exclusions: [],
            prisonerName: null,
            prisonerStatus: null,
            prisonerPrisonCode: null,
            cellLocation: null,
            earliestReleaseDate: null,
          },
          {
            id: 26,
            prisonerNumber: 'G9630GL',
            bookingId: 274005,
            activitySummary: 'pay to unpaid test',
            activityId: 37,
            scheduleId: 34,
            scheduleDescription: 'pay to unpaid test',
            isUnemployment: false,
            prisonPayBand: null,
            startDate: '2024-07-24',
            endDate: '2024-07-24',
            allocatedTime: '2024-07-25T12:27:00',
            allocatedBy: 'DHOUSTON_GEN',
            deallocatedTime: '2024-07-25T12:28:28',
            deallocatedBy: 'DHOUSTON_GEN',
            deallocatedReason: {
              code: 'OTHER',
              description: 'Other',
            },
            suspendedTime: null,
            suspendedBy: null,
            suspendedReason: null,
            status: 'ACTIVE',
            plannedDeallocation: null,
            plannedSuspension: null,
            exclusions: [],
            prisonerName: null,
            prisonerStatus: null,
            prisonerPrisonCode: null,
            cellLocation: null,
            earliestReleaseDate: null,
          },
        ],
        description: 'pay to unpaid test',
        suspensions: [],
        internalLocation: {
          id: 67128,
          code: 'AWING',
          description: 'A WING',
        },
        capacity: 2,
        activity: {
          id: 37,
          prisonCode: 'RSI',
          attendanceRequired: false,
          inCell: false,
          onWing: false,
          offWing: false,
          pieceWork: false,
          outsideWork: false,
          payPerSession: 'H',
          summary: 'pay to unpaid test',
          description: 'pay to unpaid test',
          category: {
            id: 1,
            code: 'SAA_EDUCATION',
            name: 'Education',
            description: 'Such as classes in English, maths, construction or barbering',
          },
          riskLevel: 'low',
          minimumEducationLevel: [],
          endDate: null,
          capacity: 2,
          allocated: 0,
          createdTime: '2024-07-25T12:05:28',
          activityState: 'LIVE',
          paid: false,
        },
        scheduleWeeks: 1,
        slots: [
          {
            id: 33,
            timeSlot: 'AM',
            weekNumber: 1,
            startTime: '08:30',
            endTime: '11:45',
            daysOfWeek: ['Mon'],
            mondayFlag: true,
            tuesdayFlag: false,
            wednesdayFlag: false,
            thursdayFlag: false,
            fridayFlag: false,
            saturdayFlag: false,
            sundayFlag: false,
          },
        ],
        startDate: '2024-07-24',
        endDate: null,
        runsOnBankHoliday: false,
        updatedTime: '2024-07-25T12:26:28',
        updatedBy: 'DHOUSTON_GEN',
      }

      expect(editPay(schedule)).toBe(false)
    })
  })
})
