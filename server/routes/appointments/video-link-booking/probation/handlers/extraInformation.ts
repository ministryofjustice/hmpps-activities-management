import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength, ValidateIf } from 'class-validator'
import ProbationBookingService from '../../../../../services/probationBookingService'
import config from '../../../../../config'

export class ExtraInformation {
  @Expose()
  @ValidateIf(o => o.extraInformation && !config.bvlsMasterPublicPrivateNotesEnabled)
  @IsOptional()
  @MaxLength(3600, { message: 'You must enter extra information which has no more than $constraint1 characters' })
  extraInformation: string

  @Expose()
  @ValidateIf(o => o.notesForStaff && config.bvlsMasterPublicPrivateNotesEnabled)
  @IsOptional()
  @MaxLength(400, { message: 'Notes for prison staff must be $constraint1 characters or less' })
  notesForStaff: string

  @Expose()
  @ValidateIf(o => o.notesForPrisoners && config.bvlsMasterPublicPrivateNotesEnabled)
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

    if (config.bvlsMasterPublicPrivateNotesEnabled) {
      const { notesForStaff, notesForPrisoners } = req.body

      req.session.bookAProbationMeetingJourney = {
        ...req.session.bookAProbationMeetingJourney,
        notesForStaff,
        notesForPrisoners,
      }
    } else {
      const { extraInformation } = req.body

      req.session.bookAProbationMeetingJourney = {
        ...req.session.bookAProbationMeetingJourney,
        comments: extraInformation,
      }
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
