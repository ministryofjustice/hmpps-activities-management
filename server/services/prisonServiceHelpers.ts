import { CourtEvent, TransferEvent } from '../@types/prisonApiImport/types'
import { isAfterToday, sortByDateTime } from '../utils/utils'
import { AttendancesResponse } from '../@types/whereaboutsApiImport/types'
import { AttendanceInfo, EventLite, EventStatus } from '../types/dps'
import {
  AlertLenient,
  AssessmentLenient,
  OffenderSentenceDetailLenient,
  PrisonerScheduleLenient,
} from '../types/prisonApiImport'

export const offenderNumberMultiMap = (offenderNumbers: string[]) =>
  offenderNumbers.reduce(
    (map: Map<string, PrisonerScheduleLenient[]>, offenderNumber: string) => map.set(offenderNumber, []),
    new Map(),
  )

export const sortActivitiesByEventThenByLastName = (data: PrisonerScheduleLenient[]) => {
  data.sort((a, b) => {
    if (a.comment < b.comment) return -1
    if (a.comment > b.comment) return 1

    if (a.lastName < b.lastName) return -1
    if (a.lastName > b.lastName) return 1

    return 0
  })
}

export const isReleaseScheduled = (
  releaseScheduledData: OffenderSentenceDetailLenient[],
  offenderNo: string,
  formattedDate: string,
) =>
  Boolean(
    releaseScheduledData &&
      releaseScheduledData.length &&
      releaseScheduledData.filter(
        release =>
          release.offenderNo === offenderNo &&
          release.sentenceDetail.releaseDate === formattedDate &&
          !isAfterToday(formattedDate),
      )[0],
  )

const eventStatusByCode = (eventStatusCode: string): EventStatus => {
  switch (eventStatusCode) {
    case 'SCH':
      return { scheduled: true }
    case 'CANC':
      return { cancelled: true }
    case 'EXP':
      return { expired: true }
    case 'COMP':
      return { complete: true }
    default:
      return { unCheckedStatus: eventStatusCode }
  }
}

const toEventLite = (event: CourtEvent): EventLite => ({
  eventId: event.eventId,
  eventDescription: 'Court visit scheduled',
  ...eventStatusByCode(event.eventStatus),
})

const latestCompletedCourtEvent = (events: CourtEvent[]) => {
  const courtEvents = events
    .filter(event => event.eventStatus === 'COMP')
    .sort((left, right) => sortByDateTime(left.startTime, right.startTime))
  const event = courtEvents[courtEvents.length - 1]
  return event && toEventLite(event)
}

export const getOffenderCourtEvents = (courtEvents: CourtEvent[], offenderNo: string, formattedDate: string) => {
  const events =
    (courtEvents &&
      courtEvents.length &&
      courtEvents.filter(
        (courtEvent: CourtEvent) => courtEvent.offenderNo === offenderNo && !isAfterToday(formattedDate),
      )) ||
    []

  const scheduledAndExpiredCourtEvents = events
    .filter(event => event.eventStatus !== 'COMP')
    .map(event => toEventLite(event))

  const completedEvent = latestCompletedCourtEvent(events)

  if (completedEvent) {
    return [...scheduledAndExpiredCourtEvents, completedEvent]
  }
  return scheduledAndExpiredCourtEvents
}

export const getScheduledTransfers = (transfers: TransferEvent[], offenderNo: string, isoDate: string) =>
  (transfers &&
    transfers.length &&
    transfers
      .filter(transfer => transfer.offenderNo === offenderNo && !isAfterToday(isoDate))
      .map(event => ({
        eventId: event.eventId,
        eventDescription: 'Transfer scheduled',
        ...eventStatusByCode(event.eventStatus),
      }))) ||
  []

export const isViewableFlag = (code: string): boolean =>
  ['HA', 'XEL', 'PEEP', 'RNO121', 'RCON', 'RCDR', 'URCU', 'UPIU', 'USU', 'URS'].includes(code)

export const selectAlertFlags = (alertData: AlertLenient[], offenderNumber: string) => {
  const alertFlags =
    (alertData &&
      alertData
        .filter(alert => !alert.expired && alert.offenderNo === offenderNumber && isViewableFlag(alert.alertCode))
        .map(alert => alert.alertCode)) ||
    []
  return Array.from(new Set(alertFlags))
}

export const selectCategory = (assessmentData: AssessmentLenient[], offenderNumber: string) => {
  if (!assessmentData) {
    return ''
  }
  const cat = assessmentData.find(assessment => assessment.offenderNo === offenderNumber)
  if (!cat) {
    return ''
  }
  return cat.classificationCode
}

export const extractAttendanceInfo = (
  attendanceInformation: AttendancesResponse,
  event: PrisonerScheduleLenient,
): AttendanceInfo => {
  if (attendanceInformation && attendanceInformation.attendances && attendanceInformation.attendances.length > 0) {
    const offenderAttendanceInfo = attendanceInformation.attendances.find(
      attendance => attendance.bookingId === event.bookingId && attendance.eventId === event.eventId,
    )
    if (!offenderAttendanceInfo) return null

    const { id, absentReason, absentReasonDescription, absentSubReason, attended, paid, comments, locked } =
      offenderAttendanceInfo || {}

    const attendanceInfo = absentReason
      ? {
          id,
          absentReason: { value: absentReason, name: absentReasonDescription },
          absentSubReason,
          comments,
          paid,
          locked,
        }
      : { id, comments, paid, locked }

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'other' does not exist on type '{ id: any... Remove this comment to see the full error message
    if (absentReason) attendanceInfo.other = true
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'pay' does not exist on type '{ id: any; ... Remove this comment to see the full error message
    if (attended && paid) attendanceInfo.pay = true

    return attendanceInfo
  }

  return null
}
