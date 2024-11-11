/* eslint-disable dot-notation */
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { AppointmentJourney, AppointmentJourneyMode } from '../routes/appointments/create-and-edit/appointmentJourney'

export default function IsNotAnExistingAttendee(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'IsNotAnExistingAttendee',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(chosenPrisonerNumber: string, args: ValidationArguments) {
          const { appointmentJourney } = args.object as {
            appointmentJourney: AppointmentJourney
          }
          return !(
            appointmentJourney.mode === AppointmentJourneyMode.EDIT &&
            appointmentJourney.prisoners?.find(attendee => chosenPrisonerNumber === attendee.number)
          )
        },
      },
    })
  }
}
