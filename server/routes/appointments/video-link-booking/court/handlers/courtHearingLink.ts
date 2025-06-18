import { NextFunction, Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, isNotEmpty, IsNotEmpty, IsNumberString, MaxLength, ValidateIf } from 'class-validator'
import CourtBookingService from '../../../../../services/courtBookingService'
import config from '../../../../../config'
import { MutuallyExclusive } from '../../../../../validators/mutallyExclusive'

export class CourtHearingLink {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select yes if you know the court hearing link' })
  cvpRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(o => o.cvpRequired === 'yes')
  @MutuallyExclusive({ message: 'Provide either a full web address or a CVP number' }, 'cvp-link')
  @MaxLength(120, { message: 'Court hearing link must be $constraint1 characters or less' })
  @IsNotEmpty({ message: 'Enter a video link address' })
  videoLinkUrl: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(o => config.bvlsHmctsLinkGuestPinEnabled && o.cvpRequired === 'yes')
  @MutuallyExclusive({ message: 'Provide either a CVP number or a full web address' }, 'cvp-link')
  @MaxLength(8, { message: 'Number from CVP address must be $constraint1 characters or less' })
  @ValidateIf(o => o.hmctsNumber)
  @IsNumberString({ no_symbols: true }, { message: 'Number from CVP address must be a number, like 3457' })
  hmctsNumber: string

  @Expose()
  @ValidateIf(() => config.bvlsHmctsLinkGuestPinEnabled)
  @IsIn(['yes', 'no'], { message: 'Select yes if you know the guest pin' })
  guestPinRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.guestPinRequired === 'yes' ? value : undefined))
  @ValidateIf(o => config.bvlsHmctsLinkGuestPinEnabled && o.guestPinRequired === 'yes')
  @IsNotEmpty({ message: 'Enter guest pin' })
  @MaxLength(8, { message: 'Guest pin must be $constraint1 characters or less' })
  @IsNumberString({ no_symbols: true }, { message: 'Guest pin must be a number' })
  guestPin: string
}

export default class CourtHearingLinkRoutes {
  constructor(private readonly courtBookingService: CourtBookingService) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/court/court-hearing-link')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.params
    const { user } = res.locals
    const { cvpRequired, videoLinkUrl, hmctsNumber, guestPinRequired, guestPin } = req.body

    req.session.bookACourtHearingJourney = {
      ...req.session.bookACourtHearingJourney,
      cvpRequired: cvpRequired === 'yes',
      videoLinkUrl: isNotEmpty(videoLinkUrl) ? videoLinkUrl : null,
      hmctsNumber: config.bvlsHmctsLinkGuestPinEnabled && isNotEmpty(hmctsNumber) ? hmctsNumber : null,
      guestPinRequired: config.bvlsHmctsLinkGuestPinEnabled && guestPinRequired === 'yes',
      guestPin: config.bvlsHmctsLinkGuestPinEnabled && isNotEmpty(guestPin) ? guestPin : null,
    }

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
