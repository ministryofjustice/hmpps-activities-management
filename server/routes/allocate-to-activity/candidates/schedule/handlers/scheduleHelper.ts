import { parse, isBefore } from 'date-fns'
import { ActivitySchedule } from '../../../../../@types/activitiesAPI/types'

export type ScheduleSlotListTableCell = {
  text?: string
  html?: string
}

export const mapToTableRows = (schedule: ActivitySchedule): ScheduleSlotListTableCell[][] => {
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
    const matchedDay = schedule.daysOfWeek.filter(sd => day.startsWith(sd)).length === 1

    const start = parse(schedule.startTime, 'HH:mm', new Date())
    const pmStart = parse('12:00', 'HH:mm', new Date())
    const edStart = parse('16:00', 'HH:mm', new Date())
    const yesHtml = '<strong class="govuk-tag">YES</strong>'
    const noHtml = '<strong class="govuk-tag govuk-tag--grey">NO</strong>'

    return [
      { text: day },
      { html: matchedDay && isBefore(start, pmStart) ? yesHtml : noHtml },
      { html: matchedDay && !isBefore(start, pmStart) && isBefore(start, edStart) ? yesHtml : noHtml },
      { html: matchedDay && !isBefore(start, edStart) ? yesHtml : noHtml },
    ]
  })
}
