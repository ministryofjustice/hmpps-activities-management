import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
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
          const [relatedPropertyName] = args.constraints
          const relatedValue = args.object[relatedPropertyName]
          return relatedValue ? value.toDate() > relatedValue.toDate() : true
        },
      },
    })
  }
}
