import getFutureSameDaySlots, { getAllSameDaySlots } from './futureSameDaySlots'
import { ActivitySchedule, Slot } from '../../@types/activitiesAPI/types'

describe('getFutureSameDaySlots', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-24T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return future slots in current week', () => {
    // Tuesday, April 21, 2026
    jest.setSystemTime(new Date('2026-04-21T10:00:00'))

    const schedule = {
      // Monday, April 20, 2026
      startDate: '2026-04-20',
      scheduleWeeks: 2,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Tue'],
        },
        {
          weekNumber: 1,
          timeSlot: 'ED',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Tue'],
        },
        {
          weekNumber: 2,
          timeSlot: 'AM',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['TUESDAY'],
        monday: false,
        tuesday: true,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['TUESDAY'],
        monday: false,
        tuesday: true,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(2)
    expect(result.map((s: Slot) => s.timeSlot).sort()).toEqual(['ED', 'PM'])
  })

  it('should exclude previous week slots when in later week', () => {
    // Monday, April 20, 2026
    jest.setSystemTime(new Date('2026-04-20T10:00:00'))

    const schedule = {
      // Sunday, April 19, 2026
      startDate: '2026-04-19',
      scheduleWeeks: 2,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'ED',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Mon'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Sun'],
        },
        {
          weekNumber: 2,
          timeSlot: 'ED',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Mon'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['SUNDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: true,
      },
      {
        weekNumber: 2,
        timeSlot: 'ED',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result[0].timeSlot).toBe('ED')
    expect(result[0].weekNumber).toBe(2)
  })

  it('should exclude week 1 slots when in week 2', () => {
    // Monday, April 27, 2026
    jest.setSystemTime(new Date('2026-04-27T10:00:00'))

    const schedule = {
      // Monday, April 20, 2026
      startDate: '2026-04-20',
      scheduleWeeks: 2,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Mon'],
        },
        {
          weekNumber: 2,
          timeSlot: 'ED',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Mon'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 2,
        timeSlot: 'ED',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result[0].timeSlot).toBe('ED')
  })

  it('should exclude slots that do not occur today', () => {
    // Friday, April 24, 2026
    jest.setSystemTime(new Date('2026-04-24T10:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 2,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:30',
          endTime: '11:45',
          daysOfWeek: ['Mon'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Fri'],
        },
        {
          weekNumber: 2,
          timeSlot: 'ED',
          startTime: '19:00',
          endTime: '21:00',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result[0].timeSlot).toBe('PM')
  })

  it('should exclude slots with start times in the past', () => {
    // Friday, April 24, 2026
    jest.setSystemTime(new Date('2026-04-24T10:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 2,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:30',
          endTime: '11:45',
          daysOfWeek: ['Fri'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result[0].timeSlot).toBe('PM')
  })

  it('should return empty array when no slots match', () => {
    // Friday, April 24, 2026
    jest.setSystemTime(new Date('2026-04-24T10:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 2,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:30',
          endTime: '11:45',
          daysOfWeek: ['Mon'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 2,
        timeSlot: 'AM',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toEqual([])
  })

  it('should return future slots for single week schedule', () => {
    // Thursday, April 23, 2026
    jest.setSystemTime(new Date('2026-04-23T10:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 1,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:00',
          endTime: '11:00',
          daysOfWeek: ['Thu'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Thu'],
        },
        {
          weekNumber: 1,
          timeSlot: 'ED',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Thu'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        daysOfWeek: ['THURSDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['THURSDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result.map((s: Slot) => s.timeSlot).sort()).toEqual(['ED'])
  })

  it('should filter daysOfWeek to only include today', () => {
    // Friday, April 24, 2026, at 12:00
    jest.setSystemTime(new Date('2026-04-24T12:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 1,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['THURSDAY', 'FRIDAY', 'SATURDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result[0].daysOfWeek).toEqual(['FRIDAY'])
  })

  it('should use customStartTime if available', () => {
    // Friday, April 24, 2026
    jest.setSystemTime(new Date('2026-04-24T14:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 1,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        customStartTime: '15:30',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getFutureSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
  })
})

describe('getAllSameDaySlots', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-24T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return all slots that occur today (past and future)', () => {
    // Friday, April 24, 2026
    jest.setSystemTime(new Date('2026-04-24T14:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 1,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:30',
          endTime: '11:45',
          daysOfWeek: ['Fri'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Fri'],
        },
        {
          weekNumber: 1,
          timeSlot: 'ED',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getAllSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(3)
    expect(result.map((s: Slot) => s.timeSlot).sort()).toEqual(['AM', 'ED', 'PM'])
  })

  it('should exclude slots not in current week', () => {
    // Monday, April 27, 2026
    jest.setSystemTime(new Date('2026-04-27T10:00:00'))

    const schedule = {
      // Monday, April 20, 2026
      startDate: '2026-04-20',
      scheduleWeeks: 2,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Mon'],
        },
        {
          weekNumber: 2,
          timeSlot: 'ED',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Mon'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 2,
        timeSlot: 'ED',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getAllSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result[0].timeSlot).toBe('ED')
    expect(result[0].weekNumber).toBe(2)
  })

  it('should exclude slots that do not occur today', () => {
    // Friday, April 24, 2026
    jest.setSystemTime(new Date('2026-04-24T10:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 1,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:30',
          endTime: '11:45',
          daysOfWeek: ['Mon'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getAllSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(1)
    expect(result[0].timeSlot).toBe('PM')
    // Verify daysOfWeek is filtered to only today
    expect(result[0].daysOfWeek).toEqual(['FRIDAY'])
  })

  it('should return empty array when no slots match', () => {
    // Friday, April 24, 2026
    jest.setSystemTime(new Date('2026-04-24T10:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 1,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:30',
          endTime: '11:45',
          daysOfWeek: ['Mon'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 2,
        timeSlot: 'AM',
        daysOfWeek: ['MONDAY'],
        monday: true,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getAllSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toEqual([])
  })

  it('should return slots regardless of start time (key difference from getFutureSameDaySlots)', () => {
    // Friday, April 24, 2026, at 14:00 (afternoon)
    jest.setSystemTime(new Date('2026-04-24T14:00:00'))

    const schedule = {
      // Thursday, April 23, 2026
      startDate: '2026-04-23',
      scheduleWeeks: 1,
      slots: [
        {
          weekNumber: 1,
          timeSlot: 'AM',
          startTime: '08:30',
          endTime: '11:45',
          daysOfWeek: ['Fri'],
        },
        {
          weekNumber: 1,
          timeSlot: 'PM',
          startTime: '13:00',
          endTime: '17:00',
          daysOfWeek: ['Fri'],
        },
        {
          weekNumber: 1,
          timeSlot: 'ED',
          startTime: '18:00',
          endTime: '20:30',
          daysOfWeek: ['Fri'],
        },
      ],
    }

    const addedSlots = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
      {
        weekNumber: 1,
        timeSlot: 'ED',
        daysOfWeek: ['FRIDAY'],
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
      },
    ]

    const result = getAllSameDaySlots(addedSlots as Slot[], schedule as ActivitySchedule)

    expect(result).toHaveLength(3)
    expect(result.map((s: Slot) => s.timeSlot).sort()).toEqual(['AM', 'ED', 'PM'])
  })
})
