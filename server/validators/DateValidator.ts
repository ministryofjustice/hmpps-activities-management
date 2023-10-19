import { registerDecorator, ValidationOptions } from 'class-validator'
import { CreateAnActivityJourney } from '../routes/activities/create-an-activity/journey'
import { AllocateToActivityJourney } from '../routes/activities/manage-allocations/journey'
import { WaitListApplicationJourney } from '../routes/activities/waitlist-application/journey'

// This provides typing for the properties we add to the requestObject in validationMiddleware
type ValidationObject = {
  createJourney: CreateAnActivityJourney
  allocateJourney: AllocateToActivityJourney
  waitListApplicationJourney: WaitListApplicationJourney
}

export default function DateValidator(
  evaluationMethod: (dateToEvaluate: Date, validationObject: ValidationObject) => boolean,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'DatePickerDateValidator',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (date, args) => !date || evaluationMethod(date, args.object as ValidationObject),
      },
    })
  }
}
