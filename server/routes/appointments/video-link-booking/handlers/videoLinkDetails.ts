import { Request, Response } from 'express'
import { parse, parseISO } from 'date-fns'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../services/prisonService'
import UserService from '../../../../services/userService'
import ActivitiesService from '../../../../services/activitiesService'
import { AppointmentType } from '../../create-and-edit/appointmentJourney'
import { PrisonAppointment, VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'
import { ServiceUser } from '../../../../@types/express'
import { AppointmentDetails } from '../../../../@types/activitiesAPI/types'

type Appointment = AppointmentDetails & { locationKey: string }

export default class VideoLinkDetailsRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals

    const videoBooking = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const { preAppointment, mainAppointment, postAppointment } = await this.fetchAppointments(videoBooking, user)

    // TODO: This currently assumes that there is only 1 prisoner associated with a booking.
    //  It does not cater for co-defendants at different prisons.
    const prisoner = await this.prisonService.getInmateByPrisonerNumber(
      mainAppointment.attendees[0].prisoner.prisonerNumber,
      user,
    )
    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(prisoner.prisonId, user)

    const userMap = await this.userService.getUserMap([videoBooking.createdBy, videoBooking.amendedBy], user)

    const earliestAppointment = preAppointment || mainAppointment
    const date = parseISO(earliestAppointment.startDate)
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

  private async fetchAppointments(
    videoLinkBooking: VideoLinkBooking,
    user: ServiceUser,
  ): Promise<{
    preAppointment?: Appointment
    mainAppointment: Appointment
    postAppointment?: Appointment
  }> {
    const findAppointment = (type: string) => videoLinkBooking.prisonAppointments.find(a => a.appointmentType === type)

    const pre = findAppointment('VLB_COURT_PRE')
    const main = findAppointment('VLB_COURT_MAIN') || findAppointment('VLB_PROBATION')
    const post = findAppointment('VLB_COURT_POST')

    const getAppointmentDetails = async (appointment: PrisonAppointment) => {
      if (!appointment) return Promise.resolve(null)

      const appointmentId = await this.activitiesService
        .searchAppointments(
          main.prisonCode,
          {
            appointmentType: AppointmentType.INDIVIDUAL,
            startDate: appointment.appointmentDate,
            endDate: appointment.appointmentDate,
            categoryCode: 'VLB',
            prisonerNumbers: [appointment.prisonerNumber],
          },
          user,
        )
        .then(
          app =>
            app.find(a => a.startTime === appointment.startTime && a.endTime === appointment.endTime).appointmentId,
        )

      return this.activitiesService
        .getAppointmentDetails(appointmentId, user)
        .then(a => ({ ...a, locationKey: appointment.prisonLocKey }))
    }

    const [preAppointment, mainAppointment, postAppointment] = await Promise.all([
      getAppointmentDetails(pre),
      getAppointmentDetails(main),
      getAppointmentDetails(post),
    ])

    return {
      preAppointment,
      mainAppointment,
      postAppointment,
    }
  }
}
