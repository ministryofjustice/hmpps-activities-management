import { Request, Response } from 'express'
import { parse, parseISO } from 'date-fns'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../services/prisonService'
import UserService from '../../../../services/userService'
import { VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'

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
    const { preAppointment, mainAppointment, postAppointment } = this.fetchAppointments(videoBooking)

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(mainAppointment.prisonerNumber, user)
    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonId, user)

    const userMap = await this.userService.getUserMap([videoBooking.createdBy, videoBooking.amendedBy], user)

    const earliestAppointment = preAppointment || mainAppointment
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

  private fetchAppointments = (videoLinkBooking: VideoLinkBooking) => {
    const findAppointment = (type: string) => videoLinkBooking.prisonAppointments.find(a => a.appointmentType === type)

    const preAppointment = findAppointment('VLB_COURT_PRE')
    const mainAppointment = findAppointment('VLB_COURT_MAIN') || findAppointment('VLB_PROBATION')
    const postAppointment = findAppointment('VLB_COURT_POST')

    return {
      preAppointment,
      mainAppointment,
      postAppointment,
    }
  }
}
