import _ from 'lodash'

export interface ParsedAttendances {
  instanceIds: number[]
  prisonerNumbers: string[]
}

/**
 * Parses selected attendances string into instance IDs and prisoner numbers
 * Format: "instanceId1,instanceId2-attendance1-prisonerNumber" or "instanceId-attendance1-prisonerNumber"
 */
export const parseSelectedAttendances = (selectedAttendances: string[]): ParsedAttendances => {
  const instanceIds = _.uniq(
    selectedAttendances.flatMap(selectedAttendance => selectedAttendance.split('-')[0].split(',')),
  ).map(Number)

  const prisonerNumbers = _.uniq(selectedAttendances.map(selectedAttendance => selectedAttendance.split('-')[2]))

  return { instanceIds, prisonerNumbers }
}

/**
 * Extracts prisoner number from a selected attendance string
 * Format: "instanceId1,instanceId2-attendance1-prisonerNumber"
 */
export const getPrisonerNumberFromAttendance = (selectedAttendance: string): string => {
  return selectedAttendance.split('-')[2]
}

/**
 * Extracts instance IDs from a selected attendance string
 * Format: "instanceId1,instanceId2-attendance1-prisonerNumber"
 */
export const getInstanceIdsFromAttendance = (selectedAttendance: string): number[] => {
  return selectedAttendance.split('-')[0].split(',').map(Number)
}
