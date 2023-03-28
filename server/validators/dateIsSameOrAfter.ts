import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid, startOfDay } from 'date-fns'
import SimpleDate from '../commonValidationTypes/simpleDate'

export default function DateIsSameOrAfter(dateToCompare: Date, validationOptions?: ValidationOptions) {
  const dateIsSameOrAfter = (date: SimpleDate) =>
    date !== undefined && isValid(date.toRichDate()) ? startOfDay(date.toRichDate()) >= startOfDay(dateToCompare) : true

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
