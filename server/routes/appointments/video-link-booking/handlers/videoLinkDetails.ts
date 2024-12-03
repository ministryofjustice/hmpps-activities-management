import { Request, Response } from 'express'
import { parse, parseISO } from 'date-fns'
import BookAVideoLinkService from '../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../services/prisonService'
import UserService from '../../../../services/userService'
import { PrisonAppointment, VideoLinkBooking } from '../../../../@types/bookAVideoLinkApi/types'
import ActivitiesService from '../../../../services/activitiesService'
import { ServiceUser } from '../../../../@types/express'
import { AppointmentSearchResult } from '../../../../@types/activitiesAPI/types'
import LocationMappingService from '../../../../services/locationMappingService'

export default class VideoLinkDetailsRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
    private readonly locationMappingService: LocationMappingService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals

    const videoBooking = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const { preAppointment, mainAppointment, postAppointment } = this.fetchAppointments(videoBooking)

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(mainAppointment.prisonerNumber, user)

    const [rooms, userMap, mainAppointmentId] = await Promise.all([
      this.bookAVideoLinkService.getAppointmentLocations(mainAppointment.prisonCode, user),
      this.userService.getUserMap([videoBooking.createdBy, videoBooking.amendedBy], user),
      this.fetchMainAppointmentFromActivitiesAPI(mainAppointment, user).then(a => a.appointmentId),
    ])

    const earliestAppointment = preAppointment || mainAppointment
    const date = parseISO(earliestAppointment.appointmentDate)
    const time = parse(earliestAppointment.startTime, 'HH:mm', new Date(0))
    const isAmendable = this.bookAVideoLinkService.bookingIsAmendable(date, time, videoBooking.statusCode)

    res.render('pages/appointments/video-link-booking/details', {
      videoBooking,
      mainAppointmentId,
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

  private fetchMainAppointmentFromActivitiesAPI = async (
    mainAppointment: PrisonAppointment,
    user: ServiceUser,
    retries = 3,
    delay = 1000,
  ): Promise<AppointmentSearchResult> => {
    const locationId = await this.locationMappingService.mapDpsLocationKeyToNomisId(mainAppointment.prisonLocKey, user)

    const appointment = await this.activitiesService
      .searchAppointments(
        user.activeCaseLoadId,
        {
          appointmentType: 'INDIVIDUAL',
          startDate: mainAppointment.appointmentDate,
          categoryCode: 'VLB',
          prisonerNumbers: [mainAppointment.prisonerNumber],
        },
        user,
      )
      .then(apps =>
        apps.find(
          app =>
            locationId === app.internalLocation.id &&
            mainAppointment.startTime === app.startTime &&
            mainAppointment.endTime === app.endTime,
        ),
      )

    if (appointment) {
      return appointment
    }

    // Due to a race condition when amending a video link booking, which is written to BVLS API, and then propagated to Activities API via SNS events,
    // a retry mechanism is implemented here to poll for the appointment to be propagated to activities API.

    if (retries > 0) {
      await new Promise(resolve => {
        setTimeout(resolve, delay)
      })

      return this.fetchMainAppointmentFromActivitiesAPI(mainAppointment, user, retries - 1, delay)
    }

    return undefined
  }
}
