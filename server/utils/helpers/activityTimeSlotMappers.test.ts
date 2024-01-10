import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import activitySessionToDailyTimeSlots, {
  activitySlotsMinusExclusions,
  calculateUniqueSlots,
  mapActivityScheduleSlotsToSlots,
  mapSlotsToCompleteWeeklyTimeSlots,
  mapSlotsToWeeklyTimeSlots,
} from './activityTimeSlotMappers'
import { ActivityScheduleSlot, Slot } from '../../@types/activitiesAPI/types'

describe('Activity session slots to daily time slots mapper', () => {
  it("should map a activity session's slots to daily time slots", () => {
    const createJourney: CreateAnActivityJourney = {
      scheduleWeeks: 1,
      slots: {
        '1': {
          timeSlotsMonday: ['AM', 'PM', 'ED'],
          timeSlotsTuesday: ['AM', 'PM'],
          timeSlotsWednesday: ['AM'],
          timeSlotsThursday: ['PM'],
          timeSlotsFriday: [],
          timeSlotsSaturday: [],
          timeSlotsSunday: ['ED'],
        },
      },
    }

    const scheduleTimes = activitySessionToDailyTimeSlots(createJourney.scheduleWeeks, createJourney.slots)

    expect(scheduleTimes).toEqual({
      '1': [
        {
          day: 'Monday',
          slots: ['am', 'pm', 'ed'],
        },
        {
          day: 'Tuesday',
          slots: ['am', 'pm'],
        },
        {
          day: 'Wednesday',
          slots: ['am'],
        },
        {
          day: 'Thursday',
          slots: ['pm'],
        },
        {
          day: 'Friday',
          slots: [],
        },
        {
          day: 'Saturday',
          slots: [],
        },
        {
          day: 'Sunday',
          slots: ['ed'],
        },
      ],
    })
  })

  it('should map ActivityScheduleSlots to Slots', () => {
    const activityScheduleSlot = {
      id: 1,
      weekNumber: 2,
      startTime: '09:00',
      endTime: '12:00',
      mondayFlag: true,
      tuesdayFlag: false,
      wednesdayFlag: true,
      thursdayFlag: false,
      fridayFlag: true,
      saturdayFlag: false,
      sundayFlag: true,
      daysOfWeek: ['Mon', 'Wed', 'Fri', 'Sun'],
    } as ActivityScheduleSlot

    const expectedSlot = {
      weekNumber: 2,
      timeSlot: 'AM',
      monday: true,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: true,
      daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SUNDAY'],
    } as Slot

    expect(mapActivityScheduleSlotsToSlots([activityScheduleSlot])).toEqual([expectedSlot])
  })

  it('should calculate the schedule slots minus the exclusions', () => {
    const activityScheduleSlots = [
      {
        id: 1,
        weekNumber: 2,
        startTime: '09:00',
        endTime: '12:00',
        mondayFlag: true,
        tuesdayFlag: true,
        wednesdayFlag: true,
        thursdayFlag: true,
        fridayFlag: true,
        saturdayFlag: true,
        sundayFlag: true,
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
    ] as ActivityScheduleSlot[]

    const exclusions = [
      {
        weekNumber: 2,
        timeSlot: 'AM',
        monday: true,
        tuesday: false,
        wednesday: true,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: true,
        daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY', 'SUNDAY'],
      },
    ] as Slot[]

    expect(activitySlotsMinusExclusions(exclusions, activityScheduleSlots)).toEqual([
      {
        id: 1,
        weekNumber: 2,
        startTime: '09:00',
        endTime: '12:00',
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: true,
        fridayFlag: false,
        saturdayFlag: true,
        sundayFlag: false,
        daysOfWeek: ['Tue', 'Thu', 'Sat'],
      },
    ])
  })
})

describe('mapSlotsToWeeklyTimeSlots', () => {
  it('should map activity slots to weekly time slots', () => {
    const slots = [
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
      {
        weekNumber: 1,
        timeSlot: 'PM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['THURSDAY', 'FRIDAY'],
      },
      {
        weekNumber: 2,
        timeSlot: 'PM',
        monday: true,
        tuesday: false,
        wednesday: true,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'WEDNESDAY'],
      },
    ] as Slot[]

    const weeklyTimeSlots = mapSlotsToWeeklyTimeSlots(slots)

    expect(weeklyTimeSlots).toEqual({
      1: [
        {
          day: 'MONDAY',
          slots: ['AM'],
        },
        {
          day: 'THURSDAY',
          slots: ['PM'],
        },
        {
          day: 'FRIDAY',
          slots: ['PM'],
        },
      ],
      2: [
        {
          day: 'MONDAY',
          slots: ['PM'],
        },
        {
          day: 'WEDNESDAY',
          slots: ['PM'],
        },
      ],
    })
  })
})

describe('mapSlotsToCompleteWeeklyTimeSlots', () => {
  it('should map activity slots to weekly time slots', () => {
    const slots = [
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
      {
        weekNumber: 1,
        timeSlot: 'PM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['THURSDAY', 'FRIDAY'],
      },
    ] as Slot[]

    const weeklyTimeSlots = mapSlotsToCompleteWeeklyTimeSlots(slots, 2)

    expect(weeklyTimeSlots).toEqual({
      1: [
        {
          day: 'MONDAY',
          slots: ['AM'],
        },
        {
          day: 'THURSDAY',
          slots: ['PM'],
        },
        {
          day: 'FRIDAY',
          slots: ['PM'],
        },
      ],
      2: [
        {
          day: 'MONDAY',
          slots: [],
        },
        {
          day: 'THURSDAY',
          slots: [],
        },
        {
          day: 'FRIDAY',
          slots: [],
        },
      ],
    })
  })
})

describe('calculateUniqueSlots', () => {
  it('should find slots unique to the first slot array', () => {
    const slotsA = [
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
      {
        weekNumber: 1,
        timeSlot: 'PM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['THURSDAY', 'FRIDAY'],
      },
      {
        weekNumber: 2,
        timeSlot: 'PM',
        monday: true,
        tuesday: false,
        wednesday: true,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'WEDNESDAY'],
      },
    ] as Slot[]

    const slotsB = [
      {
        weekNumber: 1,
        timeSlot: 'PM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['THURSDAY', 'FRIDAY'],
      },
      {
        weekNumber: 2,
        timeSlot: 'PM',
        monday: true,
        tuesday: false,
        wednesday: true,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'WEDNESDAY'],
      },
    ] as Slot[]

    const uniqueSlots = calculateUniqueSlots(slotsA, slotsB)

    expect(uniqueSlots).toEqual([
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
    ])
  })
})
