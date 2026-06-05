import { AllAttendance } from '../../../../@types/activitiesAPI/types'

export const isInPrison = (attendance: AllAttendance) => !attendance.outsideWork
export const isOutsidePaidByPrison = (attendance: AllAttendance) => attendance.outsideWork && attendance.paid
export const isOutsidePaidByEmployer = (attendance: AllAttendance) => attendance.outsideWork && !attendance.paid

export const filterAttendancesByActivityType = (attendanceArray: AllAttendance[], activityTypeFilters: string[]) =>
  attendanceArray.filter(
    a =>
      (activityTypeFilters.includes('inPrison') && isInPrison(a)) ||
      (activityTypeFilters.includes('outsidePrison') && isOutsidePaidByPrison(a)) ||
      (activityTypeFilters.includes('outsideEmployer') && isOutsidePaidByEmployer(a)),
  )
