import { CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import activitySessionToDailyTimeSlots from './activityTimeSlotMappers'

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
})
