import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'

export default function IsBlankOrValidDate(validationOptions?: ValidationOptions) {
  const isValidDate = (date: Date) => date == null || isValid(date)

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
