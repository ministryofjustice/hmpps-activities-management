import { ActivityCategory, ScheduledInstanceAttendanceSummary } from '../../../../@types/activitiesAPI/types'
import LocationType from '../../../../enum/locationType'
import { asString } from '../../../../utils/utils'
import TimeSlot from '../../../../enum/timeSlot'

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
          return a.internalLocation?.id === +asString(locationId)
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

  return filteredActivities
    .map(a => {
      const session = TimeSlot[a.timeSlot]
      return {
        ...a,
        session,
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
