import { IsString, MaxLength } from 'class-validator'

export default class NotAttendedData {
  notAttendedReason: boolean

  pay: boolean

  @IsString()
  @MaxLength(10, { message: 'Enter more detail that is 240 characters or less' })
  moreDetail: string

  @IsString()
  caseNote: string

  incentiveLevelWarningIssued: boolean

  @IsString()
  absenceReason: string
}
