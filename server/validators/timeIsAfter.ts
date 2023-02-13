import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'
import SimpleTime from '../commonValidationTypes/simpleTime'

export default function TimeIsAfter(property: string, validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'timeIsAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: SimpleTime, args: ValidationArguments) {
          const date = value.toDate()
          const [relatedPropertyName] = args.constraints
          const relatedDate = args.object[relatedPropertyName].toDate()
          return isValid(date) && isValid(relatedDate) ? date > relatedDate : true
        },
      },
    })
  }
}
