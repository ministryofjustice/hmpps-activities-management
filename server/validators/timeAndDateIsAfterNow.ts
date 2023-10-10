import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'
import SimpleTime from '../commonValidationTypes/simpleTime'
import { parseDatePickerDate } from '../utils/datePickerUtils'

export default function TimeAndDateIsAfterNow(datePropertyName: string, validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'timeIsAfter',
      target: object.constructor,
      propertyName,
      constraints: [datePropertyName],
      options: validationOptions,
      validator: {
        validate(value: SimpleTime, args: ValidationArguments) {
          if (value === undefined) return true
          const [relatedPropertyName] = args.constraints
          if (args.object[relatedPropertyName] === undefined) return true
          const relatedDate = parseDatePickerDate(args.object[relatedPropertyName])
          const date = value.toDate(relatedDate)
          return isValid(relatedDate) && isValid(date) ? date > new Date() : true
        },
      },
    })
  }
}
