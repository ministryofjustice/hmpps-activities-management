import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { isValid, startOfDay } from 'date-fns'
import { parseDatePickerDate } from '../utils/datePickerUtils'

export default function DatePickerDateIsSameOrAfter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dateToCompare: (o: any) => Date,
  validationOptions?: ValidationOptions,
) {
  const datePickerDateIsSameOrAfter = (datePickerDate: string, args: ValidationArguments) => {
    const date = parseDatePickerDate(datePickerDate)
    return isValid(date) ? startOfDay(date) >= startOfDay(new Date(dateToCompare(args.object))) : true
  }

  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'dateIsSameOrAfter',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: { validate: datePickerDateIsSameOrAfter },
    })
  }
}
