import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'
import SimpleDate from '../commonValidationTypes/simpleDate'

export default function DateIsSameOrAfter(dateToCompare: Date, validationOptions?: ValidationOptions) {
  const dtc = new Date(dateToCompare.setUTCHours(0, 0, 0, 0))

  const dateIsSameOrAfter = (date: SimpleDate) => (isValid(date.toRichDate()) ? date.toRichDate() >= dtc : true)

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
