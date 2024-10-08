import { CreateAnActivityJourney, Slots } from '../../routes/activities/create-an-activity/journey'
import activitySessionToDailyTimeSlots, {
  activitySlotsMinusExclusions,
  addNewEmptySlotsIfRequired,
  calculateExclusionSlots,
  calculateUniqueSlots,
  createCustomSlots,
  createSessionSlots,
  createSlot,
  filterNotRequiredSlots,
  getMatchingSlots,
  mapActivityScheduleSlotsToSlots,
  mapSlotsToCompleteWeeklyTimeSlots,
  mapSlotsToWeeklyTimeSlots,
  mergeExclusionSlots,
  regimeSlotsToSchedule,
  SessionSlot,
  sessionSlotsToSchedule,
  transformActivitySlotsToDailySlots,
} from './activityTimeSlotMappers'
import { ActivityScheduleSlot, PrisonRegime, Slot } from '../../@types/activitiesAPI/types'
import TimeSlot from '../../enum/timeSlot'
import SimpleTime from '../../commonValidationTypes/simpleTime'
import { DaysAndSlotsInRegime } from './applicableRegimeTimeUtil'

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
          slots: ['AM', 'PM', 'ED'],
        },
        {
          day: 'Tuesday',
          slots: ['AM', 'PM'],
        },
        {
          day: 'Wednesday',
          slots: ['AM'],
        },
        {
          day: 'Thursday',
          slots: ['PM'],
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
          slots: ['ED'],
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
      timeSlot: TimeSlot.AM,
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
        timeSlot: TimeSlot.AM,
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
        timeSlot: TimeSlot.AM,
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

    const scheduleSlots: ActivityScheduleSlot[] = [
      {
        id: 1,
        weekNumber: 1,
        timeSlot: 'AM',
        startTime: '10:00',
        endTime: '11:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 2,
        weekNumber: 1,
        timeSlot: 'PM',
        startTime: '17:00',
        endTime: '18:00',
        daysOfWeek: ['Thu', 'Fri'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: true,
        fridayFlag: true,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 3,
        weekNumber: 2,
        timeSlot: 'PM',
        startTime: '18:10',
        endTime: '19:10',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 4,
        weekNumber: 2,
        timeSlot: 'PM',
        startTime: '18:15',
        endTime: '19:15',
        daysOfWeek: ['Wed'],
        mondayFlag: false,
        tuesdayFlag: false,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ]

    const weeklyTimeSlots = mapSlotsToWeeklyTimeSlots(slots, scheduleSlots)

    expect(weeklyTimeSlots).toEqual({
      1: [
        {
          day: 'MONDAY',
          slots: [
            {
              timeSlot: TimeSlot.AM,
              startTime: '10:00',
              endTime: '11:00',
            },
          ],
        },
        {
          day: 'THURSDAY',
          slots: [
            {
              timeSlot: TimeSlot.PM,
              startTime: '17:00',
              endTime: '18:00',
            },
          ],
        },
        {
          day: 'FRIDAY',
          slots: [
            {
              timeSlot: TimeSlot.PM,
              startTime: '17:00',
              endTime: '18:00',
            },
          ],
        },
      ],
      2: [
        {
          day: 'MONDAY',
          slots: [
            {
              timeSlot: TimeSlot.PM,
              startTime: '18:10',
              endTime: '19:10',
            },
          ],
        },
        {
          day: 'WEDNESDAY',
          slots: [
            {
              timeSlot: TimeSlot.PM,
              startTime: '18:15',
              endTime: '19:15',
            },
          ],
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

  it('should find correct added slots', () => {
    const exclusions: Slot[] = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        customStartTime: null,
        customEndTime: null,
        daysOfWeek: ['TUESDAY', 'WEDNESDAY', 'THURSDAY'],
      },
    ]

    const updatedExclusions: Slot[] = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['FRIDAY'],
      },
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'TUESDAY'],
      },
    ]

    const expectedAddedSlot: Slot[] = calculateExclusionSlots(exclusions, updatedExclusions)

    expect(expectedAddedSlot).toEqual([
      {
        customEndTime: null,
        customStartTime: null,
        daysOfWeek: ['WEDNESDAY', 'THURSDAY'],
        friday: false,
        monday: false,
        saturday: false,
        sunday: false,
        thursday: true,
        timeSlot: 'AM',
        tuesday: false,
        wednesday: true,
        weekNumber: 1,
      },
    ])
  })

  it('should added no slots when all are found', () => {
    const exclusions: Slot[] = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        customStartTime: null,
        customEndTime: null,
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
      },
    ]

    const updatedExclusions: Slot[] = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['FRIDAY'],
      },
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
      },
    ]

    const expectedAddedSlot: Slot[] = calculateExclusionSlots(exclusions, updatedExclusions)

    expect(expectedAddedSlot).toEqual([])
  })

  it('should merge exclusionn slots for week and timeslot', () => {
    const exclusions: Slot[] = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
      },
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['FRIDAY'],
      },
    ]

    const expectedAddedSlot: Slot[] = mergeExclusionSlots(exclusions)

    expect(expectedAddedSlot).toEqual([
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      },
    ])
  })

  it('should merge exclusionnslots for multi week and multi timeslot', () => {
    const exclusions: Slot[] = [
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
      },
      {
        weekNumber: 1,
        timeSlot: 'AM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['FRIDAY'],
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'WEDNESDAY', 'THURSDAY'],
      },
      {
        weekNumber: 1,
        timeSlot: 'PM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['FRIDAY'],
      },
      {
        weekNumber: 2,
        timeSlot: 'AM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'SUNDAY'],
      },
      {
        weekNumber: 2,
        timeSlot: 'AM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['SATURDAY'],
      },
      {
        weekNumber: 2,
        timeSlot: 'PM',
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: false,
        saturday: false,
        sunday: false,
        daysOfWeek: ['MONDAY', 'THURSDAY'],
      },
      {
        weekNumber: 2,
        timeSlot: 'PM',
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: true,
        saturday: false,
        sunday: false,
        daysOfWeek: ['WEDNESDAY', 'FRIDAY'],
      },
    ]

    const expectedAddedSlot: Slot[] = mergeExclusionSlots(exclusions)

    expect(expectedAddedSlot).toEqual([
      {
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        friday: true,
        monday: true,
        saturday: false,
        sunday: false,
        thursday: true,
        timeSlot: 'AM',
        tuesday: true,
        wednesday: true,
        weekNumber: 1,
      },
      {
        daysOfWeek: ['MONDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        friday: true,
        monday: true,
        saturday: false,
        sunday: false,
        thursday: true,
        timeSlot: 'PM',
        tuesday: true,
        wednesday: true,
        weekNumber: 1,
      },
      {
        daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'SUNDAY', 'SATURDAY'],
        friday: false,
        monday: true,
        saturday: true,
        sunday: false,
        thursday: true,
        timeSlot: 'AM',
        tuesday: true,
        wednesday: true,
        weekNumber: 2,
      },
      {
        daysOfWeek: ['MONDAY', 'THURSDAY', 'WEDNESDAY', 'FRIDAY'],
        friday: true,
        monday: true,
        saturday: false,
        sunday: false,
        thursday: true,
        timeSlot: 'PM',
        tuesday: true,
        wednesday: true,
        weekNumber: 2,
      },
    ])
  })
})

describe('Create custom slots from session time', () => {
  it('should map a monday morning session time to a custom slot', () => {
    const startTime = new SimpleTime()
    startTime.hour = 5
    startTime.minute = 30

    const endTime = new SimpleTime()
    endTime.hour = 9
    endTime.minute = 45

    const expected: Slot = createSlot('1-MONDAY-AM', startTime, endTime)

    const mondayAM: Slot = {
      customStartTime: '05:30',
      customEndTime: '09:45',
      daysOfWeek: ['MONDAY'],
      friday: false,
      monday: true,
      saturday: false,
      sunday: false,
      thursday: false,
      timeSlot: TimeSlot.AM,
      tuesday: false,
      wednesday: false,
      weekNumber: 1,
    }
    expect(expected).toEqual(mondayAM)
  })

  it('should map a tuesday afternoon session time to a custom slot', () => {
    const startTime = new SimpleTime()
    startTime.hour = 15
    startTime.minute = 30

    const endTime = new SimpleTime()
    endTime.hour = 17
    endTime.minute = 45

    const expected: Slot = createSlot('1-TUESDAY-PM', startTime, endTime)

    const tuesdayPM: Slot = {
      customStartTime: '15:30',
      customEndTime: '17:45',
      daysOfWeek: ['TUESDAY'],
      friday: false,
      monday: false,
      saturday: false,
      sunday: false,
      thursday: false,
      timeSlot: TimeSlot.PM,
      tuesday: true,
      wednesday: false,
      weekNumber: 1,
    }
    expect(expected).toEqual(tuesdayPM)
  })

  it('should map a friday evening session time to a custom slot', () => {
    const startTime = new SimpleTime()
    startTime.hour = 21
    startTime.minute = 30

    const endTime = new SimpleTime()
    endTime.hour = 23
    endTime.minute = 45

    const expected: Slot = createSlot('2-FRIDAY-ED', startTime, endTime)

    const fridayED: Slot = {
      customStartTime: '21:30',
      customEndTime: '23:45',
      daysOfWeek: ['FRIDAY'],
      friday: true,
      monday: false,
      saturday: false,
      sunday: false,
      thursday: false,
      timeSlot: TimeSlot.ED,
      tuesday: false,
      wednesday: false,
      weekNumber: 2,
    }
    expect(expected).toEqual(fridayED)
  })

  it('should map custom start and end times to an array of custom slot', () => {
    const startMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()
    const endMap: Map<string, SimpleTime> = new Map<string, SimpleTime>()

    const startTime = new SimpleTime()
    startTime.hour = 5
    startTime.minute = 30

    startMap.set('1-MONDAY-AM', startTime)

    const startTime2 = new SimpleTime()
    startTime2.hour = 15
    startTime2.minute = 45

    startMap.set('1-WEDNESDAY-PM', startTime2)

    const startTime3 = new SimpleTime()
    startTime3.hour = 19
    startTime3.minute = 34

    startMap.set('1-FRIDAY-ED', startTime3)

    const endTime = new SimpleTime()
    endTime.hour = 9
    endTime.minute = 45

    endMap.set('1-MONDAY-AM', endTime)

    const endTime2 = new SimpleTime()
    endTime2.hour = 17
    endTime2.minute = 41

    endMap.set('1-WEDNESDAY-PM', endTime2)

    const endTime3 = new SimpleTime()
    endTime3.hour = 21
    endTime3.minute = 22

    endMap.set('1-FRIDAY-ED', endTime3)

    const expected: Slot[] = createCustomSlots(startMap, endMap)

    const customSlots: Slot[] = [
      {
        customStartTime: '05:30',
        customEndTime: '09:45',
        daysOfWeek: ['MONDAY'],
        friday: false,
        monday: true,
        saturday: false,
        sunday: false,
        thursday: false,
        timeSlot: TimeSlot.AM,
        tuesday: false,
        wednesday: false,
        weekNumber: 1,
      },
      {
        customStartTime: '15:45',
        customEndTime: '17:41',
        daysOfWeek: ['WEDNESDAY'],
        friday: false,
        monday: false,
        saturday: false,
        sunday: false,
        thursday: false,
        timeSlot: TimeSlot.PM,
        tuesday: false,
        wednesday: true,
        weekNumber: 1,
      },
      {
        customStartTime: '19:34',
        customEndTime: '21:22',
        daysOfWeek: ['FRIDAY'],
        friday: true,
        monday: false,
        saturday: false,
        sunday: false,
        thursday: false,
        timeSlot: TimeSlot.ED,
        tuesday: false,
        wednesday: false,
        weekNumber: 1,
      },
    ]

    expect(expected).toEqual(customSlots)
  })

  describe('Create scheduled slots from selected regime times', () => {
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

    it('should map slots correctly for weekly', () => {
      const scheduledSlots = {
        1: {
          days: ['monday', 'friday'],
          timeSlotsMonday: ['AM', 'PM'],
          timeSlotsTuesday: [],
          timeSlotsWednesday: ['ED'],
          timeSlotsThursday: [],
          timeSlotsFriday: ['AM'],
          timeSlotsSaturday: [],
          timeSlotsSunday: [],
        },
      } as { [weekNumber: string]: Slots }

      const schedule = regimeSlotsToSchedule(1, scheduledSlots, regimeTimes)

      expect(schedule).toEqual({
        1: [
          {
            day: 'Monday',
            slots: [
              { timeSlot: 'AM', startTime: '09:00', endTime: '10:00' },
              { timeSlot: 'PM', startTime: '12:00', endTime: '13:00' },
            ],
          },
          { day: 'Tuesday', slots: [] },
          {
            day: 'Wednesday',
            slots: [{ timeSlot: 'ED', startTime: '17:00', endTime: '18:00' }],
          },
          { day: 'Thursday', slots: [] },
          {
            day: 'Friday',
            slots: [{ timeSlot: 'AM', startTime: '10:00', endTime: '11:00' }],
          },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] },
        ],
      })
    })

    it('should map slots correctly for bi-weekly', () => {
      const scheduledSlots = {
        1: {
          days: ['monday', 'tuesday'],
          timeSlotsMonday: ['AM'],
          timeSlotsTuesday: ['AM'],
          timeSlotsWednesday: [],
          timeSlotsThursday: [],
          timeSlotsFriday: [],
          timeSlotsSaturday: [],
          timeSlotsSunday: [],
        },
        2: {
          days: ['wednesday', 'thursday', 'friday'],
          timeSlotsMonday: [],
          timeSlotsTuesday: [],
          timeSlotsWednesday: ['PM'],
          timeSlotsThursday: ['PM'],
          timeSlotsFriday: ['PM', 'ED'],
          timeSlotsSaturday: [],
          timeSlotsSunday: [],
        },
      } as { [weekNumber: string]: Slots }

      const schedule = regimeSlotsToSchedule(2, scheduledSlots, regimeTimes)

      expect(schedule).toEqual({
        1: [
          {
            day: 'Monday',
            slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '10:00' }],
          },
          { day: 'Tuesday', slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '10:00' }] },
          { day: 'Wednesday', slots: [] },
          { day: 'Thursday', slots: [] },
          { day: 'Friday', slots: [] },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] },
        ],
        2: [
          { day: 'Monday', slots: [] },
          { day: 'Tuesday', slots: [] },
          { day: 'Wednesday', slots: [{ timeSlot: 'PM', startTime: '12:00', endTime: '13:00' }] },
          { day: 'Thursday', slots: [{ timeSlot: 'PM', startTime: '12:00', endTime: '13:00' }] },
          {
            day: 'Friday',
            slots: [
              { timeSlot: 'PM', startTime: '12:00', endTime: '13:00' },
              { timeSlot: 'ED', startTime: '17:00', endTime: '18:00' },
            ],
          },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] },
        ],
      })
    })

    it('should ignore any unknown slots', () => {
      const scheduledSlots = {
        1: {
          days: ['monday', 'friday'],
          timeSlotsMonday: ['AM', 'XX'],
          timeSlotsTuesday: [],
          timeSlotsWednesday: ['ED'],
          timeSlotsThursday: [''],
          timeSlotsFriday: [],
          timeSlotsSaturday: [],
          timeSlotsSunday: [],
        },
      } as { [weekNumber: string]: Slots }

      const schedule = regimeSlotsToSchedule(1, scheduledSlots, regimeTimes)

      expect(schedule).toEqual({
        1: [
          {
            day: 'Monday',
            slots: [{ timeSlot: 'AM', startTime: '09:00', endTime: '10:00' }],
          },
          { day: 'Tuesday', slots: [] },
          {
            day: 'Wednesday',
            slots: [{ timeSlot: 'ED', startTime: '17:00', endTime: '18:00' }],
          },
          { day: 'Thursday', slots: [] },
          { day: 'Friday', slots: [] },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] },
        ],
      })
    })
  })
})

describe('transformActivitySlotsToDailySlots', () => {
  it('should transform slots from the activity (from api) to the desired format - only am present', () => {
    const activitySlots = [
      {
        id: 1,
        timeSlot: TimeSlot.AM,
        weekNumber: 1,
        startTime: '05:00',
        endTime: '07:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ]
    const result = transformActivitySlotsToDailySlots(activitySlots)
    const expectedResult = [{ dayOfWeek: 'MONDAY', amStart: '05:00', amFinish: '07:00' }]
    expect(result).toEqual(expectedResult)
  })

  it('should transform slots from the activity (from api) to the desired format - am and pm present on same day', () => {
    const activitySlots = [
      {
        id: 1,
        timeSlot: TimeSlot.AM,
        weekNumber: 1,
        startTime: '05:00',
        endTime: '07:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 2,
        timeSlot: TimeSlot.PM,
        weekNumber: 1,
        startTime: '15:30',
        endTime: '17:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ]
    const result = transformActivitySlotsToDailySlots(activitySlots)
    const expectedResult = [
      { dayOfWeek: 'MONDAY', amStart: '05:00', amFinish: '07:00', pmStart: '15:30', pmFinish: '17:00' },
    ]
    expect(result).toEqual(expectedResult)
  })

  it('should transform slots from the activity (from api) to the desired format - am and pm present on different days', () => {
    const activitySlots = [
      {
        id: 1,
        timeSlot: TimeSlot.AM,
        weekNumber: 1,
        startTime: '05:00',
        endTime: '07:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 2,
        timeSlot: TimeSlot.PM,
        weekNumber: 1,
        startTime: '15:30',
        endTime: '17:00',
        daysOfWeek: ['Tue'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ]
    const result = transformActivitySlotsToDailySlots(activitySlots)
    const expectedResult = [
      { dayOfWeek: 'MONDAY', amStart: '05:00', amFinish: '07:00' },
      { dayOfWeek: 'TUESDAY', pmStart: '15:30', pmFinish: '17:00' },
    ]
    expect(result).toEqual(expectedResult)
  })

  it('should transform slots from the activity (from api) to the desired format - all types of slots present', () => {
    const activitySlots = [
      {
        id: 1,
        timeSlot: TimeSlot.AM,
        weekNumber: 1,
        startTime: '05:00',
        endTime: '07:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 2,
        timeSlot: TimeSlot.PM,
        weekNumber: 1,
        startTime: '15:30',
        endTime: '17:00',
        daysOfWeek: ['Mon'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 3,
        timeSlot: TimeSlot.PM,
        weekNumber: 1,
        startTime: '15:30',
        endTime: '17:00',
        daysOfWeek: ['Tue'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 4,
        timeSlot: TimeSlot.ED,
        weekNumber: 1,
        startTime: '17:30',
        endTime: '20:00',
        daysOfWeek: ['Wed'],
        mondayFlag: false,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
    ]
    const result = transformActivitySlotsToDailySlots(activitySlots)
    const expectedResult = [
      { dayOfWeek: 'MONDAY', amStart: '05:00', amFinish: '07:00', pmStart: '15:30', pmFinish: '17:00' },
      { dayOfWeek: 'TUESDAY', pmStart: '15:30', pmFinish: '17:00' },
      { dayOfWeek: 'WEDNESDAY', edStart: '17:30', edFinish: '20:00' },
    ]
    expect(result).toEqual(expectedResult)
  })

  describe('sessionSlotsToSchedule', () => {
    it('should transform allocations slots to schedule', () => {
      const allocationSlots: ActivityScheduleSlot[] = [
        {
          id: 1,
          timeSlot: 'AM',
          weekNumber: 1,
          startTime: '08:00',
          endTime: '09:00',
          daysOfWeek: ['Mon', 'Tue'],
          mondayFlag: true,
          tuesdayFlag: true,
          wednesdayFlag: false,
          thursdayFlag: false,
          fridayFlag: false,
          saturdayFlag: false,
          sundayFlag: false,
        },
        {
          id: 2,
          timeSlot: 'ED',
          weekNumber: 2,
          startTime: '17:20',
          endTime: '19:00',
          daysOfWeek: ['Thu'],
          mondayFlag: false,
          tuesdayFlag: false,
          wednesdayFlag: false,
          thursdayFlag: true,
          fridayFlag: false,
          saturdayFlag: false,
          sundayFlag: false,
        },
        {
          id: 3,
          timeSlot: 'PM',
          weekNumber: 2,
          startTime: '12:00',
          endTime: '13:00',
          daysOfWeek: ['Thu'],
          mondayFlag: false,
          tuesdayFlag: false,
          wednesdayFlag: false,
          thursdayFlag: true,
          fridayFlag: false,
          saturdayFlag: false,
          sundayFlag: false,
        },
      ]

      const schedule = sessionSlotsToSchedule(2, allocationSlots)

      expect(schedule).toEqual({
        1: [
          {
            day: 'Monday',
            slots: [{ timeSlot: 'AM', startTime: '08:00', endTime: '09:00' }],
          },
          {
            day: 'Tuesday',
            slots: [{ timeSlot: 'AM', startTime: '08:00', endTime: '09:00' }],
          },
          { day: 'Wednesday', slots: [] },
          { day: 'Thursday', slots: [] },
          { day: 'Friday', slots: [] },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] },
        ],
        2: [
          { day: 'Monday', slots: [] },
          { day: 'Tuesday', slots: [] },
          { day: 'Wednesday', slots: [] },
          {
            day: 'Thursday',
            slots: [
              { timeSlot: 'PM', startTime: '12:00', endTime: '13:00' },
              { timeSlot: 'ED', startTime: '17:20', endTime: '19:00' },
            ],
          },
          { day: 'Friday', slots: [] },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] },
        ],
      })
    })
  })
})

describe('addNewEmptySlotsIfRequired', () => {
  it("shouldn't add any empty slots if there are no newly selected ones", () => {
    const sessionSlots = [
      { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.AM, start: '10:00', finish: '11:00' },
      { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.PM, start: '12:00', finish: '13:00' },
    ]
    const newlySelectedSlots = {
      days: ['monday'],
      timeSlotsMonday: ['AM', 'PM'],
    }
    const result = addNewEmptySlotsIfRequired(sessionSlots, newlySelectedSlots)
    expect(result).toEqual(sessionSlots)
  })

  it('should return an empty array if there are no slots selected', () => {
    const sessionSlots: SessionSlot[] = []
    const newlySelectedSlots: Slots = undefined
    const result = addNewEmptySlotsIfRequired(sessionSlots, newlySelectedSlots)
    expect(result).toEqual(sessionSlots)
  })

  it('should add empty slots if there are new ones present, with undefined times', () => {
    const sessionSlots = [{ dayOfWeek: 'MONDAY', timeSlot: TimeSlot.AM, start: '10:00', finish: '11:00' }]
    const newlySelectedSlots = {
      days: ['monday', 'tuesday'],
      timeSlotsMonday: ['AM', 'PM'],
      timeSlotsTuesday: ['AM', 'PM', 'ED'],
    }
    const result = addNewEmptySlotsIfRequired(sessionSlots, newlySelectedSlots)
    expect(result).toEqual([
      { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.AM, start: '10:00', finish: '11:00' },
      { dayOfWeek: 'MONDAY', timeSlot: TimeSlot.PM, start: undefined, finish: undefined },
      { dayOfWeek: 'TUESDAY', timeSlot: TimeSlot.AM, start: undefined, finish: undefined },
      { dayOfWeek: 'TUESDAY', timeSlot: TimeSlot.PM, start: undefined, finish: undefined },
      { dayOfWeek: 'TUESDAY', timeSlot: TimeSlot.ED, start: undefined, finish: undefined },
    ])
  })
})

describe('filterNotRequiredSlots', () => {
  it('Should remove sessions from sessionSlots if they are not selected anymore', () => {
    const sessionSlots = [
      {
        dayOfWeek: 'MONDAY',
        amStart: '07:30',
        amFinish: '11:45',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        edStart: '17:30',
        edFinish: '20:45',
      },
      {
        dayOfWeek: 'FRIDAY',
        amStart: '07:30',
        amFinish: '11:45',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
    ]
    const newlySelectedSlots = {
      days: ['monday', 'wednesday', 'friday'],
      timeSlotsMonday: ['AM'],
      timeSlotsWednesday: ['ED'],
      timeSlotsFriday: ['PM'],
    }
    const expectedSlots = [
      {
        dayOfWeek: 'MONDAY',
        amStart: '07:30',
        amFinish: '11:45',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        edStart: '17:30',
        edFinish: '20:45',
      },
      {
        dayOfWeek: 'FRIDAY',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
    ]
    const result = filterNotRequiredSlots(sessionSlots, newlySelectedSlots)
    expect(result).toEqual(expectedSlots)
  })
  it('Should return the same slots if nothing has changed', () => {
    const sessionSlots = [
      {
        dayOfWeek: 'MONDAY',
        amStart: '07:30',
        amFinish: '11:45',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
      {
        dayOfWeek: 'TUESDAY',
        amStart: '07:30',
        amFinish: '11:45',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        amStart: '07:30',
        amFinish: '11:45',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
      {
        dayOfWeek: 'THURSDAY',
        amStart: '07:30',
        amFinish: '11:45',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
      {
        dayOfWeek: 'FRIDAY',
        amStart: '07:30',
        amFinish: '11:45',
        pmStart: '14:00',
        pmFinish: '17:30',
      },
    ]
    const newlySelectedSlots = {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeSlotsMonday: ['AM', 'PM'],
      timeSlotsTuesday: ['AM', 'PM'],
      timeSlotsWednesday: ['AM', 'PM'],
      timeSlotsThursday: ['AM', 'PM'],
      timeSlotsFriday: ['AM', 'PM'],
    }
    const result = filterNotRequiredSlots(sessionSlots, newlySelectedSlots)
    expect(result).toEqual(sessionSlots)
  })
})

describe('createSessionSlots', () => {
  it('Should create sessionSlots on the same day', () => {
    const morning: DaysAndSlotsInRegime = {
      dayOfWeek: 'MONDAY',
      amStart: '08:45',
      amFinish: '09:45',
    }

    const afternoon: DaysAndSlotsInRegime = {
      dayOfWeek: 'MONDAY',
      pmStart: '14:00',
      pmFinish: '17:30',
    }

    const evening: DaysAndSlotsInRegime = {
      dayOfWeek: 'MONDAY',
      edStart: '19:00',
      edFinish: '20:30',
    }

    const daysAndSlotsInRegime: DaysAndSlotsInRegime[] = [morning, afternoon, evening]

    const expectedSessionSlots: SessionSlot[] = [
      {
        dayOfWeek: 'MONDAY',
        timeSlot: TimeSlot.AM,
        start: '08:45',
        finish: '09:45',
      },
      {
        dayOfWeek: 'MONDAY',
        timeSlot: TimeSlot.PM,
        start: '14:00',
        finish: '17:30',
      },
      {
        dayOfWeek: 'MONDAY',
        timeSlot: TimeSlot.ED,
        start: '19:00',
        finish: '20:30',
      },
    ]

    const result: SessionSlot[] = createSessionSlots(daysAndSlotsInRegime)
    expect(result).toEqual(expectedSessionSlots)
  })

  it('Should create sessionSlots on different days', () => {
    const morning: DaysAndSlotsInRegime = {
      dayOfWeek: 'MONDAY',
      amStart: '08:45',
      amFinish: '09:45',
    }

    const afternoon: DaysAndSlotsInRegime = {
      dayOfWeek: 'TUESDAY',
      pmStart: '14:00',
      pmFinish: '17:30',
    }

    const evening: DaysAndSlotsInRegime = {
      dayOfWeek: 'FRIDAY',
      edStart: '19:00',
      edFinish: '20:30',
    }

    const daysAndSlotsInRegime: DaysAndSlotsInRegime[] = [morning, afternoon, evening]

    const expectedSessionSlots: SessionSlot[] = [
      {
        dayOfWeek: 'MONDAY',
        timeSlot: TimeSlot.AM,
        start: '08:45',
        finish: '09:45',
      },
      {
        dayOfWeek: 'TUESDAY',
        timeSlot: TimeSlot.PM,
        start: '14:00',
        finish: '17:30',
      },
      {
        dayOfWeek: 'FRIDAY',
        timeSlot: TimeSlot.ED,
        start: '19:00',
        finish: '20:30',
      },
    ]

    const result: SessionSlot[] = createSessionSlots(daysAndSlotsInRegime)
    expect(result).toEqual(expectedSessionSlots)
  })

  it('Should create sessionSlots with  multiple on different days', () => {
    const morning: DaysAndSlotsInRegime = {
      dayOfWeek: 'MONDAY',
      amStart: '08:45',
      amFinish: '09:45',
    }

    const morning2: DaysAndSlotsInRegime = {
      dayOfWeek: 'TUESDAY',
      amStart: '08:45',
      amFinish: '09:45',
    }

    const afternoon: DaysAndSlotsInRegime = {
      dayOfWeek: 'TUESDAY',
      pmStart: '14:00',
      pmFinish: '17:30',
    }

    const afternoon2: DaysAndSlotsInRegime = {
      dayOfWeek: 'WEDNESDAY',
      pmStart: '14:00',
      pmFinish: '17:30',
    }

    const evening: DaysAndSlotsInRegime = {
      dayOfWeek: 'FRIDAY',
      edStart: '19:00',
      edFinish: '20:30',
    }

    const evening2: DaysAndSlotsInRegime = {
      dayOfWeek: 'SATURDAY',
      edStart: '19:00',
      edFinish: '20:30',
    }

    const daysAndSlotsInRegime: DaysAndSlotsInRegime[] = [morning, morning2, afternoon, afternoon2, evening, evening2]

    const expectedSessionSlots: SessionSlot[] = [
      {
        dayOfWeek: 'MONDAY',
        timeSlot: TimeSlot.AM,
        start: '08:45',
        finish: '09:45',
      },
      {
        dayOfWeek: 'TUESDAY',
        timeSlot: TimeSlot.AM,
        start: '08:45',
        finish: '09:45',
      },
      {
        dayOfWeek: 'TUESDAY',
        timeSlot: TimeSlot.PM,
        start: '14:00',
        finish: '17:30',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        timeSlot: TimeSlot.PM,
        start: '14:00',
        finish: '17:30',
      },
      {
        dayOfWeek: 'FRIDAY',
        timeSlot: TimeSlot.ED,
        start: '19:00',
        finish: '20:30',
      },
      {
        dayOfWeek: 'SATURDAY',
        timeSlot: TimeSlot.ED,
        start: '19:00',
        finish: '20:30',
      },
    ]

    const result: SessionSlot[] = createSessionSlots(daysAndSlotsInRegime)
    expect(result).toEqual(expectedSessionSlots)
  })
})

describe('getMatchingSlots', () => {
  it('Should get matching slots', () => {
    const morning: DaysAndSlotsInRegime = {
      dayOfWeek: 'MONDAY',
      amStart: '08:45',
      amFinish: '09:45',
    }

    const morning2: DaysAndSlotsInRegime = {
      dayOfWeek: 'FRIDAY',
      amStart: '06:40',
      amFinish: '09:45',
    }

    const afternoon: DaysAndSlotsInRegime = {
      dayOfWeek: 'MONDAY',
      pmStart: '14:00',
      pmFinish: '17:30',
    }

    const evening: DaysAndSlotsInRegime = {
      dayOfWeek: 'WEDNESDAY',
      edStart: '19:00',
      edFinish: '20:30',
    }

    const daysAndSlotsInRegime: DaysAndSlotsInRegime[] = [morning, morning2, afternoon, evening]

    const scheduledSlots: Slots = {
      days: ['monday', 'wednesday', 'friday'],
      timeSlotsMonday: ['AM', 'PM'],
      timeSlotsTuesday: [],
      timeSlotsWednesday: ['ED'],
      timeSlotsThursday: [],
      timeSlotsFriday: ['AM'],
      timeSlotsSaturday: [],
      timeSlotsSunday: [],
    }

    const expectedSessionSlots: SessionSlot[] = [
      {
        dayOfWeek: 'MONDAY',
        timeSlot: TimeSlot.AM,
        start: '08:45',
        finish: '09:45',
      },
      {
        dayOfWeek: 'MONDAY',
        timeSlot: TimeSlot.PM,
        start: '14:00',
        finish: '17:30',
      },
      {
        dayOfWeek: 'WEDNESDAY',
        timeSlot: TimeSlot.ED,
        start: '19:00',
        finish: '20:30',
      },
      {
        dayOfWeek: 'FRIDAY',
        timeSlot: TimeSlot.AM,
        start: '06:40',
        finish: '09:45',
      },
    ]

    const result: SessionSlot[] = getMatchingSlots(daysAndSlotsInRegime, scheduledSlots)
    expect(result).toEqual(expectedSessionSlots)
  })
})
