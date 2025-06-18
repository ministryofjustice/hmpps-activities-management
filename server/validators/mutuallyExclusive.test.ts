import { IsNotEmpty, validate } from 'class-validator'
import { MutuallyExclusive } from './mutallyExclusive'

class Body {
  @MutuallyExclusive({ message: 'Group 1 must be mutually exclusive' }, 'group-one')
  @IsNotEmpty()
  propertyOne: string

  @MutuallyExclusive({ message: 'Group 1 must be mutually exclusive' }, 'group-one')
  @IsNotEmpty()
  propertyTwo: string

  @IsNotEmpty()
  propertyThree: number

  constructor(params: Partial<Body>) {
    Object.assign(this, params)
  }
}

describe('Mutually exclusive validator', () => {
  it('Fail all values - none provided', async () => {
    const failNoValuesTest = new Body({})

    const result = await validate(failNoValuesTest, {})

    expect(result).toHaveLength(3)
  })

  it('Pass validation - one mutually exclusive value provided', async () => {
    const passTest = new Body({
      propertyOne: 'Hello',
      propertyTwo: undefined,
      propertyThree: 1,
    })

    const result = await validate(passTest, {})

    expect(result).toHaveLength(0)
  })

  it('Fail validation - both mutually exclusive values provided', async () => {
    const failMutualTest = new Body({
      propertyOne: 'Hello',
      propertyTwo: 'Again',
      propertyThree: 1,
    })

    const result = await validate(failMutualTest, {})

    expect(result).toHaveLength(2)
    expect(result[0].property).toEqual('propertyOne')
    expect(result[0].constraints.MutuallyExclusive).toEqual('Group 1 must be mutually exclusive')
    expect(result[1].property).toEqual('propertyTwo')
    expect(result[1].constraints.MutuallyExclusive).toEqual('Group 1 must be mutually exclusive')
  })
})
