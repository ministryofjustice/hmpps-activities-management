import { AllAttendance } from '../../../../@types/activitiesAPI/types'

const isInPrison = (attendance: AllAttendance) => !attendance.outsideWork
const isOutsidePaidByPrison = (attendance: AllAttendance) => attendance.outsideWork && attendance.paid
const isOutsidePaidByEmployer = (attendance: AllAttendance) => attendance.outsideWork && !attendance.paid

const filterByLocation = (attendanceArray: AllAttendance[], locationFilters: string[]) =>
  attendanceArray.filter(
    a =>
      (locationFilters.includes('inPrison') && isInPrison(a)) ||
      (locationFilters.includes('outsidePrison') && isOutsidePaidByPrison(a)) ||
      (locationFilters.includes('outsideEmployer') && isOutsidePaidByEmployer(a)),
  )

export default filterByLocation
