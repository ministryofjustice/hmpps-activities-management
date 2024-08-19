import getApplicableDaysAndSlotsInRegime from './applicableRegimeTimeUtil'
import { PrisonRegime } from '../../@types/activitiesAPI/types'

const prisonRegime: PrisonRegime[] = [
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'MONDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'TUESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'WEDNESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'THURSDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'FRIDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SATURDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SUNDAY',
  },
]

const prisonRegime2: PrisonRegime[] = [
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'MONDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'TUESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'WEDNESDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '08:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'THURSDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '09:30',
    amFinish: '11:45',
    pmStart: '13:45',
    pmFinish: '16:45',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'FRIDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '10:30',
    amFinish: '11:45',
    pmStart: '14:00',
    pmFinish: '16:00',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SATURDAY',
  },
  {
    id: 3,
    prisonCode: 'RSI',
    amStart: '10:30',
    amFinish: '11:45',
    pmStart: '14:00',
    pmFinish: '16:00',
    edStart: '17:30',
    edFinish: '19:15',
    dayOfWeek: 'SUNDAY',
  },
]

describe('Returns only the days and times that are required for the activity', () => {
  it('Monday to Friday AM and PM', () => {
    const activityDaysAndSlots = {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeSlotsMonday: ['AM', 'PM'],
      timeSlotsTuesday: ['AM', 'PM'],
      timeSlotsWednesday: ['AM', 'PM'],
      timeSlotsThursday: ['AM', 'PM'],
      timeSlotsFriday: ['AM', 'PM'],
      timeSlotsSaturday: [] as string[],
      timeSlotsSunday: [] as string[],
    }
    const result = getApplicableDaysAndSlotsInRegime(prisonRegime, activityDaysAndSlots)
    expect(result).toEqual([
      {
        dayOfWeek: 'MONDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'TUESDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'THURSDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'FRIDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
    ])
  })
  it('Monday to Friday just AM', () => {
    const activityDaysAndSlots = {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeSlotsMonday: ['AM'],
      timeSlotsTuesday: ['AM'],
      timeSlotsWednesday: ['AM'],
      timeSlotsThursday: ['AM'],
      timeSlotsFriday: ['AM'],
      timeSlotsSaturday: [] as string[],
      timeSlotsSunday: [] as string[],
    }
    const result = getApplicableDaysAndSlotsInRegime(prisonRegime, activityDaysAndSlots)
    expect(result).toEqual([
      {
        dayOfWeek: 'MONDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
      {
        dayOfWeek: 'TUESDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
      {
        dayOfWeek: 'THURSDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
      {
        dayOfWeek: 'FRIDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
    ])
  })
  it('Monday, Wednesday and Friday AM', () => {
    const activityDaysAndSlots = {
      days: ['monday', 'wednesday', 'friday'],
      timeSlotsMonday: ['AM'],
      timeSlotsTuesday: [] as string[],
      timeSlotsWednesday: ['AM'],
      timeSlotsThursday: [] as string[],
      timeSlotsFriday: ['AM'],
      timeSlotsSaturday: [] as string[],
      timeSlotsSunday: [] as string[],
    }
    const result = getApplicableDaysAndSlotsInRegime(prisonRegime, activityDaysAndSlots)
    expect(result).toEqual([
      {
        dayOfWeek: 'MONDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
      {
        dayOfWeek: 'FRIDAY',
        amStart: '08:30',
        amFinish: '11:45',
      },
    ])
  })
  it('Monday to Thursday and different Friday', () => {
    const activityDaysAndSlots = {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeSlotsMonday: ['AM', 'PM'],
      timeSlotsTuesday: ['AM', 'PM'],
      timeSlotsWednesday: ['AM', 'PM'],
      timeSlotsThursday: ['AM', 'PM'],
      timeSlotsFriday: ['AM', 'PM'],
      timeSlotsSaturday: [] as string[],
      timeSlotsSunday: [] as string[],
    }
    const result = getApplicableDaysAndSlotsInRegime(prisonRegime2, activityDaysAndSlots)
    expect(result).toEqual([
      {
        dayOfWeek: 'MONDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'TUESDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'THURSDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
      },
      {
        dayOfWeek: 'FRIDAY',
        amStart: '09:30',
        amFinish: '11:45',
        pmFinish: '16:45',
        pmStart: '13:45',
      },
    ])
  })
  it('Weekend activities', () => {
    const activityDaysAndSlots = {
      days: ['saturday', 'sunday'],
      timeSlotsMonday: [] as string[],
      timeSlotsTuesday: [] as string[],
      timeSlotsWednesday: [] as string[],
      timeSlotsThursday: [] as string[],
      timeSlotsFriday: [] as string[],
      timeSlotsSaturday: ['AM', 'PM', 'ED'],
      timeSlotsSunday: ['AM', 'PM', 'ED'],
    }
    const result = getApplicableDaysAndSlotsInRegime(prisonRegime, activityDaysAndSlots)
    expect(result).toEqual([
      {
        dayOfWeek: 'SATURDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
        edStart: '17:30',
        edFinish: '19:15',
      },
      {
        dayOfWeek: 'SUNDAY',
        amStart: '08:30',
        amFinish: '11:45',
        pmStart: '13:45',
        pmFinish: '16:45',
        edStart: '17:30',
        edFinish: '19:15',
      },
    ])
  })
})
