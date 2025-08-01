import { Request, Response } from 'express'
import { Expose } from 'class-transformer'
import { IsNotEmpty } from 'class-validator'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'

export class Location {
  @Expose()
  @IsNotEmpty({ message: 'Start typing a room name and select from the list' })
  location: string
}

export default class LocationRoutes {
  constructor(private readonly bookAVideoLinkService: BookAVideoLinkService) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisonCode } = req.session.bookAProbationMeetingJourney

    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(prisonCode, user)

    return res.render('pages/appointments/video-link-booking/probation/location', { rooms })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { location } = req.body
    const { mode } = req.routeContext
    const { preserveHistory } = req.query

    req.session.bookAProbationMeetingJourney.locationCode = location

    if (mode === 'amend' || preserveHistory) {
      return res.redirect(`schedule${preserveHistory ? '?preserveHistory=true' : ''}`)
    }
    return res.redirect(`meeting-details`)
  }
}
