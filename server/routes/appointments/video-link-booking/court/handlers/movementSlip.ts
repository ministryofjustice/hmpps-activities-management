import { Request, Response } from 'express'
import { Location, PrisonAppointment, VideoLinkBooking } from '../../../../../@types/bookAVideoLinkApi/types'
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
    const { preLocDesc, mainLocDesc, postLocDesc } = this.getLocationDescriptions(
      preAppointment,
      mainAppointment,
      postAppointment,
      rooms,
    )

    res.render('pages/appointments/video-link-booking/court/movement-slip', {
      preAppointment: preAppointment
        ? {
            ...preAppointment,
            locationDescription: preLocDesc,
          }
        : undefined,
      mainAppointment: mainAppointment
        ? {
            ...mainAppointment,
            locationDescription: mainLocDesc,
            hearingTypeDescription: videoBooking.courtHearingTypeDescription,
          }
        : undefined,
      postAppointment: postAppointment
        ? {
            ...postAppointment,
            locationDescription: postLocDesc,
          }
        : undefined,
      prisoner,
    })
  }

  private getLocationDescriptions = (
    pre: PrisonAppointment,
    main: PrisonAppointment,
    post: PrisonAppointment,
    rooms: Location[],
  ) => {
    const preLocDesc = rooms.find(r => r.dpsLocationId === pre?.dpsLocationId)?.description
    let mainLocDesc = rooms.find(r => r.dpsLocationId === main.dpsLocationId).description
    let postLocDesc = rooms.find(r => r.dpsLocationId === post?.dpsLocationId)?.description

    if (preLocDesc && postLocDesc) {
      if (preLocDesc === mainLocDesc && postLocDesc === mainLocDesc) {
        mainLocDesc = 'Same location'
        postLocDesc = 'Same location'
      }
    } else if (preLocDesc && preLocDesc === mainLocDesc) {
      mainLocDesc = 'Same location'
    } else if (postLocDesc && postLocDesc === mainLocDesc) {
      postLocDesc = 'Same location'
    }

    return {
      preLocDesc,
      mainLocDesc,
      postLocDesc,
    }
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
