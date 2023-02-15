import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'
import SimpleDate from '../commonValidationTypes/simpleDate'

export default function IsValidDate(validationOptions?: ValidationOptions) {
  const isValidDate = (date: SimpleDate) => date !== undefined && isValid(date.toRichDate())

  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'isValidDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: { validate: isValidDate },
    })
  }
}
