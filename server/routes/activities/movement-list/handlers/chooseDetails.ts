import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, ValidateIf } from 'class-validator'
import { addDays, startOfToday } from 'date-fns'
import DateOption from '../../../../enum/dateOption'
import TimeSlot from '../../../../enum/timeSlot'
import { formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import IsValidDate from '../../../../validators/isValidDate'
import Validator from '../../../../validators/validator'

export class DateAndTimeSlot {
  @Expose()
  @IsIn(Object.values(DateOption), { message: 'Select a date for the movement list' })
  dateOption: string

  @Expose()
  @ValidateIf(o => o.dateOption === DateOption.OTHER)
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(thisDate => thisDate <= addDays(startOfToday(), 60), {
    message: 'Enter a date up to 60 days in the future',
  })
  @IsValidDate({ message: 'Enter a valid date' })
  date: Date

  @Expose()
  @IsIn(Object.values(TimeSlot), { message: 'Select a time slot' })
  timeSlot: string
}

export default class ChooseDetailsRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    res.render('pages/activities/movement-list/choose-details')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { dateOption, timeSlot, date }: DateAndTimeSlot = req.body

    const dateQuery = dateOption === DateOption.OTHER ? `&date=${formatIsoDate(date)}` : ''

    return res.redirect(`locations?dateOption=${dateOption}${dateQuery}&timeSlot=${timeSlot}`)
  }
}
