import scheduleSlotsToDayMapper from './scheduleSlotsToDayMapper'

describe('Schedule slots to day mapper', () => {
  it("should map a schedule's slots to days", () => {
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

    const scheduleTimes = scheduleSlotsToDayMapper(slots)

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
