import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, ValidateIf } from 'class-validator'
import DateOption from '../../../../enum/dateOption'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'

export class SelectDate {
  @Expose()
  @IsIn(Object.values(DateOption), { message: 'Select a date to record attendance for' })
  dateOption: string

  @Expose()
  @ValidateIf(o => o.dateOption === DateOption.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/appointments/attendance/select-date')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, date }: SelectDate = req.body

    req.session.recordAppointmentAttendanceJourney = {}

    const dateQuery = dateOption === DateOption.OTHER ? `&date=${formatIsoDate(date)}` : ''

    return res.redirect(`summaries?dateOption=${dateOption}${dateQuery}`)
  }
}
