import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

export class HearingDetails {
  @Expose()
  @IsNotEmpty({ message: 'Start typing a court name and select from the list' })
  agencyCode: string

  @Expose()
  @IsNotEmpty({ message: 'Start typing a hearing type and select from the list' })
  hearingTypeCode: string
}

export default class HearingDetailsRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    // TODO: This should list all courts, not only the ones enabled in BVLS
    const agencies = await this.bookAVideoLinkService.getAllEnabledCourts(user)
    const hearingTypes = await this.bookAVideoLinkService.getCourtHearingTypes(user)

    return res.render('pages/appointments/video-link-booking/hearing-details', { agencies, hearingTypes })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { agencyCode, hearingTypeCode } = req.body
    const { mode } = req.params
    const { user } = res.locals

    req.session.bookAVideoLinkJourney.agencyCode = agencyCode
    req.session.bookAVideoLinkJourney.hearingTypeCode = hearingTypeCode

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookAVideoLinkJourney, user)

      const successHeading = "You've changed the hearing type for this court hearing"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/${req.session.bookAVideoLinkJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('location')
  }
}
