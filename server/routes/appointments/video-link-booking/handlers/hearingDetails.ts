import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import { BookAVideoLinkJourney } from '../journey'

export class HearingDetails {
  @Expose()
  @IsNotEmpty({ message: 'Select the court the booking is for' })
  agencyCode: string

  @Expose()
  @IsNotEmpty({
    message: args =>
      (args.object as { bookAVideoLinkJourney: BookAVideoLinkJourney }).bookAVideoLinkJourney.type === 'COURT'
        ? 'Select the type of hearing'
        : 'Select the type of meeting',
  })
  hearingTypeCode: string
}

export default class HearingDetailsRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { type } = req.session.bookAVideoLinkJourney

    const agencies = await this.bookAVideoLinkService.getAllCourts(user)
    const hearingTypes =
      type === 'COURT'
        ? await this.bookAVideoLinkService.getCourtHearingTypes(user)
        : await this.bookAVideoLinkService.getProbationMeetingTypes(user)

    return res.render('pages/appointments/video-link-booking/hearing-details', { agencies, hearingTypes })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { agencyCode, hearingTypeCode } = req.body
    const { mode } = req.params
    const { user } = res.locals
    const { type } = req.session.bookAVideoLinkJourney

    req.session.bookAVideoLinkJourney.agencyCode = agencyCode
    req.session.bookAVideoLinkJourney.hearingTypeCode = hearingTypeCode

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookAVideoLinkJourney, user)

      const successHeading =
        type === 'COURT'
          ? "You've changed the hearing type for this court hearing"
          : "You've changed the meeting type for this probation meeting"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/${req.session.bookAVideoLinkJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('location')
  }
}
