import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength, ValidateIf } from 'class-validator'
import CourtBookingService from '../../../../../services/courtBookingService'

export class ExtraInformation {
  @Expose()
  @ValidateIf(o => o.notesForStaff)
  @IsOptional()
  @MaxLength(400, { message: 'Notes for prison staff must be $constraint1 characters or less' })
  notesForStaff: string

  @Expose()
  @ValidateIf(o => o.notesForPrisoners)
  @IsOptional()
  @MaxLength(400, { message: 'Notes for prisoner must be $constraint1 characters or less' })
  notesForPrisoners: string
}

export default class ExtraInformationRoutes {
  constructor(private readonly courtBookingService: CourtBookingService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/court/extra-information')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.routeContext
    const { user } = res.locals
    const { notesForStaff, notesForPrisoners } = req.body

    req.session.bookACourtHearingJourney = {
      ...req.session.bookACourtHearingJourney,
      notesForStaff,
      notesForPrisoners,
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
