import { Request, Response } from 'express'
import { addDays, startOfToday } from 'date-fns'
import { IsIn, IsNotEmpty, ValidateIf } from 'class-validator'
import { Expose } from 'class-transformer'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentCategorySummary } from '../../../../@types/activitiesAPI/types'
import DateOption from '../../../../enum/dateOption'
import { datePickerDateToIsoDate, formatIsoDate, parseDatePickerDate } from '../../../../utils/datePickerUtils'
import Validator from '../../../../validators/validator'

export class AppointmentSummary {
  @Expose()
  @IsIn(Object.values(DateOption), {
    message: 'Select when the change takes effect',
  })
  dateOption: string

  @Validator(startDate => parseDatePickerDate(startDate) > startOfToday(), {
    message: 'The change the date takes effect must be in the future',
  })
  @ValidateIf(o => o.dateOption === 'other')
  @IsNotEmpty({
    message: 'Enter a valid date',
  })
  startDate: string

  @IsNotEmpty({
    message: 'Select at least one category',
  })
  appointmentCategorySummaries: string
}

export default class AppointmentSummaryRoutes {
  constructor(private readonly activitiesService: ActivitiesService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const appointmentCategorySummaries: AppointmentCategorySummary[] =
      await this.activitiesService.getAppointmentCategories(user)

    res.render('pages/activities/administration/appointment-summary', {
      appointmentCategorySummaries,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startDate, dateOption, appointmentCategorySummaries } = req.body

    const fromDate =
      dateOption === DateOption.TOMORROW ? formatIsoDate(addDays(new Date(), 1)) : datePickerDateToIsoDate(startDate)

    res.redirect(`appointment-preview?fromDate=${fromDate}&categories=${appointmentCategorySummaries.toString()}`)
  }
}
