import { JourneyData } from '../../../../server/@types/express'
import { ActivityPay } from '../../../../server/@types/activitiesAPI/types'

const activityJourney: JourneyData = {
  createJourney: {
    activityId: 2,
    scheduleId: 2,
    category: { id: 1, code: 'SAA_EDUCATION', name: 'Education' },
    name: 'English level 1',
    tierCode: 'TIER_1',
    organiserCode: 'PRISON_STAFF',
    riskLevel: 'low',
    incentiveLevel: 'Standard',
    attendanceRequired: true,
    paid: true,
    pay: [
      {
        incentiveLevel: 'Standard',
        incentiveNomisCode: 'STD',
        rate: 100,
        prisonPayBand: { id: 11, alias: 'Low', displaySequence: 1 },
      },
    ] as ActivityPay[],
    payChange: [],
    flat: [],
    allocations: [],
    educationLevels: [],
    startDate: '2023-01-01',
    endDate: '2030-12-31',
    scheduleWeeks: 1,
    slots: { '1': { days: ['monday'], timeSlotsMonday: ['AM'] } },
    baselineSlots: [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY'],
      },
    ],
    currentEditingWeek: '1',
    location: { id: 'd7f5c7d0-4a9b-4c28-a12b-53cc8fde2bf0', name: 'Classroom' },
    currentCapacity: 10,
    capacity: 5,
    runsOnBankHoliday: false,
    outsideWork: false,
    whoPays: 'prison',
  },
}

activityJourney.createJourney.futureSameDaySlots = activityJourney.createJourney.baselineSlots
activityJourney.createJourney.allSameDaySlots = activityJourney.createJourney.baselineSlots

export default activityJourney
