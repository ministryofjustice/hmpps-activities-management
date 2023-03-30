import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import _ from 'lodash'
import ActivitiesService from '../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../@types/activitiesAPI/types'
import NotAttendedData, {
  AbsenceReasonRequired,
  CaseNoteRequired,
  IncentiveLevelWarningRequired,
  PayRequired,
  ReasonEnteredForAllPrisoners,
} from '../../../validators/validateNotAttendedData'

export class NotAttendedReason {
  @Expose()
  @Type(() => NotAttendedData)
  @ReasonEnteredForAllPrisoners({ message: 'Enter an absence reason for all prisoners' })
  @AbsenceReasonRequired({ message: 'Please enter a reason for the absence' })
  @PayRequired({ message: 'Please specify whether the prisoner should be paid' })
  @CaseNoteRequired({ message: 'Please enter a case note' })
  @IncentiveLevelWarningRequired({
    message: 'Please specify whether this should be recorded as an incentive level warning',
  })
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
        status: 'COMPLETED',
        attendanceReason: notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason,
        comment: notAttendedData[selectedPrisoner.prisonerNumber].moreDetail,
        issuePayment:
          (notAttendedData[selectedPrisoner.prisonerNumber].sickPay
            ? notAttendedData[selectedPrisoner.prisonerNumber].sickPay
            : false) ||
          (notAttendedData[selectedPrisoner.prisonerNumber].restPay
            ? notAttendedData[selectedPrisoner.prisonerNumber].restPay
            : false) ||
          (notAttendedData[selectedPrisoner.prisonerNumber].absencePay
            ? notAttendedData[selectedPrisoner.prisonerNumber].absencePay
            : false),
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
