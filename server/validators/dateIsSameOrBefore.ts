import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'
import SimpleDate from '../commonValidationTypes/simpleDate'

export default function DateIsSameOrBefore(dateToCompare: Date, validationOptions?: ValidationOptions) {
  const dateIsSameOrBefore = (date: SimpleDate) =>
    isValid(date.toRichDate()) ? date.toRichDate() <= dateToCompare : true

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
