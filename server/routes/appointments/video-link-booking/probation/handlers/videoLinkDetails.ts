import { NextFunction, Request, Response } from 'express'
import { parse, parseISO } from 'date-fns'
import createHttpError from 'http-errors'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'
import UserService from '../../../../../services/userService'
import { PrisonAppointment, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import ActivitiesService from '../../../../../services/activitiesService'
import { ServiceUser } from '../../../../../@types/express'
import { AppointmentSearchResult } from '../../../../../@types/activitiesAPI/types'
import LocationMappingService from '../../../../../services/locationMappingService'
import config from '../../../../../config'

export default class VideoLinkDetailsRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly activitiesService: ActivitiesService,
    private readonly prisonService: PrisonService,
    private readonly userService: UserService,
    private readonly locationMappingService: LocationMappingService,
  ) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals

    const videoBooking = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const mainAppointment = this.fetchMainAppointment(videoBooking)

    if (!mainAppointment) {
      return next(createHttpError.NotFound())
    }

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(mainAppointment.prisonerNumber, user)

    const [rooms, userMap, mainAppointmentId] = await Promise.all([
      this.bookAVideoLinkService.getAppointmentLocations(mainAppointment.prisonCode, user),
      this.userService.getUserMap([videoBooking.createdBy, videoBooking.amendedBy], user),
      this.fetchMainAppointmentFromActivitiesAPI(mainAppointment, user).then(a => a?.appointmentId),
    ])

    const date = parseISO(mainAppointment.appointmentDate)
    const time = parse(mainAppointment.startTime, 'HH:mm', new Date(0))
    const isAmendable = this.bookAVideoLinkService.bookingIsAmendable(date, time, videoBooking.statusCode)

    return res.render('pages/appointments/video-link-booking/probation/details', {
      videoBooking,
      mainAppointmentId,
      mainAppointment,
      prisoner,
      rooms,
      userMap,
      isAmendable,
    })
  }

  private fetchMainAppointment = (videoLinkBooking: VideoLinkBooking) => {
    return videoLinkBooking.prisonAppointments.find(a => a.appointmentType === 'VLB_PROBATION')
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
          prisonerNumbers: [mainAppointment.prisonerNumber],
        },
        user,
      )
      .then(apps =>
        apps.find(
          app =>
            ['VLB', config.bvlsMasteredVlpmFeatureToggleEnabled ? 'VLPM' : ''].includes(app.category.code) && // Handle legacy probation bookings which may have type VLB
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
