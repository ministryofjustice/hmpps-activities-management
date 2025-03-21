import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import { isValid, startOfToday } from 'date-fns'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { parseDatePickerDate } from '../../../../../utils/datePickerUtils'
import Validator from '../../../../../validators/validator'
import IsValidDate from '../../../../../validators/isValidDate'
import { dateAtTime, simpleTimeToDate } from '../../../../../utils/utils'

export class DateAndTime {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfToday(), { message: "Enter a date which is on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date' })
  @IsNotEmpty({ message: 'Enter a date' })
  date: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator((startTime, { date }) => date < startOfToday() || dateAtTime(date, startTime) > new Date(), {
    message: 'Enter a time which is in the future',
  })
  @IsValidDate({ message: 'Enter a valid start time' })
  @IsNotEmpty({ message: 'Enter a start time' })
  startTime: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator((endTime, { startTime }) => (isValid(startTime) ? endTime > startTime : true), {
    message: 'Select an end time that is after the start time',
  })
  @IsValidDate({ message: 'Enter a valid end time' })
  @IsNotEmpty({ message: 'Enter an end time' })
  endTime: Date
}

export default class DateAndTimeRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner } = req.session.bookAProbationMeetingJourney

    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode, user)

    return res.render('pages/appointments/video-link-booking/probation/date-and-time', { rooms })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query
    const { date, startTime, endTime } = req.body

    req.session.bookAProbationMeetingJourney = {
      ...req.session.bookAProbationMeetingJourney,
      date: date.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    }

    return res.redirect(`schedule${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
