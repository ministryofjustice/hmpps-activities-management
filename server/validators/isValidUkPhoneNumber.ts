import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValidPhoneNumber } from 'libphonenumber-js'

export default function IsValidUkPhoneNumber(validationOptions: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'IsValidUkPhoneNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: dataToValidate => isValidPhoneNumber(dataToValidate, 'GB'),
      },
    })
  }
}
