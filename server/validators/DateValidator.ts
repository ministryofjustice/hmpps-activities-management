import { registerDecorator, ValidationOptions } from 'class-validator'
import { CreateAnActivityJourney } from '../routes/activities/create-an-activity/journey'
import { AllocateToActivityJourney } from '../routes/activities/allocate-to-activity/journey'
import { WaitListApplicationJourney } from '../routes/activities/waitlist-application/journey'
import { DeallocateFromActivityJourney } from '../routes/activities/deallocate-from-activity/journey'

// This provides typing for the properties we add to the requestObject in validationMiddleware
type ValidationObject = {
  createJourney: CreateAnActivityJourney
  allocateJourney: AllocateToActivityJourney
  waitListApplicationJourney: WaitListApplicationJourney
  deallocateJourney: DeallocateFromActivityJourney
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
