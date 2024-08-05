import { Request, Response } from 'express'
import UserService from '../../../../services/userService'
import { isUncancellable } from '../../../../utils/editAppointmentUtils'
import config from '../../../../config'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../services/prisonService'

export default class AppointmentDetailsRoutes {
  constructor(
    private readonly userService: UserService,
    private readonly prisonService: PrisonService,
    private readonly bookAVideoLinkService: BookAVideoLinkService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req
    const { user } = res.locals

    if (appointment.category.code === 'VLB' && config.bookAVideoLinkToggleEnabled) {
      const location = await this.prisonService
        .getEventLocations(appointment.prisonCode, user)
        .then(r => r.find(l => l.locationId === appointment.internalLocation.id))

      const videoLinkBooking = await this.bookAVideoLinkService
        .matchAppointmentToVideoLinkBooking(
          appointment.attendees[0].prisoner.prisonerNumber,
          location.locationPrefix,
          appointment.startDate,
          appointment.startTime,
          appointment.endTime,
          user,
        )
        .catch(e => {
          if (e.status === 404) return null
          throw e
        })

      if (videoLinkBooking) {
        return res.redirect(`video-link-booking/${videoLinkBooking.videoLinkBookingId}`)
      }
    }

    const userMap = await this.userService.getUserMap(
      [appointment.createdBy, appointment.updatedBy, appointment.cancelledBy],
      user,
    )

    return res.render('pages/appointments/appointment/details', {
      appointment,
      userMap,
      uncancellable: isUncancellable(appointment),
    })
  }

  COPY = async (req: Request, res: Response): Promise<void> => {
    const { appointment } = req

    res.render('pages/appointments/appointment/copy', {
      appointment,
    })
  }
}
