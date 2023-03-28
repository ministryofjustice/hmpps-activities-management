import { registerDecorator, ValidationOptions } from 'class-validator'
import { isBinaryFileSync } from 'isbinaryfile'

export default function IsValidCsvFile(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'isValidCsvFile',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Express.Multer.File) {
          if (value === undefined) return true

          if (value.mimetype !== 'text/csv') return false

          if (value.size === 0) return false

          return !isBinaryFileSync(value.buffer || value.path)
        },
      },
    })
  }
}
