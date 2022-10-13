/** @description Attendance details */
export type CreateAttendanceDtoLenient = {
  /** Format: int64 */
  bookingId: number
  /** Format: int64 */
  eventId: number
  /** Format: int64 */
  eventLocationId: number
  /** @enum {string} */
  period: string
  prisonId: string
  attended: boolean
  paid: boolean
  /** @enum {string} */
  absentReason?: string
  /** @enum {string} */
  absentSubReason?: string
  /** Format: date */
  eventDate: string
  comments?: string
}

export type UpdateAttendanceDtoLenient = {
  attended: boolean
  paid: boolean
  /** @enum {string} */
  absentReason?: string
  /** @enum {string} */
  absentSubReason?: string
  comments?: string
}

export type AbsentSubReasonDtoLenient = {
  code: string
  name: string
}

export type AbsentReasonDtoLenient = {
  code: string
  name: string
}

export type AbsentReasonsDtoLenient = {
  paidReasons: AbsentReasonDtoLenient[]
  unpaidReasons: AbsentReasonDtoLenient[]
  triggersIEPWarning: string[]
  triggersAbsentSubReason: string[]
  paidSubReasons: AbsentSubReasonDtoLenient[]
  unpaidSubReasons: AbsentSubReasonDtoLenient[]
}
