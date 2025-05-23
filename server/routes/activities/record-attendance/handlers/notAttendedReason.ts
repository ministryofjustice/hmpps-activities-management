import { Request, Response } from 'express'
import { Transform, Type } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  MaxLength,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
} from 'class-validator'
import _ from 'lodash'
import ActivitiesService from '../../../../services/activitiesService'
import AttendanceStatus from '../../../../enum/attendanceStatus'
import AttendanceReason from '../../../../enum/attendanceReason'
import { convertToTitleCase } from '../../../../utils/utils'
import { YesNo } from '../../../../@types/activities'

const getPrisonerName = (args: ValidationArguments) => (args.object as NotAttendedData)?.prisonerName

export class NotAttendedData {
  prisonerNumber: string

  prisonerName: string

  @Transform(({ value }) => +value)
  @IsPositive()
  instanceId: number

  @Transform(({ value }) => value !== 'false')
  isPayable: boolean

  @IsEnum(AttendanceReason, { message: args => `Select an absence reason for ${getPrisonerName(args)}` })
  notAttendedReason: AttendanceReason

  @ValidateIf(o => AttendanceReason.SICK === o.notAttendedReason && o.isPayable)
  @IsEnum(YesNo, { message: (args: ValidationArguments) => `Select if ${getPrisonerName(args)} should be paid` })
  sickPay?: YesNo

  @ValidateIf(o => AttendanceReason.REST === o.notAttendedReason && o.isPayable)
  @IsEnum(YesNo, { message: (args: ValidationArguments) => `Select if ${getPrisonerName(args)} should be paid` })
  restPay?: YesNo

  @ValidateIf(o => AttendanceReason.OTHER === o.notAttendedReason)
  @IsNotEmpty({ message: args => `Enter an absence reason for ${getPrisonerName(args)}` })
  @MaxLength(100, { message: 'Absence reason must be $constraint1 characters or less' })
  otherAbsenceReason?: string

  @ValidateIf(o => AttendanceReason.OTHER === o.notAttendedReason && o.isPayable)
  @IsEnum(YesNo, {
    message: (args: ValidationArguments) =>
      `Select if this is an acceptable absence for ${getPrisonerName(args)} and they should be paid`,
  })
  otherAbsencePay?: YesNo

  @ValidateIf(o => AttendanceReason.SICK === o.notAttendedReason)
  @IsOptional()
  @MaxLength(100, { message: 'Additional details must be $constraint1 characters or less' })
  moreDetail?: string

  @ValidateIf(o => AttendanceReason.REFUSED === o.notAttendedReason)
  @IsNotEmpty({ message: args => `Enter a case note for ${getPrisonerName(args)}` })
  @MaxLength(3800, { message: 'Case note must be $constraint1 characters or less' })
  caseNote?: string

  @ValidateIf(o => AttendanceReason.REFUSED === o.notAttendedReason)
  @IsEnum(YesNo, {
    message: (args: ValidationArguments) =>
      `Select if there should be an incentive level warning for ${getPrisonerName(args)}`,
  })
  incentiveLevelWarningIssued?: YesNo

  getIssuePayment() {
    if (this.sickPay === YesNo.YES && this.notAttendedReason === AttendanceReason.SICK) return true
    if (this.restPay === YesNo.YES && this.notAttendedReason === AttendanceReason.REST) return true
    if (this.otherAbsencePay === YesNo.YES && this.notAttendedReason === AttendanceReason.OTHER) return true
    return [AttendanceReason.NOT_REQUIRED, AttendanceReason.CLASH].includes(this.notAttendedReason)
  }

  getIncentiveLevelWarning = () =>
    this.notAttendedReason === AttendanceReason.REFUSED && this.incentiveLevelWarningIssued === YesNo.YES

  getMoreDetails = () => (this.notAttendedReason === AttendanceReason.SICK ? this.moreDetail : null)

  getOtherAbsenceReason = () => (this.notAttendedReason === AttendanceReason.OTHER ? this.otherAbsenceReason : null)

  getCaseNote = () => (this.notAttendedReason === AttendanceReason.REFUSED ? this.caseNote : null)
}

export class NotAttendedForm {
  @Type(() => NotAttendedData)
  @ValidateNested({ each: true })
  notAttendedData: NotAttendedData[]
}

export default class NotAttendedReasonRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { selectedPrisoners } = req.session.recordAttendanceJourney.notAttended

    const notAttendedReasons = (await this.activitiesService.getAttendanceReasons(user))
      .filter(r => r.displayInAbsence)
      .sort((r1, r2) => r1.displaySequence - r2.displaySequence)

    const instances = await Promise.all(
      _.uniq(selectedPrisoners.map(prisoner => prisoner.instanceId)).map(instanceId =>
        this.activitiesService.getScheduledActivity(instanceId, user),
      ),
    )

    const rows = selectedPrisoners.map(prisoner => {
      const instance = instances.find(inst => inst.id === prisoner.instanceId)

      return {
        ...prisoner,
        instanceId: instance.id,
        activityName: instance.activitySchedule.activity.summary,
        session: instance.timeSlot,
        isPayable: instance.activitySchedule.activity.paid,
      }
    })

    if (selectedPrisoners.length === 1) {
      res.render(`pages/activities/record-attendance/not-attended-reason`, {
        notAttendedReasons,
        rows,
      })
    } else {
      res.render(`pages/activities/record-attendance/not-attended-reason-multiple`, {
        notAttendedReasons,
        rows,
      })
    }
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { notAttendedData }: { notAttendedData: NotAttendedData[] } = req.body
    const { selectedPrisoners } = req.session.recordAttendanceJourney.notAttended

    const instances = await Promise.all(
      _.uniq(selectedPrisoners.map(prisoner => prisoner.instanceId)).map(async instanceId =>
        this.activitiesService.getScheduledActivity(instanceId, user),
      ),
    )

    const attendanceUpdates = selectedPrisoners.map(selectedPrisoner => {
      const prisonerAttendance = notAttendedData.find(
        a => a.prisonerNumber === selectedPrisoner.prisonerNumber && a.instanceId === selectedPrisoner.instanceId,
      )

      if (!prisonerAttendance) return null

      const instance = instances.find(inst => inst.id === selectedPrisoner.instanceId)

      const isPaid = instance.activitySchedule.activity.paid

      return {
        id: selectedPrisoner.attendanceId,
        prisonCode: user.activeCaseLoadId,
        status: AttendanceStatus.COMPLETED,
        attendanceReason: prisonerAttendance.notAttendedReason,
        comment: prisonerAttendance.getMoreDetails(),
        issuePayment: prisonerAttendance.getIssuePayment() && isPaid,
        caseNote: prisonerAttendance.getCaseNote(),
        incentiveLevelWarningIssued: prisonerAttendance.getIncentiveLevelWarning(),
        otherAbsenceReason: prisonerAttendance.getOtherAbsenceReason(),
      }
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)

    const successMessage = `You've saved attendance details for ${
      selectedPrisoners.length === 1
        ? convertToTitleCase(selectedPrisoners[0].prisonerName)
        : `${selectedPrisoners.length} attendees`
    }`

    const returnUrl = req.session.recordAttendanceJourney.singleInstanceSelected
      ? `${selectedPrisoners[0].instanceId}/attendance-list`
      : 'attendance-list'

    res.redirectWithSuccess(returnUrl, 'Attendance recorded', successMessage)
  }
}
