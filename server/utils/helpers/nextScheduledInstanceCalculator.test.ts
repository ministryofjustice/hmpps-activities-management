import findNextSchedulesInstance from './nextScheduledInstanceCalculator'
import { ActivitySchedule } from '../../@types/activitiesAPI/types'

describe('Next Scheduled Instance Calculator', () => {
  const schedule = {
    instances: [
      {
        date: '2024-08-23',
        startTime: '13:59',
      },
      {
        date: '2024-08-23',
        startTime: '14:00',
      },
      {
        date: '2024-08-22',
        startTime: '23:59',
      },
      {
        date: '2024-08-23',
        startTime: '14:01',
      },
    ],
  } as unknown as ActivitySchedule

  it('should find the next scheduled instance', async () => {
    const selectedInstance = findNextSchedulesInstance(schedule, new Date(2024, 7, 23, 14, 0))

    expect(selectedInstance).toEqual({
      date: '2024-08-23',
      startTime: '14:00',
      startDateTime: '2024-08-23 14:00',
    })
  })

  it('should return undefined if no scheduled instance', async () => {
    const selectedInstance = findNextSchedulesInstance(schedule, new Date(2024, 7, 23, 14, 2))

    expect(selectedInstance).toEqual(undefined)
  })
})
