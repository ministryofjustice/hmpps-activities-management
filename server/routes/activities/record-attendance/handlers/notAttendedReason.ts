import { Request, Response } from 'express'
import { Expose, Type } from 'class-transformer'
import _ from 'lodash'
import { ValidationArguments } from 'class-validator'
import ActivitiesService from '../../../../services/activitiesService'
import { AttendanceUpdateRequest } from '../../../../@types/activitiesAPI/types'
import NotAttendedData, {
  AbsenceReasonRequired,
  CaseNoteRequired,
  IncentiveLevelWarningRequired,
  PayRequired,
  ReasonEnteredForAllPrisoners,
} from '../../../../validators/validateNotAttendedData'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'
import { convertToTitleCase } from '../../../../utils/utils'
import { NotAttendedJourney } from '../journey'

export class NotAttendedReason {
  @Expose()
  @Type(() => NotAttendedData)
  @ReasonEnteredForAllPrisoners({
    message: (args: ValidationArguments) => {
      const { notAttendedJourney } = args.object as { notAttendedJourney: NotAttendedJourney }
      const { selectedPrisoners } = notAttendedJourney
      const numberOfPrisoners = selectedPrisoners.length
      return numberOfPrisoners === 1
        ? 'Select why they did not attend'
        : `Select an absence reason for ${numberOfPrisoners} people`
    },
  })
  @AbsenceReasonRequired({
    message: (args: ValidationArguments) => {
      const { notAttendedJourney } = args.object as { notAttendedJourney: NotAttendedJourney }
      const { selectedPrisoners } = notAttendedJourney
      const numberOfPrisoners = selectedPrisoners.length
      return numberOfPrisoners === 1 ? 'Enter an absence reason' : 'Enter an absence reason for the people'
    },
  })
  @PayRequired({
    message: (args: ValidationArguments) => {
      const { notAttendedJourney } = args.object as { notAttendedJourney: NotAttendedJourney }
      const { selectedPrisoners } = notAttendedJourney
      const numberOfPrisoners = selectedPrisoners.length
      return numberOfPrisoners === 1 ? 'Select if the person should be paid' : 'Select if the people should be paid'
    },
  })
  @CaseNoteRequired({
    message: (args: ValidationArguments) => {
      const { notAttendedJourney } = args.object as { notAttendedJourney: NotAttendedJourney }
      const { selectedPrisoners } = notAttendedJourney
      const numberOfPrisoners = selectedPrisoners.length
      return numberOfPrisoners === 1 ? 'Enter a case note' : 'Enter a case note for the people'
    },
  })
  @IncentiveLevelWarningRequired({
    message: (args: ValidationArguments) => {
      const { notAttendedJourney } = args.object as { notAttendedJourney: NotAttendedJourney }
      const { selectedPrisoners } = notAttendedJourney
      const numberOfPrisoners = selectedPrisoners.length
      return numberOfPrisoners === 1
        ? 'Select if there should be an incentive level warning'
        : 'Select if there should be an incentive level warning for the people'
    },
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

    return res.render('pages/activities/record-attendance/not-attended-reason', {
      notAttendedReasons,
      selectedPrisoners,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { notAttendedData }: { notAttendedData: NotAttendedData } = req.body
    const attendanceUpdates: AttendanceUpdateRequest[] = []

    const { selectedPrisoners } = req.session.notAttendedJourney

    selectedPrisoners.forEach(selectedPrisoner => {
      attendanceUpdates.push({
        id: selectedPrisoner.attendanceId,
        prisonCode: user.activeCaseLoadId,
        status: AttendanceStatus.COMPLETED,
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
            : false) ||
          notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === AttendanceReason.NOT_REQUIRED ||
          notAttendedData[selectedPrisoner.prisonerNumber].notAttendedReason === AttendanceReason.CLASH,
        caseNote: notAttendedData[selectedPrisoner.prisonerNumber].caseNote,
        incentiveLevelWarningIssued: notAttendedData[selectedPrisoner.prisonerNumber].incentiveLevelWarningIssued
          ? notAttendedData[selectedPrisoner.prisonerNumber].incentiveLevelWarningIssued
          : false,
        otherAbsenceReason: notAttendedData[selectedPrisoner.prisonerNumber].absenceReason,
      })
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)

    const successMessage =
      selectedPrisoners.length === 1
        ? `We've saved attendance details for ${convertToTitleCase(selectedPrisoners[0].prisonerName)}`
        : `We've saved attendance details for ${selectedPrisoners.length} people`

    return res.redirectWithSuccess('attendance-list', 'Attendance recorded', successMessage)
  }
}
