import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isValid, startOfDay } from 'date-fns'
import SimpleDate from '../commonValidationTypes/simpleDate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DateIsSameOrAfter(dateToCompare: (o: any) => Date, validationOptions?: ValidationOptions) {
  const dateIsSameOrAfter = (date: SimpleDate, args: ValidationArguments) =>
    date !== undefined && dateToCompare(args.object) && isValid(date.toRichDate())
      ? startOfDay(date.toRichDate()) >= startOfDay(new Date(dateToCompare(args.object)))
      : true

  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'dateIsSameOrAfter',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: { validate: dateIsSameOrAfter },
    })
  }
}
