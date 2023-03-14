import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import _ from 'lodash'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../@types/activitiesAPI/types'
import NotAttendedData, { ReasonEnteredForAllPrisoners } from '../../../validators/validateNotAttendedData'

export class NotAttendedReason {
  @Expose()
  @Type(() => NotAttendedData)
  @ReasonEnteredForAllPrisoners({ message: 'Enter an absence reason for all prisoners' })
  notAttendedData: NotAttendedData
}

export default class NotAttendedReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedPrisoners } = req.session.notAttendedJourney

    const notAttendedReasons = await this.activitiesService
      .getAttendanceReasons(user)
      .then(reasons => reasons.filter(r => r.displayInAbsence))
      .then(reasons => _.sortBy(reasons, 'displaySequence'))

    return res.render('pages/record-attendance/not-attended-reason', { notAttendedReasons, selectedPrisoners })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { notAttendedData }: { notAttendedData: NotAttendedData } = req.body
    const attendanceUpdates: AttendanceUpdateRequest[] = []

    req.session.notAttendedJourney.selectedPrisoners.forEach(selectedPrisoner => {
      attendanceUpdates.push({
        id: selectedPrisoner.attendanceId,
        attendanceReason: notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason,
        comment: notAttendedData[selectedPrisoner.prisonerNumber].moreDetail,
        issuePayment: notAttendedData[selectedPrisoner.prisonerNumber].pay
          ? notAttendedData[selectedPrisoner.prisonerNumber].pay
          : false,
        caseNote: notAttendedData[selectedPrisoner.prisonerNumber].caseNote,
        incentiveLevelWarningIssued: notAttendedData[selectedPrisoner.prisonerNumber].incentiveLevelWarningIssued
          ? notAttendedData[selectedPrisoner.prisonerNumber].incentiveLevelWarningIssued
          : false,
        otherAbsenceReason: notAttendedData[selectedPrisoner.prisonerNumber].absenceReason,
      })
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)
    return res.redirect('attendance-list')
  }
}
