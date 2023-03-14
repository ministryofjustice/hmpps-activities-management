import { IsBoolean } from 'class-validator'
import { Expose } from 'class-transformer'

export default class NotAttendedData {
  @Expose()
  @IsBoolean({ message: 'Enter a reason for every prisoner' })
  notAttendedReason: boolean

  pay: boolean

  moreDetail: string

  caseNote: string

  incentiveLevelWarningIssued: boolean

  absenceReason: string
}
