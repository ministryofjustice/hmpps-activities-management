import { ActivityListTableRow, ActivityScheduleAllocation, PrisonerAlert } from '../../../@types/activities'

export const getAlertValues = (alerts: PrisonerAlert[], category: string) => {
  const alertsValues: string[] = alerts.map(a => {
    switch (a.alertCode) {
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
      case 'PEEP':
        return 'PEEP'
      default:
        return undefined
    }
  })

  switch (category) {
    case 'A':
      alertsValues.push('CAT A')
      break
    case 'E':
      alertsValues.push('CAT A')
      break
    case 'H':
      alertsValues.push('CAT A High')
      break
    case 'P':
      alertsValues.push('CAT A Prov')
      break
    default:
    // no op
  }
  return alertsValues.filter(av => av !== undefined)
}

export const mapToTableRow = (activityScheduleAllocation: ActivityScheduleAllocation): ActivityListTableRow => {
  const alerts = getAlertValues(
    activityScheduleAllocation.prisoner.alerts,
    activityScheduleAllocation.prisoner.category,
  )
  return {
    id: activityScheduleAllocation.activityScheduleId,
    name: `${
      activityScheduleAllocation.prisoner.lastName.charAt(0) +
      activityScheduleAllocation.prisoner.lastName.substring(1).toLowerCase()
    }, ${
      activityScheduleAllocation.prisoner.firstName.charAt(0) +
      activityScheduleAllocation.prisoner.firstName.substring(1).toLowerCase()
    }`,
    location: activityScheduleAllocation.prisoner.cellLocation,
    prisonNumber: activityScheduleAllocation.prisoner.prisonerNumber,
    relevantAlerts: alerts,
    activity: activityScheduleAllocation.description,
    attended: activityScheduleAllocation.attendance?.attendanceReason
      ? activityScheduleAllocation.attendance?.attendanceReason.code === 'ATT'
      : undefined,
  }
}
