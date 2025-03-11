import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import { BookACourtHearingJourney } from '../journey'

export class HearingDetails {
  @Expose()
  @IsNotEmpty({ message: 'Select the court the booking is for' })
  agencyCode: string

  @Expose()
  @IsNotEmpty({
    message: args =>
      (args.object as { bookACourtHearingJourney: BookACourtHearingJourney }).bookACourtHearingJourney.type === 'COURT'
        ? 'Select the type of hearing'
        : 'Select the type of meeting',
  })
  hearingTypeCode: string
}

export default class HearingDetailsRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { type } = req.session.bookACourtHearingJourney

    const agencies = await this.bookAVideoLinkService.getAllCourts(user)
    const hearingTypes =
      type === 'COURT'
        ? await this.bookAVideoLinkService.getCourtHearingTypes(user)
        : await this.bookAVideoLinkService.getProbationMeetingTypes(user)

    return res.render('pages/appointments/video-link-booking/court/hearing-details', { agencies, hearingTypes })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { agencyCode, hearingTypeCode } = req.body
    const { mode } = req.params
    const { user } = res.locals
    const { type } = req.session.bookACourtHearingJourney

    req.session.bookACourtHearingJourney.agencyCode = agencyCode
    req.session.bookACourtHearingJourney.hearingTypeCode = hearingTypeCode

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookACourtHearingJourney, user)

      const successHeading =
        type === 'COURT'
          ? "You've changed the hearing type for this court hearing"
          : "You've changed the meeting type for this probation meeting"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/court/${req.session.bookACourtHearingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('location')
  }
}
