import { NextFunction, Request, Response } from 'express'
import createHttpError from 'http-errors'
import { VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'

export default class MovementSlipRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals

    const videoBooking = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const { preAppointment, mainAppointment, postAppointment } = this.fetchAppointments(videoBooking)

    if (!mainAppointment) {
      return next(createHttpError.NotFound())
    }

    const prisoner = await this.prisonService.getInmateByPrisonerNumber(mainAppointment.prisonerNumber, user)
    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(mainAppointment.prisonCode, user)

    return res.render('pages/appointments/video-link-booking/court/movement-slip', {
      preAppointment: preAppointment
        ? {
            ...preAppointment,
            locationDescription:
              rooms.find(r => r.dpsLocationId === preAppointment?.dpsLocationId)?.description ??
              preAppointment.prisonLocKey,
          }
        : undefined,
      mainAppointment: mainAppointment
        ? {
            ...mainAppointment,
            locationDescription:
              rooms.find(r => r.dpsLocationId === mainAppointment.dpsLocationId)?.description ??
              mainAppointment.prisonLocKey,
            hearingTypeDescription: videoBooking.courtHearingTypeDescription,
          }
        : undefined,
      postAppointment: postAppointment
        ? {
            ...postAppointment,
            locationDescription:
              rooms.find(r => r.dpsLocationId === postAppointment?.dpsLocationId)?.description ??
              postAppointment.prisonLocKey,
          }
        : undefined,
      prisoner,
    })
  }

  private fetchAppointments = (videoLinkBooking: VideoLinkBooking) => {
    const findAppointment = (type: string) => videoLinkBooking.prisonAppointments.find(a => a.appointmentType === type)

    const preAppointment = findAppointment('VLB_COURT_PRE')
    const mainAppointment = findAppointment('VLB_COURT_MAIN')
    const postAppointment = findAppointment('VLB_COURT_POST')

    return {
      preAppointment,
      mainAppointment,
      postAppointment,
    }
  }
}
