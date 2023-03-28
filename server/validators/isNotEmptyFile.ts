import { registerDecorator, ValidationOptions } from 'class-validator'

export default function IsNotEmptyFile(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'isNotEmptyFile',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Express.Multer.File) {
          if (value === undefined) return true

          return value.size > 0
        },
      },
    })
  }
}
