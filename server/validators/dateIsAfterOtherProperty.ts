import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import SimpleDate from '../commonValidationTypes/simpleDate'

export default function DateIsAfterOtherProperty(property: string, validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'dateIsAfterOtherProperty',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: SimpleDate, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints
          const relatedValue = args.object[relatedPropertyName]
          return relatedValue ? value.toIsoString() >= relatedValue : true
        },
      },
    })
  }
}
