import { RequestHandler } from 'express'
import { parse } from 'date-fns'
import createHttpError from 'http-errors'
import { Services } from '../../../../../services'
import asyncMiddleware from '../../../../../middleware/asyncMiddleware'
import config from '../../../../../config'

export default ({
  activitiesService,
  bookAVideoLinkService,
  prisonService,
  locationMappingService,
}: Services): RequestHandler => {
  return asyncMiddleware(async (req, res, next) => {
    const { bookingId } = req.params
    const { user } = res.locals

    if (bookingId === req.session.bookAProbationMeetingJourney?.bookingId?.toString()) return next()

    const booking = await bookAVideoLinkService.getVideoLinkBookingById(Number(bookingId), user)

    const getAppointment = (type: string) => booking.prisonAppointments.find(a => a.appointmentType === type)
    const parseTimeToISOString = (time: string) => (time ? parse(time, 'HH:mm', new Date(0)).toISOString() : undefined)
    const parseDateToISOString = (date: string) =>
      date ? parse(date, 'yyyy-MM-dd', new Date()).toISOString() : undefined

    const mainAppointment = getAppointment('VLB_PROBATION')

    if (!mainAppointment) {
      return next(createHttpError.NotFound())
    }

    const prisoner = await prisonService.getInmateByPrisonerNumber(mainAppointment.prisonerNumber, user)
    const locationId = await locationMappingService.mapDpsLocationKeyToNomisId(mainAppointment.prisonLocKey, user)

    const existingVlbAppointment = await activitiesService
      .searchAppointments(
        user.activeCaseLoadId,
        {
          appointmentType: 'INDIVIDUAL',
          startDate: mainAppointment.appointmentDate,
          prisonerNumbers: [prisoner.prisonerNumber],
        },
        user,
      )
      .then(apps =>
        apps.find(
          app =>
            ['VLB', config.bvlsMasteredVlpmFeatureToggleEnabled ? 'VLPM' : ''].includes(app.category.code) && // Handle legacy probation bookings which may have type VLB
            app.internalLocation.id === locationId &&
            mainAppointment.startTime === app.startTime &&
            mainAppointment.endTime === app.endTime,
        ),
      )

    req.session.bookAProbationMeetingJourney = {
      bookingId: Number(bookingId),
      appointmentId: existingVlbAppointment.appointmentId,
      bookingStatus: booking.statusCode,
      prisoner: {
        name: `${prisoner.firstName} ${prisoner.lastName}`,
        firstName: prisoner.firstName,
        lastName: prisoner.lastName,
        number: prisoner.prisonerNumber,
        prisonCode: prisoner.prisonId,
        cellLocation: prisoner.cellLocation,
        status: prisoner.status,
      },
      probationTeamCode: booking.probationTeamCode,
      meetingTypeCode: booking.probationMeetingType,
      officerDetailsNotKnown: booking.additionalBookingDetails?.contactName === undefined,
      officer: booking.additionalBookingDetails?.contactName
        ? {
            fullName: booking.additionalBookingDetails?.contactName,
            email: booking.additionalBookingDetails?.contactEmail,
            telephone: booking.additionalBookingDetails?.contactNumber,
          }
        : undefined,
      date: parseDateToISOString(mainAppointment.appointmentDate),
      startTime: parseTimeToISOString(mainAppointment.startTime),
      endTime: parseTimeToISOString(mainAppointment.endTime),
      locationCode: mainAppointment.prisonLocKey,
      comments: booking.comments,
    }

    return next()
  })
}
