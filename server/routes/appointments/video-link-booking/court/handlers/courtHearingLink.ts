import { NextFunction, Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, IsNumberString, MaxLength, ValidateIf } from 'class-validator'
import { isEmpty } from 'lodash'
import CourtBookingService from '../../../../../services/courtBookingService'
import config from '../../../../../config'

export class CourtHearingLink {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select yes if you know the court hearing link' })
  cvpRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(
    o =>
      (o.cvpRequired === 'yes' && !config.bvlsHmctsLinkGuestPinEnabled) ||
      (o.cvpRequired === 'yes' && config.bvlsHmctsLinkGuestPinEnabled && !o.hmctsNumber),
  )
  @MaxLength(120, { message: 'Court hearing link must be $constraint1 characters or less' })
  @IsNotEmpty({ message: 'Enter the court hearing link' })
  videoLinkUrl: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(o => config.bvlsHmctsLinkGuestPinEnabled && o.cvpRequired === 'yes')
  @MaxLength(8, { message: 'HMCTS number must be $constraint1 characters or less' })
  @ValidateIf(o => o.hmctsNumber)
  @IsNumberString({ no_symbols: true }, { message: 'HMCTS number must be a number' })
  hmctsNumber: string

  @Expose()
  @ValidateIf(() => config.bvlsHmctsLinkGuestPinEnabled)
  @IsIn(['yes', 'no'], { message: 'Select yes if you know the guest pin' })
  guestPinRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.guestPinRequired === 'yes' ? value : undefined))
  @ValidateIf(o => config.bvlsHmctsLinkGuestPinEnabled && o.guestPinRequired === 'yes')
  @IsNotEmpty({ message: 'Enter guest pin' })
  @MaxLength(8, { message: 'Guest pin must be $constraint1 numeric characters or less' })
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

    // TODO more validation required, don't want HMCTS number and video link, can be one or the other!

    req.session.bookACourtHearingJourney = {
      ...req.session.bookACourtHearingJourney,
      cvpRequired: cvpRequired === 'yes',
      videoLinkUrl: !isEmpty(videoLinkUrl) ? videoLinkUrl : null,
      hmctsNumber: config.bvlsHmctsLinkGuestPinEnabled && !isEmpty(hmctsNumber) ? hmctsNumber : null,
      guestPinRequired: config.bvlsHmctsLinkGuestPinEnabled && guestPinRequired === 'yes',
      guestPin: config.bvlsHmctsLinkGuestPinEnabled && !isEmpty(guestPin) ? guestPin : null,
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
