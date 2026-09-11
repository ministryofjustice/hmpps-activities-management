import { Request, Response } from 'express'
import { VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
import BookAVideoLinkService from '../../../../../services/bookAVideoLinkService'
import PrisonService from '../../../../../services/prisonService'

export default class MovementSlipRoutes {
  constructor(
    private readonly bookAVideoLinkService: BookAVideoLinkService,
    private readonly prisonService: PrisonService,
  ) {}

  GET = async (req: Request, res: Response): Promise<void> => {
    const { vlbId } = req.params
    const { user } = res.locals

    const videoBooking = await this.bookAVideoLinkService.getVideoLinkBookingById(+vlbId, user)
    const { preAppointment, mainAppointment, postAppointment } = this.fetchAppointments(videoBooking)
    const prisoner = await this.prisonService.getInmateByPrisonerNumber(mainAppointment.prisonerNumber, user)
    const rooms = await this.bookAVideoLinkService.getAppointmentLocations(mainAppointment.prisonCode, user)

    res.render('pages/appointments/video-link-booking/court/movement-slip', {
      preAppointment: preAppointment
        ? {
            ...preAppointment,
            locationDescription: rooms.find(r => r.dpsLocationId === preAppointment.dpsLocationId)?.description,
          }
        : undefined,
      mainAppointment: mainAppointment
        ? {
            ...mainAppointment,
            locationDescription: rooms.find(r => r.dpsLocationId === mainAppointment.dpsLocationId)?.description,
          }
        : undefined,
      postAppointment: postAppointment
        ? {
            ...postAppointment,
            locationDescription: rooms.find(r => r.dpsLocationId === postAppointment.dpsLocationId)?.description,
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
