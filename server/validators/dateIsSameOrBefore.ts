import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isValid, startOfDay } from 'date-fns'
import SimpleDate from '../commonValidationTypes/simpleDate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DateIsSameOrBefore(dateToCompare: (o: any) => Date, validationOptions?: ValidationOptions) {
  const dateIsSameOrBefore = (date: SimpleDate, args: ValidationArguments) =>
    isValid(date.toRichDate())
      ? dateToCompare(args.object) === null || date.toRichDate() <= startOfDay(new Date(dateToCompare(args.object)))
      : true

  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'dateIsSameOrBefore',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: { validate: dateIsSameOrBefore },
    })
  }
}
