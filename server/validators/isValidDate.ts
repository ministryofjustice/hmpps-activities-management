import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'

export default function IsValidDate(validationOptions?: ValidationOptions) {
  const isValidDate = (date: Date) => date !== undefined && isValid(date)

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
