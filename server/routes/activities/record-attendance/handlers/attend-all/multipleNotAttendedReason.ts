/* eslint-disable no-param-reassign */
import { Request, Response } from 'express'
import _ from 'lodash'
import { Transform, Type } from 'class-transformer'
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  ValidateIf,
  ValidateNested,
  ValidationArguments,
} from 'class-validator'
import ActivitiesService from '../../../../../services/activitiesService'
import PrisonService from '../../../../../services/prisonService'
import AttendanceReason from '../../../../../enum/attendanceReason'
import { YesNo } from '../../../../../@types/activities'
import AttendanceStatus from '../../../../../enum/attendanceStatus'

const getPrisonerName = (args: ValidationArguments) => (args.object as NotAttendedData)?.prisonerName

export class NotAttendedData {
  prisonerNumber: string

  prisonerName: string

  @IsNotEmpty({ message: args => `Select the activities that ${getPrisonerName(args)} did not attend` })
  selectedInstanceIds: string[]

  @Transform(({ value }) => value !== 'false')
  isPayable: boolean

  @ValidateIf(o => o.selectedInstanceIds && o.selectedInstanceIds.length > 0)
  @IsEnum(AttendanceReason, { message: args => `Select an absence reason for ${getPrisonerName(args)}` })
  notAttendedReason: AttendanceReason

  @ValidateIf(o => AttendanceReason.SICK === o.notAttendedReason && o.isPayable)
  @IsEnum(YesNo, { message: (args: ValidationArguments) => `Select if ${getPrisonerName(args)} should be paid` })
  sickPay?: YesNo

  @ValidateIf(o => AttendanceReason.SICK === o.notAttendedReason)
  @IsOptional()
  @MaxLength(100, { message: 'Additional details must be $constraint1 characters or less' })
  moreDetail?: string

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

export class MultipleNotAttendedReasonForm {
  @Type(() => NotAttendedData)
  @ValidateNested({ each: true })
  notAttendedData: NotAttendedData[]
}

export default class MultipleNotAttendedReasonRoutes {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const selectedAttendances = req.journeyData.recordAttendanceJourney.selectedInstanceIds as string[]

    const instanceIds = _.uniq(
      selectedAttendances.flatMap(selectedAttendance => selectedAttendance.split('-')[0].split(',')),
    ).map(Number)
    const prisonerNumbers = _.uniq(selectedAttendances.map(selectedAttendance => selectedAttendance.split('-')[2]))

    const allInstances = await this.activitiesService.getScheduledActivities(instanceIds, user)
    const prisoners = await this.prisonService.searchInmatesByPrisonerNumbers(prisonerNumbers, user)
    const notAttendedReasons = (await this.activitiesService.getAttendanceReasons(user))
      .filter(r => r.displayInAbsence)
      .sort((r1, r2) => r1.displaySequence - r2.displaySequence)

    const attendanceDetails = selectedAttendances.map(selectedAttendance => {
      const prisonerInstanceIds = selectedAttendance.split('-')[0].split(',').map(Number)
      const prisonerNumber = selectedAttendance.split('-')[2]

      const prisoner = prisoners.find(p => p.prisonerNumber === prisonerNumber)
      const instances = allInstances.filter(i => prisonerInstanceIds.includes(i.id))

      const filteredInstances = instances.filter(instance => {
        const attendance = instance.attendances.find(a => a.prisonerNumber === prisonerNumber)
        return !instance.cancelled && attendance && attendance.status === 'WAITING'
      })
      return {
        prisonerNumber,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        instances: filteredInstances,
        isPayable: instances.some(i => i.activitySchedule.activity.paid),
      }
    })

    return res.render('pages/activities/record-attendance/attend-all/multiple-not-attended-reason', {
      attendanceDetails,
      notAttendedReasons,
      backLink: req.journeyData.recordAttendanceJourney.returnUrl || 'choose-details-by-residential-location',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const notAttendedFormData: NotAttendedData[] = req.body.notAttendedData
    const notAttendedData: NotAttendedData[] = [...notAttendedFormData]
    notAttendedData.forEach(data => {
      data.selectedInstanceIds =
        typeof data.selectedInstanceIds === 'string' ? [data.selectedInstanceIds] : data.selectedInstanceIds
    })

    const instanceIds = _.uniq(notAttendedData.flatMap(data => data.selectedInstanceIds.map(Number)))
    const instances = await this.activitiesService.getScheduledActivities(instanceIds, user)

    const attendanceUpdates = notAttendedData.flatMap((prisonerAttendance: NotAttendedData) => {
      return prisonerAttendance.selectedInstanceIds.map(selectedInstanceId => {
        const instance = instances.find(inst => inst.id === +selectedInstanceId)
        const isPaid = instance.activitySchedule.activity.paid
        return {
          id: instance.attendances.find(a => a.prisonerNumber === prisonerAttendance.prisonerNumber).id,
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
    })

    await this.activitiesService.updateAttendances(attendanceUpdates, user)

    const successMessage = `You've saved attendance details for ${
      notAttendedData.length === 1 ? notAttendedData[0].prisonerName : `${notAttendedData.length} attendees`
    }`

    const returnUrl = req.journeyData.recordAttendanceJourney.returnUrl
      ? req.journeyData.recordAttendanceJourney.returnUrl
      : 'choose-details-by-residential-location'

    return res.redirectWithSuccess(returnUrl, 'Attendance recorded', successMessage)
  }
}
