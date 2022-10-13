import { format, parseISO } from 'date-fns'
import { removeBlanks } from '../../../utils/utils'
import { ActivityByLocation, ActivityListTableRow, EventLite } from '../../../@types/dps'
import { PrisonerScheduleLenient } from '../../../@types/prisonApiImportCustom'

export const shouldShowOtherActivities = (offenderMainEvent: ActivityByLocation): boolean =>
  Boolean(
    offenderMainEvent && // (offenderMainEvent.activities && offenderMainEvent.activities.length > 1) ||
      (offenderMainEvent.eventsElsewhere ||
        offenderMainEvent.releaseScheduled ||
        offenderMainEvent.courtEvents ||
        offenderMainEvent.scheduledTransfers),
  )

const getEventSuffix = (event: EventLite): string => {
  let suffix = ''
  if (event.expired) {
    suffix += '(expired)'
  }
  if (event.complete) {
    suffix += '(complete)'
  }
  if (event.cancelled) {
    suffix += '(cancelled)'
  }
  return suffix
}

export const getAlertValues = (alertFlags: string[], category: string) => {
  const alerts = alertFlags.map(a => {
    switch (a) {
      case 'HA':
        return 'ACCT'
      case 'RCON':
        return 'CONFLICT'
      case 'XEL':
        return 'E-LIST'
      case 'RN0121':
        return 'NO ONE-TO-ONE'
      case 'RCDR':
        return 'QUARANTINED'
      case 'URCU':
        return 'REVERSE COHORTING UNIT'
      case 'UPIU':
        return 'PROTECTIVE ISOLATION UNIT'
      case 'USU':
        return 'SHIELDING UNIT'
      case 'URS':
        return 'REFUSING TO SHIELD'
      default:
        return a
    }
  })

  switch (category) {
    case 'A':
      alerts.push('CAT A')
      break
    case 'E':
      alerts.push('CAT A')
      break
    case 'H':
      alerts.push('CAT A High')
      break
    case 'P':
      alerts.push('CAT A Prov')
      break
    default:
    // no op
  }
  return alerts
}

const getMainEventDescription = (activity: ActivityByLocation) => {
  if (activity.eventType === 'PRISON_ACT' || activity.event === 'PA') {
    return activity.comment
  }
  return removeBlanks([activity.eventDescription, activity.comment]).join(' - ')
}

export const getMainEventSummary = (activity: ActivityByLocation) => {
  const summary = `${format(parseISO(activity.startTime), 'HH:mm')} - ${getMainEventDescription(activity)}`
  if (activity.suspended) {
    return `${summary} (suspended)`
  }
  if (activity.event === 'VISIT' && activity.eventStatus === 'CANC') {
    return `${summary} (cancelled)`
  }
  return summary
}

const getEventDescription = (activity: PrisonerScheduleLenient) => {
  if (activity.eventType === 'PRISON_ACT' || activity.event === 'PA') {
    return activity.comment
  }
  return removeBlanks([activity.eventDescription, activity.eventLocation, activity.comment]).join(' - ')
}

const getOtherEventDescription = (activity: PrisonerScheduleLenient) => {
  const parts = [
    `${format(parseISO(activity.startTime), 'HH:mm')}`,
    activity.event !== 'VISIT' && activity.endTime && `${format(parseISO(activity.endTime), 'HH:mm')}`,
    getEventDescription(activity),
  ]
  const text = parts.filter(part => !!part).join(' - ')
  const cancelled = activity.event === 'VISIT' && activity.eventStatus === 'CANC'
  if (cancelled) {
    return `${text} (cancelled)`
  }
  return text
}

export const getOtherEventsSummary = (activity: ActivityByLocation) => {
  const summary = []
  if (activity.releaseScheduled) {
    summary.push('Release scheduled')
  }
  if (activity.courtEvents) {
    summary.push(
      ...activity.courtEvents.map((event: EventLite) => {
        const suffix = getEventSuffix(event)
        return `${event.eventDescription} ${suffix}`
      }),
    )
  }
  if (activity.scheduledTransfers) {
    summary.push(
      ...activity.scheduledTransfers.map((event: EventLite) => {
        const suffix = getEventSuffix(event)
        return `${event.eventDescription} ${suffix}`
      }),
    )
  }
  if (activity.eventsElsewhere) {
    summary.push(
      ...activity.eventsElsewhere.map((event: PrisonerScheduleLenient) => {
        return getOtherEventDescription(event)
      }),
    )
  }
  return summary.join(', ')
}

export const mapToTableRow = (activity: ActivityByLocation): ActivityListTableRow => {
  const alerts = getAlertValues(activity.alertFlags, activity.category)
  const mainEventSummary = getMainEventSummary(activity)
  const otherEventsSummary = shouldShowOtherActivities(activity) ? getOtherEventsSummary(activity) : ''

  return {
    bookingId: activity.bookingId,
    eventId: activity.eventId,
    name: `${activity.lastName.charAt(0) + activity.lastName.substring(1).toLowerCase()}, ${
      activity.firstName.charAt(0) + activity.firstName.substring(1).toLowerCase()
    }`,
    location: activity.cellLocation,
    prisonNumber: activity.offenderNo,
    relevantAlerts: alerts,
    activity: mainEventSummary,
    otherActivities: otherEventsSummary,
    attended: activity.attendanceInfo?.attended,
  }
}
