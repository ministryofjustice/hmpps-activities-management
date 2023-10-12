import { registerDecorator, ValidationOptions } from 'class-validator'

export default function DateValidator(
  evaluationMethod: (dateToEvaluate: Date) => boolean,
  validationOptions?: ValidationOptions,
) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'DatePickerDateValidator',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: date => !date || evaluationMethod(date),
      },
    })
  }
}
