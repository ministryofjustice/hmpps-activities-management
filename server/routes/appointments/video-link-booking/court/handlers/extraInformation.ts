import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsOptional, MaxLength } from 'class-validator'
import CourtBookingService from '../../../../../services/courtBookingService'
import config from '../../../../../config'

export class ExtraInformation {
  @Expose()
  @IsOptional()
  @MaxLength(3600, { message: 'You must enter extra information which has no more than 3600 characters' })
  extraInformation: string

  @Expose()
  @IsOptional()
  @MaxLength(400, { message: 'You must enter notes for staff which has no more than 400 characters' })
  notesForStaff: string

  @Expose()
  @IsOptional()
  @MaxLength(400, { message: 'You must enter notes for prisoner which has no more than 400 characters' })
  notesForPrisoners: string
}

export default class ExtraInformationRoutes {
  constructor(private readonly courtBookingService: CourtBookingService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    return res.render('pages/appointments/video-link-booking/court/extra-information')
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { mode } = req.params
    const { user } = res.locals

    if (config.bvlsMasterPublicPrivateNotesEnabled) {
      const { notesForStaff, notesForPrisoners } = req.body

      req.session.bookACourtHearingJourney = {
        ...req.session.bookACourtHearingJourney,
        notesForStaff,
        notesForPrisoners,
      }
    } else {
      const { extraInformation } = req.body

      req.session.bookACourtHearingJourney = {
        ...req.session.bookACourtHearingJourney,
        comments: extraInformation,
      }
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
