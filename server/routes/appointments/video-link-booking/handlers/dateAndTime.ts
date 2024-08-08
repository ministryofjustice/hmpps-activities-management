import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, ValidateIf } from 'class-validator'
import { addMinutes, isValid, startOfToday, subMinutes } from 'date-fns'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import { parseDatePickerDate } from '../../../../utils/datePickerUtils'
import Validator from '../../../../validators/validator'
import IsValidDate from '../../../../validators/isValidDate'
import { YesNo } from '../../../../@types/activities'
import { dateAtTime, simpleTimeToDate } from '../../../../utils/utils'

export class DateAndTime {
  @Expose()
  @Transform(({ value }) => parseDatePickerDate(value))
  @Validator(date => date >= startOfToday(), { message: "Enter a date which is on or after today's date" })
  @IsValidDate({ message: 'Enter a valid date' })
  @IsNotEmpty({ message: 'Enter a date' })
  date: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator(
    (startTime, { date }) => date < startOfToday() || dateAtTime(date, startTime) > addMinutes(new Date(), 15),
    {
      // To allow for a pre-court hearing starting 15 minutes before the main hearing
      message: 'Enter a time which is at least 15 minutes in the future',
    },
  )
  @IsValidDate({ message: 'Enter a valid start time' })
  @IsNotEmpty({ message: 'Enter a start time' })
  startTime: Date

  @Expose()
  @Transform(({ value }) => simpleTimeToDate(value))
  @Validator((endTime, { startTime }) => (isValid(startTime) ? endTime > startTime : true), {
    message: 'Select a end time that is after the start time',
  })
  @IsValidDate({ message: 'Enter a valid end time' })
  @IsNotEmpty({ message: 'Enter an end time' })
  endTime: Date

  @Expose()
  @IsEnum(YesNo, { message: 'Select if a pre-court hearing should be added' })
  preRequired: YesNo

  @Expose()
  @Transform(({ value, obj }) => (obj.preRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.preRequired === YesNo.YES)
  @IsNotEmpty({ message: 'Select a room for the pre-court hearing' })
  preLocation: string

  @Expose()
  @IsEnum(YesNo, { message: 'Select if a post-court hearing should be added' })
  postRequired: YesNo

  @Expose()
  @Transform(({ value, obj }) => (obj.postRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.postRequired === YesNo.YES)
  @IsNotEmpty({ message: 'Select a room for the post-court hearing' })
  postLocation: string
}

export default class DateAndTimeRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner } = req.session.bookAVideoLinkJourney

    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode, user)

    return res.render('pages/appointments/video-link-booking/date-and-time', { rooms })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { preserveHistory } = req.query
    const { date, startTime, endTime, preRequired, postRequired, preLocation, postLocation } = req.body

    req.session.bookAVideoLinkJourney = {
      ...req.session.bookAVideoLinkJourney,
      date: date.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      preHearingStartTime: preRequired === YesNo.YES ? subMinutes(startTime, 15).toISOString() : undefined,
      preHearingEndTime: preRequired === YesNo.YES ? startTime.toISOString() : undefined,
      postHearingStartTime: postRequired === YesNo.YES ? endTime.toISOString() : undefined,
      postHearingEndTime: postRequired === YesNo.YES ? addMinutes(endTime, 15).toISOString() : undefined,
      preLocationCode: preLocation,
      postLocationCode: postLocation,
    }

    return res.redirect(`schedule${preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
