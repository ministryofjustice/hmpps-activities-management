import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength } from 'class-validator'
import CourtBookingService from '../../../../../services/courtBookingService'

export class ExtraInformation {
  @Expose()
  @IsOptional()
  @MaxLength(3600, { message: 'You must enter extra information which has no more than 3600 characters' })
  extraInformation: string
}

export default class ExtraInformationRoutes {
  constructor(private readonly courtBookingService: CourtBookingService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/court/extra-information')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { extraInformation } = req.body
    const { mode } = req.params
    const { user } = res.locals

    req.session.bookACourtHearingJourney = {
      ...req.session.bookACourtHearingJourney,
      comments: extraInformation,
    }

    if (mode === 'amend') {
      await this.courtBookingService.amendVideoLinkBooking(req.session.bookACourtHearingJourney, user)

      const successHeading = "You've changed the extra information for this court hearing"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/court/${req.session.bookACourtHearingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirect('check-answers')
  }
}
