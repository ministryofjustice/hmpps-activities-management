import { Request, Response } from 'express'
import { formatListWithAnd, convertToTitleCase } from '../../../../utils/utils'
import { FormValidationError } from '../../../../middleware/formValidationErrorHandler'
import { Slot } from '../../../../@types/activitiesAPI/types'
import config from '../../../../config'
import { YesNo } from '../../../../@types/activities'

export default class AddToSessionsToday {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { inmate, updatedExclusions, futureSameDaySlots, addToSessionsToday } = req.journeyData.allocateJourney
    const headingText = this.createHeadingText(inmate.prisonerName, futureSameDaySlots)
    const yesText = this.createYesText(futureSameDaySlots)
    const noText = this.createNoText(futureSameDaySlots)

    if (!config.sameDayScheduleModificationsEnabled) {
      return res.redirect('exclusions')
    }

    const addToTodaySession = this.convertTodaySessionToYesNo(addToSessionsToday)

    return res.render('pages/activities/manage-allocations/addToSessionsToday', {
      prisonerName: inmate.prisonerName,
      updatedExclusions,
      headingText,
      yesText,
      noText,
      addToTodaySession,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { addToSessionsToday } = req.body

    if (!addToSessionsToday) {
      throw new FormValidationError('addToSessionsToday', 'Select an option')
    }
    req.journeyData.allocateJourney.addToSessionsToday = addToSessionsToday === YesNo.YES
    return res.redirect('confirm-exclusions')
  }

  private createHeadingText(prisonerName: string, slots: Slot[]): string {
    const formattedSlots = this.formatSlots(slots)
    return `Do you want to add ${prisonerName} to today's ${formattedSlots} ${slots.length > 1 ? 'sessions' : 'session'}?`
  }

  private createYesText(slots: Slot[]): string {
    if (slots.length === 1) {
      return `Yes, add them to today's ${slots[0].timeSlot} session`
    }
    return `Yes, add them to today's sessions`
  }

  private createNoText(slots: Slot[]): string {
    const formattedSlots = this.formatSlots(slots)
    const dayOfWeek = convertToTitleCase(slots[0].daysOfWeek[0])
    return `No, add them to ${dayOfWeek} ${formattedSlots} sessions after today`
  }

  private formatSlots(slots: Slot[]): string {
    const timeSlots = slots.map(slot => slot.timeSlot)
    return formatListWithAnd(timeSlots)
  }

  private convertTodaySessionToYesNo(value: boolean | undefined): YesNo | undefined {
    if (value === undefined) {
      return undefined
    }
    return value ? YesNo.YES : YesNo.NO
  }
}
