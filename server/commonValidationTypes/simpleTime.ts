import { Expose, Type } from 'class-transformer'
import { IsInt, Max, Min } from 'class-validator'

const HOUR_MESSAGE = 'Enter a valid hour'
const MINUTE_MESSAGE = 'Enter a valid minute'

export default class SimpleTime {
  @Expose()
  @Type(() => Number)
  @IsInt({ message: HOUR_MESSAGE })
  @Min(0, { message: HOUR_MESSAGE })
  @Max(12, { message: HOUR_MESSAGE })
  hour: number

  @Expose()
  @Type(() => Number)
  @IsInt({ message: MINUTE_MESSAGE })
  @Min(0, { message: MINUTE_MESSAGE })
  @Max(59, { message: MINUTE_MESSAGE })
  minute: number

  toString = () => `${this.hour}:${this.minute}`
}
