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

export enum PrisonerStatus {
  ACTIVE_IN = 'ACTIVE IN',
  ACTIVE_OUT = 'ACTIVE OUT',
  INACTIVE_OUT = 'INACTIVE OUT',
}
