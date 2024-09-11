import { NextFunction, Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, MaxLength, ValidateIf } from 'class-validator'
import createHttpError from 'http-errors'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

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
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { type } = req.session.bookAVideoLinkJourney
    if (type === 'COURT') {
      return res.render('pages/appointments/video-link-booking/court-hearing-link')
    }
    return next(createHttpError.NotFound())
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.params
    const { user } = res.locals
    const { videoLinkUrl } = req.body

    req.session.bookAVideoLinkJourney.videoLinkUrl = videoLinkUrl

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookAVideoLinkJourney, user)

      const successHeading = "You've changed the hearing link for this court hearing"

      return res.redirectWithSuccess(
        `/appointments/video-link-booking/${req.session.bookAVideoLinkJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('extra-information')
  }
}
