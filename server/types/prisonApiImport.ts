/** Alert */
export type AlertLenient = {
  /** True / False based on alert status */
  active: boolean
  /** First name of the user who added the alert */
  addedByFirstName?: string
  /** Last name of the user who added the alert */
  addedByLastName?: string
  /** Alert Code */
  alertCode: string
  /** Alert Code Description */
  alertCodeDescription: string
  /** Alert Id */
  alertId: number
  /** Alert Type */
  alertType: string
  /** Alert Type Description */
  alertTypeDescription: string
  /** Offender booking id. */
  bookingId: number
  /** Alert comments */
  comment?: string
  /** Date of the alert, which might differ to the date it was created */
  dateCreated: string
  /** Date the alert expires */
  dateExpires?: string
  /** True / False based on presence of expiry date */
  expired: boolean
  /** First name of the user who last modified the alert */
  expiredByFirstName?: string
  /** Last name of the user who last modified the alert */
  expiredByLastName?: string
  /** Offender Unique Reference */
  offenderNo: string
}

/** Location Details */
export type LocationLenient = {
  /** Identifier of Agency this location is associated with. */
  agencyId?: string
  /** Current occupancy of location. */
  currentOccupancy?: number
  /** Location description. */
  description: string
  internalLocationCode?: string
  /** Location identifier. */
  locationId: number
  /** Location prefix. Defines search prefix that will constrain search to this location and its subordinate locations. */
  locationPrefix?: string
  /** Location type. */
  locationType?: string
  /** What events this room can be used for. */
  locationUsage?: string
  /** Operational capacity of the location. */
  operationalCapacity?: number
  /** Identifier of this location's parent location. */
  parentLocationId?: number
  /** User-friendly location description. */
  userDescription?: string
}

/** Prisoner Schedule */
export type PrisonerScheduleLenient = {
  /** Booking id for offender */
  bookingId?: number
  /** Offender cell */
  cellLocation: string
  /** Comment */
  comment: string
  /** Date and time at which event ends */
  endTime?: string
  /** Event code */
  event: string
  /** Description of event code */
  eventDescription: string
  /** Activity id if any. Used to attend or pay the event */
  eventId?: number
  /** Location of the event */
  eventLocation?: string
  /** Id of an internal event location */
  eventLocationId?: number
  /** Attendance, possible values are the codes in the 'PS_PA_OC' reference domain */
  eventOutcome?: string
  /** The event's status. Includes 'CANC', meaning cancelled for 'VISIT' */
  eventStatus?: string
  /** Event type, e.g. VISIT, APP, PRISON_ACT */
  eventType?: string
  /** Activity excluded flag */
  excluded?: boolean
  /** Offender first name */
  firstName: string
  /** Offender last name */
  lastName: string
  /** The code for the activity location */
  locationCode?: string
  /** The number which (uniquely) identifies the internal location associated with the Scheduled Event (Prisoner Schedule) */
  locationId: number
  /** Offender number (e.g. NOMS Number) */
  offenderNo: string
  /** No-pay reason */
  outcomeComment?: string
  /** Activity paid flag */
  paid?: boolean
  /** Amount paid per activity session in pounds */
  payRate?: number
  /** Possible values are the codes in the 'PERFORMANCE' reference domain */
  performance?: string
  /** Date and time at which event starts */
  startTime: string
  /** Event scheduled has been suspended */
  suspended?: boolean
  /** Activity time slot */
  timeSlot?: string
}
/** Assessment */
export type AssessmentLenient = {
  /** Date of assessment approval */
  approvalDate?: string
  /** The assessment creation agency id */
  assessmentAgencyId?: string
  /** Identifies the type of assessment */
  assessmentCode?: string
  /** Comment from assessor */
  assessmentComment?: string
  /** Date assessment was created */
  assessmentDate?: string
  /** Assessment description */
  assessmentDescription?: string
  /** Sequence number of assessment within booking */
  assessmentSeq?: number
  /** The status of the assessment */
  assessmentStatus?: string
  /** Staff member who made the assessment */
  assessorId?: number
  /** Username who made the assessment */
  assessorUser?: string
  /** Booking number */
  bookingId?: number
  /** Indicates the presence of a cell sharing alert */
  cellSharingAlertFlag?: boolean
  /** Classification description */
  classification?: string
  /** Classification code */
  classificationCode?: string
  /** Date of next review */
  nextReviewDate?: string
  /** Offender number (e.g. NOMS Number). */
  offenderNo?: string
}

/** Offender Sentence Detail */
export type OffenderSentenceDetailLenient = {
  /** Agency Description */
  agencyLocationDesc: string
  /** Agency Id */
  agencyLocationId: string
  /** Offender booking id. */
  bookingId: number
  /** Offender date of birth. */
  dateOfBirth: string
  /** Identifier of facial image of offender. */
  facialImageId?: number
  /** First Name */
  firstName: string
  /** Description of the location within the prison */
  internalLocationDesc: string
  /** Last Name */
  lastName: string
  /** Is this the most recent active booking */
  mostRecentActiveBooking: boolean
  /** Offender Unique Reference */
  offenderNo: string
  /** Offender Sentence Detail Information */
  sentenceDetail?: SentenceCalcDates
}

/** Sentence Calculation Dates */
export type SentenceCalcDates = {
  /** APD - the offender's actual parole date. */
  actualParoleDate?: string
  /** ADA - days added to sentence term due to adjustments. */
  additionalDaysAwarded?: number
  /** ARD - calculated automatic (unconditional) release date for offender. */
  automaticReleaseDate?: string
  /** ARD (override) - automatic (unconditional) release override date for offender. */
  automaticReleaseOverrideDate?: string
  /** Offender booking id. */
  bookingId: number
  /** CRD - calculated conditional release date for offender. */
  conditionalReleaseDate?: string
  /** CRD (override) - conditional release override date for offender. */
  conditionalReleaseOverrideDate?: string
  /** Confirmed release date for offender. */
  confirmedReleaseDate?: string
  /** DPRRD - Detention training order post recall release date */
  dtoPostRecallReleaseDate?: string
  /** DPRRD (override) - detention training order post-recall release override date for offender */
  dtoPostRecallReleaseDateOverride?: string
  /** ERSED - the date on which offender will be eligible for early removal (under the Early Removal Scheme for foreign nationals). */
  earlyRemovalSchemeEligibilityDate?: string
  /** ETD - early term date for offender. */
  earlyTermDate?: string
  /** Effective sentence end date */
  effectiveSentenceEndDate?: string
  /** HDCAD - the offender's actual home detention curfew date. */
  homeDetentionCurfewActualDate?: string
  /** HDCED - date on which offender will be eligible for home detention curfew. */
  homeDetentionCurfewEligibilityDate?: string
  /** Offender's home detention curfew end date - calculated as one day before the releaseDate. */
  homeDetentionCurfewEndDate?: string
  /** LTD - late term date for offender. */
  lateTermDate?: string
  /** LED - date on which offender licence expires. */
  licenceExpiryDate?: string
  /** MTD - mid term date for offender. */
  midTermDate?: string
  /** Release date for non-DTO sentence (if applicable). This will be based on one of ARD, CRD, NPD or PRRD. */
  nonDtoReleaseDate?: string
  /** Indicates which type of non-DTO release date is the effective release date. One of 'ARD', 'CRD', 'NPD' or 'PRRD'. */
  nonDtoReleaseDateType: string
  /** NPD - calculated non-parole date for offender (relating to the 1991 act). */
  nonParoleDate?: string
  /** NPD (override) - non-parole override date for offender. */
  nonParoleOverrideDate?: string
  /** PED - date on which offender is eligible for parole. */
  paroleEligibilityDate?: string
  /** PRRD - calculated post-recall release date for offender. */
  postRecallReleaseDate?: string
  /** PRRD (override) - post-recall release override date for offender. */
  postRecallReleaseOverrideDate?: string
  /** Confirmed, actual, approved, provisional or calculated release date for offender, according to offender release date algorithm.<h3>Algorithm</h3><ul><li>If there is a confirmed release date, the offender release date is the confirmed release date.</li><li>If there is no confirmed release date for the offender, the offender release date is either the actual parole date or the home detention curfew actual date.</li><li>If there is no confirmed release date, actual parole date or home detention curfew actual date for the offender, the release date is the later of the nonDtoReleaseDate or midTermDate value (if either or both are present)</li></ul> */
  releaseDate?: string
  /** ROTL - the date on which offender will be released on temporary licence. */
  releaseOnTemporaryLicenceDate?: string
  /** SED - date on which sentence expires. */
  sentenceExpiryDate?: string
  /** Sentence start date. */
  sentenceStartDate: string
  /** Date on which minimum term is reached for parole (indeterminate/life sentences). */
  tariffDate?: string
  /** TERSED - Tariff early removal scheme eligibility date */
  tariffEarlyRemovalSchemeEligibilityDate?: string
  /** TUSED - top-up supervision expiry date for offender. */
  topupSupervisionExpiryDate?: string
  /** Top-up supervision start date for offender - calculated as licence end date + 1 day or releaseDate if licence end date not set. */
  topupSupervisionStartDate?: string
}
