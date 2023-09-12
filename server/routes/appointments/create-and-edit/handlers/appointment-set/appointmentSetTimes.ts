import { Transform, plainToInstance } from 'class-transformer'
import { Request, Response } from 'express'
import { ValidateNested } from 'class-validator'
import SimpleTime from '../../../../../commonValidationTypes/simpleTime'

// class-validator will not validate against object unknown properties, but it will validate a map.
// This hack transforms the object to a map for validation
// This seems to be a limitation of class-validator, https://github.com/typestack/class-validator/issues/1011
export class AppointmentTimes {
  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  startTime: Map<string, SimpleTime>

  @Transform(({ value }) =>
    Object.keys(value).reduce((acc, k) => acc.set(k, plainToInstance(SimpleTime, value[k])), new Map()),
  )
  @ValidateNested()
  endTime: Map<string, SimpleTime>
}

export default class AppointmentSetTimesRoutes {
  GET = async (req: Request, res: Response): Promise<void> => {
    const { appointments } = req.session.appointmentSetJourney

    res.render('pages/appointments/create-and-edit/appointment-set/times', { appointments })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const { startTime, endTime }: AppointmentTimes = req.body

    const startTimeObj = Array.from(startTime.keys()).reduce((acc, key) => {
      acc[key] = startTime.get(key)
      return acc
    }, {})

    const endTimeObj = Array.from(endTime.keys()).reduce((acc, key) => {
      acc[key] = endTime.get(key)
      return acc
    }, {})

    req.body.startTime = startTimeObj
    req.body.endTime = endTimeObj

    const { startDate } = req.session.appointmentJourney

    const appointments = req.session.appointmentSetJourney.appointments.map(appointment => ({
      prisoner: appointment.prisoner,
      startTime: {
        hour: startTimeObj[appointment.prisoner.number].hour,
        minute: startTimeObj[appointment.prisoner.number].minute,
      },
      endTime: {
        hour: endTimeObj[appointment.prisoner.number].hour,
        minute: endTimeObj[appointment.prisoner.number].minute,
      },
    }))

    // This shouldn't happen, but should the form submit with missing fields, this will catch that
    const appointmentWithMissingTime = appointments.find(a => !a.startTime || !a.endTime)
    if (appointmentWithMissingTime) {
      return res.validationFailed(
        'appointment',
        `No time set for prisoner, ${appointmentWithMissingTime.prisoner.number}`,
      )
    }

    const appointmentsWithInvalidStartTime = appointments.filter(
      a => plainToInstance(SimpleTime, a.startTime).toDate(startDate.date) < new Date(),
    )
    if (appointmentsWithInvalidStartTime.length > 0) {
      appointmentsWithInvalidStartTime.forEach(appointment => {
        res.addValidationError(`startTime-${appointment.prisoner.number}`, 'Select a start time that is in the future')
      })
      return res.validationFailed()
    }

    const appointmentsWithInvalidEndTime = appointments.filter(
      a =>
        plainToInstance(SimpleTime, a.endTime).toDate(startDate.date) <=
        plainToInstance(SimpleTime, a.startTime).toDate(startDate.date),
    )
    if (appointmentsWithInvalidEndTime.length > 0) {
      appointmentsWithInvalidEndTime.forEach(appointment => {
        res.addValidationError(`endTime-${appointment.prisoner.number}`, 'Select an end time after the start time')
      })
      return res.validationFailed()
    }

    req.session.appointmentSetJourney.appointments = appointments

    return res.redirect(`schedule${req.query.preserveHistory ? '?preserveHistory=true' : ''}`)
  }
}
