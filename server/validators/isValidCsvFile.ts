import { registerDecorator, ValidationOptions } from 'class-validator'
import { isBinaryFileSync } from 'isbinaryfile'
import fs from 'fs'

export default function IsValidCsvFile(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'isValidCsvFile',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Express.Multer.File) {
          if (value === undefined || !fs.existsSync(value.path)) return true

          let result = true

          if (value.mimetype !== 'text/csv') result = false

          if (isBinaryFileSync(value.path)) result = false

          if (!result) fs.unlinkSync(value.path)

          return result
        },
      },
    })
  }
}
