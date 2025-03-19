import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import ProbationBookingService from '../../../../../services/probationBookingService'

export class MeetingDetailsDeprecated {
  @Expose()
  @IsNotEmpty({ message: 'Select the probation team the booking is for' })
  probationTeamCode: string

  @Expose()
  @IsNotEmpty({ message: 'Select the type of meeting' })
  meetingTypeCode: string
}

export default class MeetingDetailsRoutesDeprecated {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly probationBookingService: ProbationBookingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals

    const probationTeams = await this.bookAVideoLinkService.getAllProbationTeams(user)
    const meetingTypes = await this.bookAVideoLinkService.getProbationMeetingTypes(user)

    return res.render('pages/appointments/video-link-booking/probation/meeting-details-deprecated', {
      probationTeams,
      meetingTypes,
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { probationTeamCode, meetingTypeCode } = req.body
    const { mode } = req.params
    const { user } = res.locals

    req.session.bookAProbationMeetingJourney.probationTeamCode = probationTeamCode
    req.session.bookAProbationMeetingJourney.meetingTypeCode = meetingTypeCode

    if (mode === 'amend') {
      await this.probationBookingService.amendVideoLinkBooking(req.session.bookAProbationMeetingJourney, user)

      const successHeading = "You've changed the meeting type for this probation meeting"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/probation/${req.session.bookAProbationMeetingJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('date-and-time')
  }
}
