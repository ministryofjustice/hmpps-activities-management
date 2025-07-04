import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength, ValidateIf } from 'class-validator'
import ProbationBookingService from '../../../../../services/probationBookingService'

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
  constructor(private readonly probationBookingService: ProbationBookingService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/probation/extra-information')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.routeContext
    const { user } = res.locals
    const { notesForStaff, notesForPrisoners } = req.body

    req.session.bookAProbationMeetingJourney = {
      ...req.session.bookAProbationMeetingJourney,
      notesForStaff,
      notesForPrisoners,
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
