import { IsEnum, ValidateIf } from 'class-validator'
import { Request, Response } from 'express'
import { Transform } from 'class-transformer'
import { addDays, startOfToday, subDays } from 'date-fns'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'
import { getSelectedDate } from '../../../../utils/utils'
import DateOption from '../../../../enum/dateOption'

export class NotAttendedDate {
  @IsEnum(DateOption, { message: 'Select a date' })
  datePresetOption: DateOption

  @ValidateIf(o => o.datePresetOption === DateOption.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate >= subDays(startOfToday(), 14), {
    message: 'Enter a date within the last 14 days',
  })
  @Validator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date?: Date
}

export default class SelectDateRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/daily-attendance-summary/select-period', {
      title: 'Not attended yet list: select a date',
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    req.session.attendanceSummaryJourney = null
    const selectedDate = getSelectedDate(req.body)
    res.redirect(`attendance?date=${formatIsoDate(selectedDate)}&status=NotAttended&preserveHistory=true`)
  }
}
