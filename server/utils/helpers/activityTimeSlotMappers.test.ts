import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { scheduleSlotsToDailyTimeSlots, activitySessionToDailyTimeslots } from './activityTimeSlotMappers'

describe('Schedule slots to daily time slots mapper', () => {
  it("should map a schedule's slots to daily timeslots", () => {
    const slots = [
      {
        id: 123456,
        startTime: '9:00',
        endTime: '11:30',
        daysOfWeek: ['Mon', 'Tue', 'Wed'],
        mondayFlag: true,
        tuesdayFlag: true,
        wednesdayFlag: true,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 123457,
        startTime: '13:00',
        endTime: '16:30',
        daysOfWeek: ['Mon', 'Tue', 'Thu'],
        mondayFlag: true,
        tuesdayFlag: true,
        wednesdayFlag: false,
        thursdayFlag: true,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: false,
      },
      {
        id: 123458,
        startTime: '18:00',
        endTime: '20:00',
        daysOfWeek: ['Mon', 'Sun'],
        mondayFlag: true,
        tuesdayFlag: false,
        wednesdayFlag: false,
        thursdayFlag: false,
        fridayFlag: false,
        saturdayFlag: false,
        sundayFlag: true,
      },
    ]

    const scheduleTimes = scheduleSlotsToDailyTimeSlots(slots)

    expect(scheduleTimes).toEqual([
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
    ])
  })
})

describe('Activity session slots to daily time slots mapper', () => {
  it("should map a activity session's slots to daily timeslots", () => {
    const createJourney = {
      timeSlotsMonday: ['AM', 'PM', 'ED'],
      timeSlotsTuesday: ['AM', 'PM'],
      timeSlotsWednesday: ['AM'],
      timeSlotsThursday: ['PM'],
      timeSlotsFriday: [],
      timeSlotsSaturday: [],
      timeSlotsSunday: ['ED'],
    } as CreateAnActivityJourney

    const scheduleTimes = activitySessionToDailyTimeslots(createJourney)

    expect(scheduleTimes).toEqual([
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
    ])
  })
})
