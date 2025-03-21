import { NextFunction, Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import CourtBookingService from '../../../../../services/courtBookingService'

export class CourtHearingLink {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select either yes or no' })
  required: string

  @Expose()
  @Transform(({ value, obj }) => (obj.required === 'yes' ? value : undefined))
  @ValidateIf(o => o.required === 'yes')
  @MaxLength(120, { message: 'You must enter a court hearing link which has no more than 120 characters' })
  @IsNotEmpty({ message: 'Enter the court hearing link' })
  videoLinkUrl: string
}

export default class CourtHearingLinkRoutes {
  constructor(private readonly courtBookingService: CourtBookingService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/court/court-hearing-link')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.params
    const { user } = res.locals
    const { videoLinkUrl } = req.body

    req.session.bookACourtHearingJourney.videoLinkUrl = videoLinkUrl

    if (mode === 'amend') {
      await this.courtBookingService.amendVideoLinkBooking(req.session.bookACourtHearingJourney, user)

      const successHeading = "You've changed the hearing link for this court hearing"

      return res.redirectWithSuccess(
        `/appointments/video-link-booking/court/${req.session.bookACourtHearingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('extra-information')
  }
}
