import { addDays } from 'date-fns'
import { ServiceUser } from '../../@types/express'
import { formatIsoDate, findDatesInRange } from '../datePickerUtils'
import { Slots, CreateAnActivityJourney } from '../../routes/activities/create-an-activity/journey'
import { WeeklyCustomTimeSlots } from './activityTimeSlotMappers'
import BankHolidayService from '../../services/bankHolidayService'

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default class ActivityDateValidator {
  constructor(private readonly bankHolidayService: BankHolidayService) {}

  async hasAtLeastOneValidDay(journey: CreateAnActivityJourney, user: ServiceUser): Promise<boolean> {
    const { startDate, endDate, scheduleWeeks } = journey

    if (scheduleWeeks) {
      const allowedSlot1Days: number[] = findAllowedSlotDays(journey.slots[1])
      let allowedSlot2Days: number[] = []

      if (scheduleWeeks === 2) {
        allowedSlot2Days = findAllowedSlotDays(journey.slots[2])
      }

      return this.hasAnyValidDay(startDate, endDate, scheduleWeeks, allowedSlot1Days, allowedSlot2Days, user)
    }

    return false
  }

  async hasAtLeastOneValidDayInActivity(
    startDate: string,
    endDate: string,
    scheduleWeeks: number,
    scheduleSlots: WeeklyCustomTimeSlots,
    user: ServiceUser,
  ): Promise<boolean> {
    if (scheduleWeeks) {
      const allowedSlot1Days: number[] = []
      const allowedSlot2Days: number[] = []

      scheduleSlots[1].forEach(scheduleSlot => {
        if (scheduleSlot.slots?.length !== 0) {
          allowedSlot1Days.push(daysOfWeek.findIndex(d => d === scheduleSlot.day))
        }
      })

      if (scheduleWeeks === 2) {
        scheduleSlots[2].forEach(scheduleSlot => {
          if (scheduleSlot.slots?.length !== 0) {
            allowedSlot2Days.push(daysOfWeek.findIndex(d => d === scheduleSlot.day))
          }
        })
      }

      return this.hasAnyValidDay(startDate, endDate, scheduleWeeks, allowedSlot1Days, allowedSlot2Days, user)
    }

    return false
  }

  async hasAnyValidDay(
    startDate: string,
    endDate: string,
    scheduleWeeks: number,
    allowedSlot1Days: number[],
    allowedSlot2Days: number[],
    user: ServiceUser,
  ): Promise<boolean> {
    if (!endDate) {
      return true
    }

    const bankHolidaysIso: string[] = await this.findBankHolidays(startDate, endDate, user)
    let currentDate = new Date(startDate)

    do {
      if (isValidDay(currentDate, allowedSlot1Days, bankHolidaysIso)) {
        return true
      }

      currentDate = addDays(currentDate, 1)

      if (currentDate.getDay() === 0 && scheduleWeeks === 2) {
        do {
          if (isValidDay(currentDate, allowedSlot2Days, bankHolidaysIso)) {
            return true
          }

          currentDate = addDays(currentDate, 1)
        } while (currentDate <= new Date(endDate) && currentDate.getDay() !== 0)
      }
    } while (currentDate <= new Date(endDate))

    return false
  }

  async findBankHolidays(startDate: string, endDate: string, user: ServiceUser): Promise<string[]> {
    const ukBankHolidays = await this.bankHolidayService.getUkBankHolidays('england-and-wales', user)
    const bankHolidays = findDatesInRange(ukBankHolidays, startDate, endDate)

    const bankHolidaysIso: string[] = []
    bankHolidays.forEach(date => bankHolidaysIso.push(formatIsoDate(date)))
    return bankHolidaysIso
  }
}

function findAllowedSlotDays(slots: Slots): number[] {
  const slotDays: number[] = []

  slots.days.forEach(day => {
    slotDays.push(daysOfWeek.findIndex(d => d.toLowerCase() === day))
  })

  return slotDays
}

function isValidDay(currentDate: Date, allowedSlotDays: number[], bankHolidaysIso: string[]): boolean {
  return allowedSlotDays.includes(currentDate.getDay()) && !bankHolidaysIso.includes(formatIsoDate(currentDate))
}
