import { NextFunction, Request, Response } from 'express'
import { Expose, Transform } from 'class-transformer'
import {
  IsIn,
  isNotEmpty,
  IsNotEmpty,
  IsNumberString,
  MaxLength,
  ValidateIf,
  ValidationArguments,
} from 'class-validator'
import CourtBookingService from '../../../../../services/courtBookingService'
import config from '../../../../../config'
import CvpLinkOneOrTheOther from '../../../../../validators/cvpLinkOneOrTheOther'

@Expose()
export class CourtHearingLink {
  @IsIn(['yes', 'no'], { message: 'Select yes if you know the court hearing link' })
  @CvpLinkOneOrTheOther('videoLinkUrl', 'hmctsNumber', config.bvlsHmctsLinkGuestPinEnabled, {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    message: (args: ValidationArguments) => {
      if (config.bvlsHmctsLinkGuestPinEnabled) {
        return 'Enter number from CVP address or enter full web address (URL)'
      }
      return 'Enter court hearing link'
    },
  })
  cvpRequired: string

  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(o => o.cvpRequired === 'yes' && isNotEmpty(o.videoLinkUrl))
  @MaxLength(120, { message: 'Court hearing link must be $constraint1 characters or less' })
  videoLinkUrl: string

  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(o => o.cvpRequired === 'yes' && config.bvlsHmctsLinkGuestPinEnabled && isNotEmpty(o.hmctsNumber))
  @MaxLength(8, { message: 'Number from CVP address must be $constraint1 characters or less' })
  @IsNumberString({ no_symbols: true }, { message: 'Number from CVP address must be a number, like 3457' })
  hmctsNumber: string

  @ValidateIf(() => config.bvlsHmctsLinkGuestPinEnabled)
  @IsIn(['yes', 'no'], { message: 'Select yes if you know the guest pin' })
  guestPinRequired: string

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
