import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import CourtBookingService from '../../../../../services/courtBookingService'

export class HearingDetails {
  @Expose()
  @IsNotEmpty({ message: 'Select the court the booking is for' })
  courtCode: string

  @Expose()
  @IsNotEmpty({ message: 'Select the type of hearing' })
  hearingTypeCode: string
}

export default class HearingDetailsRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly courtBookingService: CourtBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const agencies = await this.bookAVideoLinkService.getAllCourts(user)
    const hearingTypes = await this.bookAVideoLinkService.getCourtHearingTypes(user)

    return res.render('pages/appointments/video-link-booking/court/hearing-details', { agencies, hearingTypes })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { courtCode, hearingTypeCode } = req.body
    const { mode } = req.params
    const { user } = res.locals

    req.session.bookACourtHearingJourney.courtCode = courtCode
    req.session.bookACourtHearingJourney.hearingTypeCode = hearingTypeCode

    if (mode === 'amend') {
      await this.courtBookingService.amendVideoLinkBooking(req.session.bookACourtHearingJourney, user)

      const successHeading = "You've changed the hearing type for this court hearing"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/court/${req.session.bookACourtHearingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('location')
  }
}
