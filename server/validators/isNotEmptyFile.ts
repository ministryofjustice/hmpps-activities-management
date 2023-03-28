import { registerDecorator, ValidationOptions } from 'class-validator'
import fs from 'fs'

export default function IsNotEmptyFile(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: 'isNotEmptyFile',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Express.Multer.File) {
          if (value === undefined || !fs.existsSync(value.path)) return true

          let result = true

          const { size } = fs.lstatSync(value.path)

          if (size === 0) result = false

          if (!result) fs.unlinkSync(value.path)

          return result
        },
      },
    })
  }
}
