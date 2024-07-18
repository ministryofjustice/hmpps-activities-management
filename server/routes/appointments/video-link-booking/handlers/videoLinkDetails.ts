import { Request, Response } from 'express'
import { parse, parseISO } from 'date-fns'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../services/prisonService'
import UserService from '../../../../services/userService'

export default class VideoLinkDetailsRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals

    const videoBooking = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const preAppointment = videoBooking.prisonAppointments.find(a => a.appointmentType === 'VLB_COURT_PRE')
    const mainAppointment = videoBooking.prisonAppointments.find(
      a => a.appointmentType === 'VLB_COURT_MAIN' || a.appointmentType === 'VLB_PROBATION',
    )
    const postAppointment = videoBooking.prisonAppointments.find(a => a.appointmentType === 'VLB_COURT_POST')

    // TODO: This currently assumes that there is only 1 prisoner associated with a booking.
    //  It does not cater for co-defendants at different prisons.
    const prisoner = await this.prisonService.getInmateByPrisonerNumber(mainAppointment.prisonerNumber, user)
    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonId, user)

    const userMap = await this.userService.getUserMap([videoBooking.createdBy, videoBooking.amendedBy], user)

    const earliestAppointment = videoBooking.prisonAppointments.sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    )[0]
    const date = parseISO(earliestAppointment.appointmentDate)
    const time = parse(earliestAppointment.startTime, 'HH:mm', new Date(0))
    const isAmendable = this.bookAVideoLinkService.bookingIsAmendable(date, time, videoBooking.statusCode)

    res.render('pages/appointments/video-link-booking/details', {
      videoBooking,
      preAppointment,
      mainAppointment,
      postAppointment,
      prisoner,
      rooms,
      userMap,
      isAmendable,
    })
  }
}
