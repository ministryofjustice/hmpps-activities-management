import { registerDecorator, ValidationOptions } from 'class-validator'
import { isValid } from 'date-fns'
import SimpleTime from '../commonValidationTypes/simpleTime'

export default function IsValidTime(validationOptions?: ValidationOptions) {
  const isValidTime = (time: SimpleTime) => time !== undefined && isValid(time.toDate())

  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'isValidTime',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: { validate: isValidTime },
    })
  }
}
