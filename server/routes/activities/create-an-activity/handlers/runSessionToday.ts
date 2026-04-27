import { Request, Response } from 'express'
import { ActivityUpdateRequest, Slot } from '../../../../@types/activitiesAPI/types'
import { YesNo } from '../../../../@types/activities'
import { FormValidationError } from '../../../../middleware/formValidationErrorHandler'
import { formatListWithAnd, convertToTitleCase, mapJourneySlotsToActivityRequest } from '../../../../utils/utils'
import ActivitiesService from '../../../../services/activitiesService'

export default class RunSessionTodayRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { futureSameDaySlots, allSameDaySlots } = req.journeyData.createJourney

    if (!futureSameDaySlots || futureSameDaySlots.length === 0) {
      return res.redirect('/activities')
    }

    const headingText = this.createHeadingText(futureSameDaySlots)
    const yesText = this.createYesText(futureSameDaySlots, allSameDaySlots)
    const noText = this.createNoText(futureSameDaySlots, allSameDaySlots)
    const insetText = this.createInsetText(futureSameDaySlots, allSameDaySlots)

    return res.render('pages/activities/create-an-activity/run-session-today', {
      yesText,
      noText,
      headingText,
      insetText,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { runSessionToday } = req.body

    const { user } = res.locals
    const { futureSameDaySlots, customSlots, scheduleWeeks, activityId, name } = req.journeyData.createJourney
    const slots = mapJourneySlotsToActivityRequest(req.journeyData.createJourney.slots)

    // redirect as we've lost futureSameDaySlots and cant validate.
    if (!futureSameDaySlots || futureSameDaySlots.length === 0) {
      return res.redirect('/activities')
    }

    if (!runSessionToday) {
      throw new FormValidationError('runSessionToday', 'Select an option')
    }

    const addToSessionsToday = runSessionToday === YesNo.YES

    const slotsForUpdate = customSlots || slots

    const updatedActivitySchedule: ActivityUpdateRequest = {
      slots: slotsForUpdate,
      scheduleWeeks,
      removeEndDate: false,
    }

    if (addToSessionsToday) {
      updatedActivitySchedule.firstTimeSlotForToday = futureSameDaySlots[0].timeSlot
    }

    await this.activitiesService.updateActivity(activityId, updatedActivitySchedule, user)
    const successMessage = `You've updated the daily schedule for ${name}`
    return res.redirectWithSuccess(`/activities/view/${activityId}`, 'Activity updated', successMessage)
  }

  private createHeadingText(slots: Slot[]): string {
    const dayOfWeek = convertToTitleCase(slots[0].daysOfWeek[0])
    const formattedSlots = this.formatSlots(slots)
    return `Do you want the ${dayOfWeek} ${formattedSlots} ${slots.length > 1 ? 'sessions' : 'session'} to run today?`
  }

  private createInsetText(futureSameDaySlots: Slot[], allSameDaySlots?: Slot[]): string {
    const dayOfWeek = convertToTitleCase(futureSameDaySlots[0].daysOfWeek[0])
    const formattedFutureSlots = this.formatSlots(futureSameDaySlots)

    // If all same-day slots are in the future, just show what's being added
    if (!allSameDaySlots || allSameDaySlots.length === futureSameDaySlots.length) {
      return `You're adding ${dayOfWeek} ${formattedFutureSlots} to this activity's schedule.`
    }

    // Slots that have already ended (in allSameDaySlots but not in futureSameDaySlots)
    const endedSlots = allSameDaySlots.filter(
      allSlot => !futureSameDaySlots.find(futureSlot => futureSlot.timeSlot === allSlot.timeSlot),
    )

    if (endedSlots.length > 0) {
      const formattedEndedSlots = this.formatSlots(endedSlots)
      const slotWord = endedSlots.length > 1 ? 'sessions' : 'session'
      return `You're adding ${dayOfWeek} ${formattedFutureSlots} to this activity's schedule.<br> The ${formattedEndedSlots} ${slotWord} cannot be added for today as ${endedSlots.length > 1 ? 'they have' : 'it has'} already ended.`
    }

    return `You're adding ${dayOfWeek} ${formattedFutureSlots} to this activity's schedule.`
  }

  private createYesText(slots: Slot[], allSameDaySlots?: Slot[]): string {
    // If all slots are in the future or no allSameDaySlots provided
    if (!allSameDaySlots || allSameDaySlots.length === slots.length) {
      return 'Yes'
    }

    // Some slots have already ended, show only the ones that will run today
    const formattedSlots = this.formatSlots(slots)
    const slotWord = slots.length > 1 ? 'sessions' : 'session'
    return `Yes, the ${formattedSlots} ${slotWord} of this activity will run today`
  }

  private createNoText(futureSameDaySlots: Slot[], allSameDaySlots?: Slot[]): string {
    const dayOfWeek = convertToTitleCase(futureSameDaySlots[0].daysOfWeek[0])
    const formattedSlots = this.formatSlots(futureSameDaySlots)

    // If some slots have already ended (allSameDaySlots is larger than futureSameDaySlots)
    if (allSameDaySlots && allSameDaySlots.length > futureSameDaySlots.length) {
      const slotWord = futureSameDaySlots.length > 1 ? 'sessions' : 'session'
      return `No, add them to ${dayOfWeek} ${formattedSlots} ${slotWord} after today`
    }

    // All slots are in the future or single session
    if (futureSameDaySlots.length > 1) {
      return `No, add the ${dayOfWeek} ${formattedSlots} sessions after today`
    }

    return `No, add the ${dayOfWeek} ${formattedSlots} session after today`
  }

  private formatSlots(slots: Slot[]): string {
    const timeSlots = slots.map(slot => slot.timeSlot)
    return formatListWithAnd(timeSlots)
  }
}
