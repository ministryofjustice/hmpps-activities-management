import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValidDatePickerDate } from '../utils/datePickerUtils'

export default function IsValidDatePickerDate(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'isValidDatePickerDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: { validate: isValidDatePickerDate },
    })
  }
}
