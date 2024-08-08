import { RequestHandler } from 'express'
import { parse } from 'date-fns'
import { Services } from '../../../../services'

export default ({ bookAVideoLinkService, prisonService }: Services): RequestHandler => {
  return async (req, res, next) => {
    const { bookingId } = req.params
    const { user } = res.locals

    if (bookingId === req.session.bookAVideoLinkJourney?.bookingId?.toString()) return next()

    const booking = await bookAVideoLinkService.getVideoLinkBookingById(Number(bookingId), user)

    const getAppointment = (type: string) => booking.prisonAppointments.find(a => a.appointmentType === type)
    const parseTimeToISOString = (time: string) => (time ? parse(time, 'HH:mm', new Date(0)).toISOString() : undefined)
    const parseDateToISOString = (date: string) =>
      date ? parse(date, 'yyyy-MM-dd', new Date()).toISOString() : undefined

    const preAppointment = getAppointment('VLB_COURT_PRE')
    const mainAppointment = getAppointment('VLB_COURT_MAIN')
    const postAppointment = getAppointment('VLB_COURT_POST')

    const prisoner = await prisonService.getInmateByPrisonerNumber(mainAppointment?.prisonerNumber, user)

    req.session.bookAVideoLinkJourney = {
      bookingId: Number(bookingId),
      bookingStatus: booking.statusCode,
      type: booking.bookingType,
      prisoner: {
        name: `${prisoner.firstName} ${prisoner.lastName}`,
        number: prisoner.prisonerNumber,
        prisonCode: prisoner.prisonId,
        cellLocation: prisoner.cellLocation,
        status: prisoner.status,
      },
      agencyCode: booking.courtCode,
      hearingTypeCode: booking.courtHearingType,
      date: parseDateToISOString(mainAppointment.appointmentDate),
      startTime: parseTimeToISOString(mainAppointment.startTime),
      endTime: parseTimeToISOString(mainAppointment.endTime),
      preHearingStartTime: parseTimeToISOString(preAppointment?.startTime),
      preHearingEndTime: parseTimeToISOString(preAppointment?.endTime),
      postHearingStartTime: parseTimeToISOString(postAppointment?.startTime),
      postHearingEndTime: parseTimeToISOString(postAppointment?.endTime),
      locationCode: mainAppointment?.prisonLocKey,
      preLocationCode: preAppointment?.prisonLocKey,
      postLocationCode: postAppointment?.prisonLocKey,
      comments: booking.comments,
      videoLinkUrl: booking.videoLinkUrl,
    }

    return next()
  }
}
