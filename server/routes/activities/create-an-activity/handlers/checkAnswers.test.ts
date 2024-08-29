import { Request, Response } from 'express'

import { when } from 'jest-when'
import ActivitiesService from '../../../../services/activitiesService'
import CheckAnswersRoutes from './checkAnswers'
import activity from '../../../../services/fixtures/activity_1.json'
import atLeast from '../../../../../jest.setup'
import PrisonService from '../../../../services/prisonService'
import { Activity, PrisonRegime, Slot } from '../../../../@types/activitiesAPI/types'
import { regimeSlotsToSchedule } from '../../../../utils/helpers/activityTimeSlotMappers'
import EventTier, { eventTierDescriptions } from '../../../../enum/eventTiers'
import Organiser, { organiserDescriptions } from '../../../../enum/eventOrganisers'
import MetricsService from '../../../../services/metricsService'
import MetricsEvent from '../../../../data/metricsEvent'
import TimeSlot from '../../../../enum/timeSlot'

jest.mock('../../../../services/activitiesService')
jest.mock('../../../../services/prisonService')
jest.mock('../../../../services/metricsService')
jest.mock('../../../../utils/helpers/incentiveLevelPayMappingUtil', () => {
  return function factory() {
    return {
      getPayGroupedByIncentiveLevel: () => [
        {
          incentiveLevel: 'Standard',
          pays: [{ incentiveLevel: 'Standard', bandId: 1, bandAlias: 'Common', rate: '150' }],
        },
      ],
    }
  }
})

const activitiesService = new ActivitiesService(null) as jest.Mocked<ActivitiesService>
const prisonService = new PrisonService(null, null, null) as jest.Mocked<PrisonService>
const metricsService = new MetricsService(null) as jest.Mocked<MetricsService>

describe('Route Handlers - Create an activity - Check answers', () => {
  const handler = new CheckAnswersRoutes(activitiesService, prisonService, metricsService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {
          username: 'joebloggs',
          activeCaseLoadId: 'MDI',
        },
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {
        createJourney: {
          name: 'Maths level 1',
          category: {
            id: 1,
          },
          tierCode: EventTier.TIER_1,
          organiserCode: Organiser.PRISONER,
          riskLevel: 'High',
          paid: true,
          pay: [{ incentiveLevel: 'Standard', prisonPayBand: { id: 1 }, rate: 100 }],
          incentiveLevels: ['Standard', 'Enhanced'],
          educationLevels: [{ educationLevelCode: '1', educationLevelDescription: 'xxx' }],
          startDate: '2023-01-17',
          endDateOption: 'yes',
          endDate: '2023-01-18',
          scheduleWeeks: 1,
          slots: {
            '1': {
              days: ['tuesday', 'friday'],
              timeSlotsTuesday: ['AM'],
              timeSlotsFriday: ['PM', 'ED'],
            },
          },
          location: {
            id: 26149,
            name: 'Gym',
          },
          capacity: 12,
        },
      },
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    const regimeTimes = [
      {
        id: 1,
        dayOfWeek: 'MONDAY',
        prisonCode: 'RSI',
        amStart: '09:00',
        amFinish: '10:00',
        pmStart: '12:00',
        pmFinish: '13:00',
        edStart: '17:00',
        edFinish: '18:00',
      },
      {
        id: 1,
        dayOfWeek: 'TUESDAY',
        prisonCode: 'RSI',
        amStart: '09:00',
        amFinish: '10:00',
        pmStart: '12:00',
        pmFinish: '13:00',
        edStart: '17:00',
        edFinish: '18:00',
      },
      {
        id: 1,
        dayOfWeek: 'WEDNESDAY',
        prisonCode: 'RSI',
        amStart: '09:00',
        amFinish: '10:00',
        pmStart: '12:00',
        pmFinish: '13:00',
        edStart: '17:00',
        edFinish: '18:00',
      },
      {
        id: 1,
        dayOfWeek: 'THURSDAY',
        prisonCode: 'RSI',
        amStart: '09:00',
        amFinish: '10:00',
        pmStart: '12:00',
        pmFinish: '13:00',
        edStart: '17:00',
        edFinish: '18:00',
      },
      {
        id: 1,
        dayOfWeek: 'FRIDAY',
        prisonCode: 'RSI',
        amStart: '10:00',
        amFinish: '11:00',
        pmStart: '12:00',
        pmFinish: '13:00',
        edStart: '17:00',
        edFinish: '18:00',
      },
      {
        id: 1,
        dayOfWeek: 'SATURDAY',
        prisonCode: 'RSI',
        amStart: '10:00',
        amFinish: '11:00',
        pmStart: '12:00',
        pmFinish: '13:00',
        edStart: '17:00',
        edFinish: '18:00',
      },
      {
        id: 1,
        dayOfWeek: 'SUNDAY',
        prisonCode: 'RSI',
        amStart: '10:00',
        amFinish: '11:00',
        pmStart: '12:00',
        pmFinish: '13:00',
        edStart: '17:00',
        edFinish: '18:00',
      },
    ] as PrisonRegime[]

    beforeEach(() => {
      when(activitiesService.getPrisonRegime).calledWith(atLeast('MDI')).mockResolvedValueOnce(regimeTimes)
    })

    it('should render page with data from session', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/check-answers', {
        incentiveLevelPays: [
          {
            incentiveLevel: 'Standard',
            pays: [{ bandAlias: 'Common', bandId: 1, incentiveLevel: 'Standard', rate: '150' }],
          },
        ],
        slots: regimeSlotsToSchedule(
          req.session.createJourney.scheduleWeeks,
          req.session.createJourney.slots,
          regimeTimes,
        ),
        organiser: organiserDescriptions[req.session.createJourney.organiserCode],
        tier: eventTierDescriptions[req.session.createJourney.tierCode],
      })
    })

    it('should render page with data from session when there are custom slots', async () => {
      const customSlots: Slot[] = [
        {
          customStartTime: '09:00',
          customEndTime: '11:00',
          daysOfWeek: ['TUESDAY'],
          friday: false,
          monday: false,
          saturday: false,
          sunday: false,
          thursday: false,
          timeSlot: TimeSlot.AM,
          tuesday: true,
          wednesday: false,
          weekNumber: 1,
        },
        {
          customStartTime: '13:00',
          customEndTime: '15:00',
          daysOfWeek: ['FRIDAY'],
          friday: false,
          monday: false,
          saturday: false,
          sunday: false,
          thursday: false,
          timeSlot: TimeSlot.PM,
          tuesday: true,
          wednesday: false,
          weekNumber: 1,
        },
        {
          customStartTime: '19:00',
          customEndTime: '21:00',
          daysOfWeek: ['FRIDAY'],
          friday: false,
          monday: false,
          saturday: false,
          sunday: false,
          thursday: false,
          timeSlot: TimeSlot.ED,
          tuesday: true,
          wednesday: false,
          weekNumber: 1,
        },
      ]

      req.session.createJourney.customSlots = customSlots

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/create-an-activity/check-answers', {
        incentiveLevelPays: [
          {
            incentiveLevel: 'Standard',
            pays: [{ bandAlias: 'Common', bandId: 1, incentiveLevel: 'Standard', rate: '150' }],
          },
        ],
        slots: {
          '1': [
            {
              day: 'Monday',
              slots: [],
            },
            {
              day: 'Tuesday',
              slots: [
                {
                  startTime: '09:00',
                  endTime: '11:00',
                  timeSlot: TimeSlot.AM,
                },
              ],
            },
            {
              day: 'Wednesday',
              slots: [],
            },
            {
              day: 'Thursday',
              slots: [],
            },
            {
              day: 'Friday',
              slots: [
                {
                  startTime: '13:00',
                  endTime: '15:00',
                  timeSlot: TimeSlot.PM,
                },
                {
                  startTime: '19:00',
                  endTime: '21:00',
                  timeSlot: TimeSlot.ED,
                },
              ],
            },
            {
              day: 'Saturday',
              slots: [],
            },
            {
              day: 'Sunday',
              slots: [],
            },
          ],
        },
        organiser: organiserDescriptions[req.session.createJourney.organiserCode],
        tier: eventTierDescriptions[req.session.createJourney.tierCode],
      })
    })
  })

  describe('POST', () => {
    it('should create the activity and redirect to confirmation page', async () => {
      const expectedActivity = {
        prisonCode: 'MDI',
        summary: 'Maths level 1',
        categoryId: 1,
        tierCode: EventTier.TIER_1,
        organiserCode: Organiser.PRISONER,
        riskLevel: 'High',
        minimumEducationLevel: [{ educationLevelCode: '1', educationLevelDescription: 'xxx' }],
        paid: true,
        pay: [{ incentiveLevel: 'Standard', payBandId: 1, rate: 100 }],
        description: 'Maths level 1',
        startDate: '2023-01-17',
        endDate: '2023-01-18',
        locationId: 26149,
        capacity: 12,
        scheduleWeeks: 1,
        slots: [
          { weekNumber: 1, timeSlot: 'AM', tuesday: true },
          { weekNumber: 1, timeSlot: 'PM', friday: true },
          { weekNumber: 1, timeSlot: 'ED', friday: true },
        ],
      }

      when(activitiesService.createActivity)
        .calledWith(atLeast(expectedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      await handler.POST(req, res)
      expect(activitiesService.createActivity).toHaveBeenCalledWith(expectedActivity, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/1')
    })

    it('should create the activity with custom time slots and redirect to confirmation page', async () => {
      const reqWithCustomSlots = {
        session: {
          createJourney: {
            name: 'Maths level 1',
            category: {
              id: 1,
            },
            tierCode: EventTier.TIER_1,
            organiserCode: Organiser.PRISONER,
            riskLevel: 'High',
            paid: true,
            pay: [{ incentiveLevel: 'Standard', prisonPayBand: { id: 1 }, rate: 100 }],
            incentiveLevels: ['Standard', 'Enhanced'],
            educationLevels: [{ educationLevelCode: '1', educationLevelDescription: 'xxx' }],
            startDate: '2023-01-17',
            endDateOption: 'yes',
            endDate: '2023-01-18',
            scheduleWeeks: 1,
            customSlots: [
              {
                customStartTime: '09:15',
                customEndTime: '11:30',
                daysOfWeek: ['MONDAY'],
                friday: false,
                monday: true,
                saturday: false,
                sunday: false,
                thursday: false,
                timeSlot: 'AM',
                tuesday: false,
                wednesday: false,
                weekNumber: 1,
              },
              {
                customStartTime: '18:15',
                customEndTime: '21:45',
                daysOfWeek: ['TUESDAY'],
                friday: false,
                monday: false,
                saturday: false,
                sunday: false,
                thursday: false,
                timeSlot: 'ED',
                tuesday: true,
                wednesday: false,
                weekNumber: 1,
              },
            ],
            location: {
              id: 26149,
              name: 'Gym',
            },
            capacity: 12,
          },
        },
      } as unknown as Request

      const expectedActivity = {
        prisonCode: 'MDI',
        summary: 'Maths level 1',
        categoryId: 1,
        tierCode: EventTier.TIER_1,
        organiserCode: Organiser.PRISONER,
        riskLevel: 'High',
        minimumEducationLevel: [{ educationLevelCode: '1', educationLevelDescription: 'xxx' }],
        paid: true,
        pay: [{ incentiveLevel: 'Standard', payBandId: 1, rate: 100 }],
        description: 'Maths level 1',
        startDate: '2023-01-17',
        endDate: '2023-01-18',
        locationId: 26149,
        capacity: 12,
        scheduleWeeks: 1,
        slots: [
          {
            customStartTime: '09:15',
            customEndTime: '11:30',
            daysOfWeek: ['MONDAY'],
            friday: false,
            monday: true,
            saturday: false,
            sunday: false,
            thursday: false,
            timeSlot: 'AM',
            tuesday: false,
            wednesday: false,
            weekNumber: 1,
          },
          {
            customStartTime: '18:15',
            customEndTime: '21:45',
            daysOfWeek: ['TUESDAY'],
            friday: false,
            monday: false,
            saturday: false,
            sunday: false,
            thursday: false,
            timeSlot: 'ED',
            tuesday: true,
            wednesday: false,
            weekNumber: 1,
          },
        ],
      }

      when(activitiesService.createActivity)
        .calledWith(atLeast(expectedActivity))
        .mockResolvedValueOnce(activity as unknown as Activity)

      await handler.POST(reqWithCustomSlots, res)
      expect(activitiesService.createActivity).toHaveBeenCalledWith(expectedActivity, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/1')
    })

    it('should create the activity when no education levels selected', async () => {
      const expectedActivity = {
        prisonCode: 'MDI',
        summary: 'Maths level 1',
        categoryId: 1,
        tierCode: EventTier.TIER_1,
        organiserCode: Organiser.PRISONER,
        riskLevel: 'High',
        paid: true,
        pay: [{ incentiveLevel: 'Standard', payBandId: 1, rate: 100 }],
        description: 'Maths level 1',
        startDate: '2023-01-17',
        endDate: '2023-01-18',
        locationId: 26149,
        capacity: 12,
        scheduleWeeks: 1,
        slots: [
          { weekNumber: 1, timeSlot: 'AM', tuesday: true },
          { weekNumber: 1, timeSlot: 'PM', friday: true },
          { weekNumber: 1, timeSlot: 'ED', friday: true },
        ],
      }

      req.session.createJourney.educationLevels = undefined

      when(activitiesService.createActivity)
        .calledWith(atLeast(expectedActivity))
        .mockResolvedValue(activity as unknown as Activity)

      await handler.POST(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_ACTIVITY_JOURNEY_COMPLETED(res.locals.user).addJourneyCompletedMetrics(req),
      )
      expect(activitiesService.createActivity).toHaveBeenCalledWith(expectedActivity, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/1')
    })

    it('should create the activity record when tier is foundation and attendance required is true', async () => {
      const expectedActivity = {
        prisonCode: 'MDI',
        summary: 'Maths level 1',
        categoryId: 1,
        tierCode: EventTier.FOUNDATION,
        attendanceRequired: true,
        riskLevel: 'High',
        paid: true,
        pay: [{ incentiveLevel: 'Standard', payBandId: 1, rate: 100 }],
        description: 'Maths level 1',
        startDate: '2023-01-17',
        endDate: '2023-01-18',
        locationId: 26149,
        capacity: 12,
        scheduleWeeks: 1,
        slots: [
          { weekNumber: 1, timeSlot: 'AM', tuesday: true },
          { weekNumber: 1, timeSlot: 'PM', friday: true },
          { weekNumber: 1, timeSlot: 'ED', friday: true },
        ],
      }

      req.session.createJourney.organiserCode = undefined
      req.session.createJourney.educationLevels = undefined
      req.session.createJourney.tierCode = EventTier.FOUNDATION
      req.session.createJourney.attendanceRequired = true

      when(activitiesService.createActivity)
        .calledWith(atLeast(expectedActivity))
        .mockResolvedValue(activity as unknown as Activity)

      await handler.POST(req, res)

      expect(metricsService.trackEvent).toHaveBeenCalledWith(
        MetricsEvent.CREATE_ACTIVITY_JOURNEY_COMPLETED(res.locals.user).addJourneyCompletedMetrics(req),
      )
      expect(activitiesService.createActivity).toHaveBeenCalledWith(expectedActivity, res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('confirmation/1')
    })
  })
})
