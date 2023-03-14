import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import _ from 'lodash'
import { IsArray, ValidateNested } from 'class-validator'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../@types/activitiesAPI/types'
import NotAttendedData from '../../../validators/validateNotAttendedData'

export class NotAttendedReason {
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotAttendedData)
  notAttendedData: NotAttendedData[]
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
    const instanceId = req.params.id
    const attendanceUpdates: AttendanceUpdateRequest[] = []

    req.session.notAttendedJourney.selectedPrisoners.forEach(selectedPrisoner => {
      attendanceUpdates.push({
        id: selectedPrisoner.attendanceId,
        attendanceReason: req.body.notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason,
        comment: req.body.notAttendedData[selectedPrisoner.prisonerNumber].moreDetail,
        issuePayment: req.body.notAttendedData[selectedPrisoner.prisonerNumber].pay
          ? req.body.notAttendedData[selectedPrisoner.prisonerNumber].pay
          : false,
        caseNote: req.body.notAttendedData[selectedPrisoner.prisonerNumber].caseNote,
        incentiveLevelWarningIssued: req.body.notAttendedData[selectedPrisoner.prisonerNumber]
          .incentiveLevelWarningIssued
          ? req.body.notAttendedData[selectedPrisoner.prisonerNumber].incentiveLevelWarningIssued
          : false,
        otherAbsenceReason: req.body.notAttendedData[selectedPrisoner.prisonerNumber].absenceReason,
      })
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)
    res.redirectOrReturn(`/attendance/activities/${instanceId}/attendance-list`)
  }
}
