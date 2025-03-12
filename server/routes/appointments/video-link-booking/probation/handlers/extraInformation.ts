import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength } from 'class-validator'
import ProbationBookingService from '../../../../../services/probationBookingService'

export class ExtraInformation {
  @Expose()
  @IsOptional()
  @MaxLength(3600, { message: 'You must enter extra information which has no more than 3600 characters' })
  extraInformation: string
}

export default class ExtraInformationRoutes {
  constructor(private readonly probationBookingService: ProbationBookingService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/probation/extra-information')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { extraInformation } = req.body
    const { mode } = req.params
    const { user } = res.locals

    req.session.bookAProbationMeetingJourney = {
      ...req.session.bookAProbationMeetingJourney,
      comments: extraInformation,
    }

    if (mode === 'amend') {
      await this.probationBookingService.amendVideoLinkBooking(req.session.bookAProbationMeetingJourney, user)

      const successHeading = "You've changed the extra information for this probation meeting"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/probation/${req.session.bookAProbationMeetingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirect('check-answers')
  }
}
