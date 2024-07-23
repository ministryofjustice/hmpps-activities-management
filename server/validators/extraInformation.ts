import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { AppointmentJourney } from '../routes/appointments/create-and-edit/appointmentJourney'
import config from '../config'

export default function ExtraInformationValidator(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'ExtraInformation',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(extraInformation: string, args: ValidationArguments) {
          const { appointmentJourney } = args.object as {
            appointmentJourney: AppointmentJourney
          }
          if (appointmentJourney.category.code === 'VLB' && !config.bookAVideoLinkToggleEnabled) {
            return extraInformation.length > 0
          }

          // Default return (e.g., true if validation passes in cases other than 'VLB')
          return true
        },
      },
    })
  }
}
