import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import ProbationBookingService from '../../../../../services/probationBookingService'

export class MeetingDetails {
  @Expose()
  @IsNotEmpty({ message: 'Select the type of meeting' })
  meetingTypeCode: string
}

export default class MeetingDetailsRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly probationBookingService: ProbationBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const meetingTypes = await this.bookAVideoLinkService.getProbationMeetingTypes(user)

    return res.render('pages/appointments/video-link-booking/probation/meeting-details', { meetingTypes })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { meetingTypeCode } = req.body
    const { user } = res.locals

    req.session.bookAProbationMeetingJourney.meetingTypeCode = meetingTypeCode

    await this.probationBookingService.amendVideoLinkBooking(req.session.bookAProbationMeetingJourney, user)

    const successHeading = "You've changed the meeting type for this probation meeting"
    return res.redirectWithSuccess(
      `/appointments/video-link-booking/probation/${req.session.bookAProbationMeetingJourney.bookingId}`,
      successHeading,
    )
  }
}
