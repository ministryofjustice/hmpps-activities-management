import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength } from 'class-validator'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

export class ExtraInformation {
  @Expose()
  @IsOptional()
  @MaxLength(3600, { message: 'You must enter extra information which has no more than 3600 characters' })
  extraInformation: string
}

export default class ExtraInformationRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/extra-information')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { extraInformation } = req.body
    const { mode } = req.params
    const { user } = res.locals
    const { type } = req.session.bookAVideoLinkJourney

    req.session.bookAVideoLinkJourney = {
      ...req.session.bookAVideoLinkJourney,
      comments: extraInformation,
    }

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookAVideoLinkJourney, user)

      const successHeading =
        type === 'COURT'
          ? "You've changed the extra information for this court hearing"
          : "You've changed the extra information for this probation meeting"

      return res.redirectWithSuccess(
        `/appointments/video-link-booking/${req.session.bookAVideoLinkJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirect('check-answers')
  }
}
