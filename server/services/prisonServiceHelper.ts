import { CourtEvent, TransferEvent } from '../@types/prisonApiImport/types'
import { isAfterToday, sortByDateTime } from '../utils/utils'
import { EventLite, EventStatus } from '../@types/dps'
import {
  AlertLenient,
  AssessmentLenient,
  OffenderSentenceDetailLenient,
  PrisonerScheduleLenient,
} from '../@types/prisonApiImportCustom'

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

export const getScheduledTransfers = (transfers: TransferEvent[], offenderNo: string, isoDate: string): EventLite[] =>
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
