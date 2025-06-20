import { IsIn, isNotEmpty, IsNotEmpty, IsNumberString, MaxLength, validate, ValidateIf } from 'class-validator'
import { Expose, Transform } from 'class-transformer'
import CvpLinkOneOrTheOther from './cvpLinkOneOrTheOther'

class BodyWithFeatureOn {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select if you know the court hearing link' })
  @CvpLinkOneOrTheOther('videoLinkUrl', 'hmctsNumber', true, {
    message: 'Enter one or the other',
  })
  cvpRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(o => o.cvpRequired === 'yes' && isNotEmpty(o.videoLinkUrl))
  @MaxLength(120, { message: 'Court hearing link must be $constraint1 characters or less' })
  videoLinkUrl: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  // The true value represents the feature switch
  @ValidateIf(o => o.cvpRequired === 'yes' && true && isNotEmpty(o.hmctsNumber))
  @MaxLength(8, { message: 'Number from CVP address must be $constraint1 characters or less' })
  @IsNumberString({ no_symbols: true }, { message: 'Number from CVP address must be a number, like 3457' })
  @IsNotEmpty({ message: 'Enter number from CVP address' })
  hmctsNumber: string

  constructor(params: Partial<BodyWithFeatureOn>) {
    Object.assign(this, params)
  }
}

class BodyWithFeatureOff {
  @Expose()
  @IsIn(['yes', 'no'], { message: 'Select if you know the court hearing link' })
  @CvpLinkOneOrTheOther('videoLinkUrl', 'hmctsNumber', false, {
    message: 'Enter one or the other',
  })
  cvpRequired: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  @ValidateIf(o => o.cvpRequired === 'yes' && isNotEmpty(o.videoLinkUrl))
  @MaxLength(120, { message: 'Court hearing link must be $constraint1 characters or less' })
  videoLinkUrl: string

  @Expose()
  @Transform(({ value, obj }) => (obj.cvpRequired === 'yes' ? value : undefined))
  // The false value represents the feature switch
  @ValidateIf(o => o.cvpRequired === 'yes' && false && isNotEmpty(o.hmctsNumber))
  @MaxLength(8, { message: 'Number from CVP address must be $constraint1 characters or less' })
  @IsNumberString({ no_symbols: true }, { message: 'Number from CVP address must be a number, like 3457' })
  @IsNotEmpty({ message: 'Enter number from CVP address' })
  hmctsNumber: string

  constructor(params: Partial<BodyWithFeatureOff>) {
    Object.assign(this, params)
  }
}

describe('Custom one or the other validator', () => {
  describe('With feature switch ON', () => {
    it('Pass validation - CVP required and only a valid video URL set', async () => {
      const passTest = new BodyWithFeatureOn({
        cvpRequired: 'yes',
        videoLinkUrl: 'Url',
        hmctsNumber: undefined,
      })

      const result = await validate(passTest, {})

      expect(result).toHaveLength(0)
    })

    it('Pass validation - CVP required and only a valid HMCTS number set', async () => {
      const passTest = new BodyWithFeatureOn({
        cvpRequired: 'yes',
        videoLinkUrl: undefined,
        hmctsNumber: '1234',
      })

      const result = await validate(passTest, {})

      expect(result).toHaveLength(0)
    })

    it('Pass validation - CVP is not required and no values are provided', async () => {
      const passTest = new BodyWithFeatureOn({
        cvpRequired: 'no',
        videoLinkUrl: undefined,
        hmctsNumber: undefined,
      })

      const result = await validate(passTest, {})

      expect(result).toHaveLength(0)
    })

    it('Fail validation - CVP required but no values for either property', async () => {
      const failTest = new BodyWithFeatureOn({
        cvpRequired: 'yes',
        videoLinkUrl: undefined,
        hmctsNumber: undefined,
      })

      const result = await validate(failTest, {})

      expect(result).toHaveLength(1)
    })

    it('Fail validation - CVP required but both values provided', async () => {
      const failTest = new BodyWithFeatureOn({
        cvpRequired: 'yes',
        videoLinkUrl: 'Url',
        hmctsNumber: '1234',
      })

      const result = await validate(failTest, {})

      expect(result).toHaveLength(1)

      expect(result[0].property).toEqual('cvpRequired')
      expect(result[0].constraints.cvpLinkOneOrTheOther).toEqual('Enter one or the other')
    })

    it('Fail validation - CVP required but non-numeric HMCTS number', async () => {
      const failTest = new BodyWithFeatureOn({
        cvpRequired: 'yes',
        videoLinkUrl: undefined,
        hmctsNumber: 'ABCD',
      })

      const result = await validate(failTest, {})

      expect(result).toHaveLength(1)

      expect(result[0].property).toEqual('hmctsNumber')
    })

    it('Fail validation - CVP required but numeric HMCTS number longer than maximum', async () => {
      const failTest = new BodyWithFeatureOn({
        cvpRequired: 'yes',
        videoLinkUrl: undefined,
        hmctsNumber: '123456789',
      })

      const result = await validate(failTest, {})

      expect(result).toHaveLength(1)

      expect(result[0].property).toEqual('hmctsNumber')
      expect(result[0].constraints?.maxLength).toEqual('Number from CVP address must be 8 characters or less')
    })

    it('Fail validation - CVP required but videoLinkUrl longer than maximum', async () => {
      const failTest = new BodyWithFeatureOn({
        cvpRequired: 'yes',
        videoLinkUrl: 'A'.repeat(121),
        hmctsNumber: undefined,
      })

      const result = await validate(failTest, {})

      expect(result).toHaveLength(1)

      expect(result[0].property).toEqual('videoLinkUrl')
      expect(result[0].constraints?.maxLength).toEqual('Court hearing link must be 120 characters or less')
    })
  })

  describe('With feature switch OFF', () => {
    it('Pass validation - CVP required and a valid video URL set', async () => {
      const passTest = new BodyWithFeatureOff({
        cvpRequired: 'yes',
        videoLinkUrl: 'Url',
        hmctsNumber: undefined,
      })

      const result = await validate(passTest, {})

      expect(result).toHaveLength(0)
    })

    it('Pass validation - CVP required and both values provided but HMCTS is ignored', async () => {
      const passTest = new BodyWithFeatureOff({
        cvpRequired: 'yes',
        videoLinkUrl: 'Url',
        hmctsNumber: '1234',
      })

      const result = await validate(passTest, {})

      expect(result).toHaveLength(0)
    })

    it('Fail validation - CVP required and no video URL set', async () => {
      const failTest = new BodyWithFeatureOff({
        cvpRequired: 'yes',
        videoLinkUrl: undefined,
        hmctsNumber: undefined,
      })

      const result = await validate(failTest, {})

      expect(result).toHaveLength(1)
    })
  })
})
