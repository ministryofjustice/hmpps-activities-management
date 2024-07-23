import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'

export class Location {
  @Expose()
  @IsNotEmpty({ message: 'Start typing a room name and select from the list' })
  location: string
}

export default class LocationRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner } = req.session.bookAVideoLinkJourney

    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonCode, user)

    return res.render('pages/appointments/video-link-booking/location', { rooms })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { location } = req.body
    const { mode } = req.params
    const { user } = res.locals

    req.session.bookAVideoLinkJourney.locationCode = location

    if (mode === 'amend') {
      await this.bookAVideoLinkService.amendVideoLinkBooking(req.session.bookAVideoLinkJourney, user)

      const successHeading = "You've changed the location for this court hearing"
      return res.redirectWithSuccess(
        `/appointments/video-link-booking/${req.session.bookAVideoLinkJourney.bookingId}`,
        successHeading,
      )
    }

    return res.redirectOrReturn('date-and-time')
  }
}
