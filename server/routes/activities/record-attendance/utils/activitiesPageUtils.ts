import { ActivityCategory, ScheduledInstanceAttendanceSummary } from '../../../../@types/activitiesAPI/types'
import LocationType from '../../../../enum/locationType'
import TimeSlot from '../../../../enum/timeSlot'
import { formatIsoDate } from '../../../../utils/datePickerUtils'

export const filterItems = (
  categories: ActivityCategory[],
  filterValues: { [key: string]: string[] },
  locationId: string,
  locationType: string,
) => {
  const categoryFilters = categories.map(category => ({
    value: category.code,
    text: category.name,
    checked: filterValues.categoryFilters?.includes(category.code) ?? true,
  }))
  const sessionFilters = [
    { value: 'AM', text: 'Morning (AM)' },
    { value: 'PM', text: 'Afternoon (PM)' },
    { value: 'ED', text: 'Evening (ED)' },
  ].map(c => ({ ...c, checked: filterValues.sessionFilters?.includes(c.value) ?? true }))

  return {
    sessionFilters,
    categoryFilters,
    locationType,
    locationId: locationType === LocationType.OUT_OF_CELL ? locationId : null,
  }
}

export const activityRows = (
  activityDate: Date,
  categories: ActivityCategory[],
  activityAttendanceSummary: ScheduledInstanceAttendanceSummary[],
  filterValues: { [key: string]: string[] },
  locationId: string,
  locationType: string,
  searchTerm: string,
  isUncancelPage: boolean = false,
) => {
  const selectedCategoryIds = categories
    .filter(c => filterValues.categoryFilters?.includes(c.code) ?? true)
    .map(c => c.id)

  const filteredActivities = activityAttendanceSummary
    .filter(a => (isUncancelPage ? a.cancelled : true))
    .filter(a => (searchTerm ? a.summary.toLowerCase().includes(searchTerm.toLowerCase()) : true))
    .filter(a => filterValues.sessionFilters?.includes(a.timeSlot) ?? true)
    .filter(a => selectedCategoryIds?.includes(a.categoryId) ?? true)
    .filter(a => {
      switch (locationType) {
        case LocationType.OUT_OF_CELL:
          return a.dpsLocationId === locationId
        case LocationType.IN_CELL:
          return a.inCell
        case LocationType.ON_WING:
          return a.onWing
        case LocationType.OFF_WING:
          return a.offWing
        default:
          return true
      }
    })

  const today = formatIsoDate(new Date())
  const formattedActivityDate = formatIsoDate(activityDate)

  return filteredActivities
    .map(activity => {
      let allowSelection: boolean
      let allocatedCount: number
      const session = TimeSlot[activity.timeSlot]

      if (formattedActivityDate === today) {
        allocatedCount = activity.attendanceSummary.attendees
      } else {
        allocatedCount = activity.attendanceSummary.allocations
      }

      if (isUncancelPage) {
        allowSelection =
          activity.cancelled && activity.attendanceRequired && allocatedCount > 0 && !(formattedActivityDate < today)
      } else {
        allowSelection = !activity.cancelled && activity.attendanceRequired && allocatedCount > 0
      }

      return {
        ...activity,
        session,
        allowSelection,
      }
    })
    .filter(a => !filterValues.sessionFilters || filterValues.sessionFilters.includes(a.session))
    .sort((a, b) => {
      if (a.startTime !== b.startTime) {
        return a.startTime.localeCompare(b.startTime)
      }
      return a.endTime.localeCompare(b.endTime)
    })
}
