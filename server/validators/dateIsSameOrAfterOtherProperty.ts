import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import SimpleDate, { simpleDateFromDate } from '../commonValidationTypes/simpleDate'

export default function DateIsSameOrAfterOtherProperty(property: string, validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'dateIsSameOrAfterOtherProperty',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: SimpleDate, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints
          const relatedValue = args.object[relatedPropertyName]
          return relatedValue ? value >= simpleDateFromDate(new Date(relatedValue)) : true
        },
      },
    })
  }
}
