import { Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { Equals, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, ValidateIf } from 'class-validator'
import { parsePhoneNumberWithError } from 'libphonenumber-js'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import ProbationBookingService from '../../../../../services/probationBookingService'
import { YesNo } from '../../../../../@types/activities'

export class ProbationMeetingDetails {
  @Expose()
  @IsEnum(YesNo, { message: 'Select if you know the team this meeting is for' })
  probationTeamRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.probationTeamRequired === YesNo.YES ? value : undefined))
  @ValidateIf(o => o.probationTeamRequired === YesNo.YES)
  @IsNotEmpty({ message: `Select a probation team` })
  probationTeamCode: string

  @Expose()
  @IsNotEmpty({ message: `Select a meeting type` })
  meetingTypeCode: string

  @Expose()
  @Transform(({ obj }) =>
    !obj.officerDetailsNotKnown && !obj.officerFullName && !obj.officerEmail && !obj.officerTelephone
      ? null
      : !!obj.officerDetailsNotKnown !== !!(obj.officerFullName || obj.officerEmail || obj.officerTelephone),
  )
  @Equals(true, { message: `Enter either the probation officer's details, or select 'Not yet known'` })
  @IsNotEmpty({ message: "Enter the probation officer's details" })
  officerDetailsOrUnknown: boolean

  @Expose()
  @Transform(({ value }) => value === 'true')
  officerDetailsNotKnown: boolean

  @Expose()
  @ValidateIf(o => o.officerDetailsOrUnknown && !o.officerDetailsNotKnown)
  @IsNotEmpty({ message: `Enter the probation officer's full name` })
  officerFullName: string

  @Expose()
  @ValidateIf(o => o.officerDetailsOrUnknown && !o.officerDetailsNotKnown)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty({ message: `Enter the probation officer's email address` })
  officerEmail: string

  @Expose()
  @Transform(({ value }) => (value.trim() === '' ? undefined : value))
  @ValidateIf(o => o.officerDetailsOrUnknown && !o.officerDetailsNotKnown)
  @IsOptional()
  @IsPhoneNumber('GB', { message: 'Enter a valid UK phone number' })
  officerTelephone: string
}

export default class ProbationMeetingDetailsRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly probationBookingService: ProbationBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const probationTeams = await this.bookAVideoLinkService
      .getAllProbationTeams(user)
      .then(teams => teams.filter(team => team.code.toUpperCase() !== 'TEAM_NOT_LISTED'))

    const meetingTypes = await this.bookAVideoLinkService.getProbationMeetingTypes(user)

    return res.render('pages/appointments/video-link-booking/probation/probation-meeting-details', {
      probationTeams,
      meetingTypes,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const {
      probationTeamRequired,
      probationTeamCode,
      meetingTypeCode,
      officerDetailsNotKnown,
      officerFullName,
      officerEmail,
      officerTelephone,
    } = req.body
    const { mode } = req.routeContext
    const { user } = res.locals

    req.session.bookAProbationMeetingJourney = {
      ...req.session.bookAProbationMeetingJourney,
      probationTeamRequired: probationTeamRequired === YesNo.YES,
      probationTeamCode: probationTeamRequired === YesNo.YES ? probationTeamCode : 'TEAM_NOT_LISTED',
      meetingTypeCode,
      officerDetailsNotKnown,
      officer: officerDetailsNotKnown
        ? undefined
        : {
            fullName: officerFullName,
            email: officerEmail,
            telephone: officerTelephone
              ? parsePhoneNumberWithError(officerTelephone, 'GB').formatNational()
              : undefined,
          },
    }

    if (mode === 'amend') {
      await this.probationBookingService.amendVideoLinkBooking(req.session.bookAProbationMeetingJourney, user)

      const successHeading = "You've changed the details for this probation meeting"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/probation/${req.session.bookAProbationMeetingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('date-and-time')
  }
}
