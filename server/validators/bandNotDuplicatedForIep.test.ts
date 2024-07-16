import { Expose, plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { associateErrorsWithProperty } from '../utils/utils'
import IsNotDuplicatedForIep from './bandNotDuplicatedForIep'
import { parseDatePickerDate } from '../utils/datePickerUtils'

describe('bandNotDuplicatedForIep', () => {
  class DummyForm {
    @Expose()
    @IsNotDuplicatedForIep({ message: 'A rate for the selected band and incentive level already exists' })
    bandId: number

    @Expose()
    incentiveLevel: string
  }

  describe('single rates', () => {
    it('should fail validation if a duplicate band, iep level and no start date are selected', async () => {
      const body = {
        bandId: 1,
        incentiveLevel: 'Basic',
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 1 }, incentiveLevel: 'Basic' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'bandId', error: 'A rate for the selected band and incentive level already exists' },
      ])
    })

    it('should fail validation if a duplicate band, iep level and start date are selected', async () => {
      const body = {
        bandId: 1,
        incentiveLevel: 'Basic',
        startDate: parseDatePickerDate('27/06/24'),
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 1 }, incentiveLevel: 'Basic', startDate: '2024-06-27' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'bandId', error: 'A rate for the selected band and incentive level already exists' },
      ])
    })

    it('should pass validation if a new bandId is selected for the same iep level', async () => {
      const body = {
        bandId: 2,
        incentiveLevel: 'Basic',
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 1 }, incentiveLevel: 'Basic' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should pass validation if same bandId is selected for the same iep level with a different start date', async () => {
      const body = {
        bandId: 2,
        incentiveLevel: 'Basic',
        startDate: '27/06/24',
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 2 }, incentiveLevel: 'Basic', startDate: '2024-06-25' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should pass validation if same bandId is selected for the same iep level without an existing start date', async () => {
      const body = {
        bandId: 2,
        incentiveLevel: 'Basic',
        startDate: '25/06/24',
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 2 }, incentiveLevel: 'Basic' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should pass validation if same bandId is selected for the same iep level with an existing start date', async () => {
      const body = {
        bandId: 2,
        incentiveLevel: 'Basic',
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 2 }, incentiveLevel: 'Basic', startDate: '25/06/24' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should pass validation if a new iep level is selected for the same bandId', async () => {
      const body = {
        bandId: 1,
        incentiveLevel: 'Enhanced 2',
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 1 }, incentiveLevel: 'Enhanced' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should pass validation if no pay exists in session', async () => {
      const body = {
        bandId: 1,
        incentiveLevel: 'Enhanced 2',
      }

      const createJourney = {
        pay: [],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should fail validation if a flat rate exists for the same bandId', async () => {
      const body = {
        bandId: 1,
        incentiveLevel: 'Basic',
      }

      const createJourney = {
        pay: [],
        flat: [{ prisonPayBand: { id: 1 } }],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'bandId', error: 'A rate for the selected band and incentive level already exists' },
      ])
    })

    it('should not consider the current pay rate as a duplicate', async () => {
      const body = {
        bandId: 1,
        incentiveLevel: 'Basic',
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 1 }, incentiveLevel: 'Basic' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'single' }
      const queryParams = { bandId: '1', iep: 'Basic' }

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })

  describe('flat rates', () => {
    it('should fail validation if a duplicate band is selected', async () => {
      const body = {
        bandId: 1,
      }

      const createJourney = {
        pay: [],
        flat: [{ prisonPayBand: { id: 1 } }],
      } as unknown

      const pathParams = { payRateType: 'flat' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'bandId', error: 'A rate for the selected band and incentive level already exists' },
      ])
    })

    it('should pass validation if a new bandId is selected', async () => {
      const body = {
        bandId: 2,
      }

      const createJourney = {
        pay: [],
        flat: [{ prisonPayBand: { id: 1 } }],
      } as unknown

      const pathParams = { payRateType: 'flat' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should pass validation if no pay exists in session', async () => {
      const body = {
        bandId: 1,
      }

      const createJourney = {
        pay: [],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'flat' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })

    it('should fail validation if a single rate exists for the same bandId', async () => {
      const body = {
        bandId: 1,
      }

      const createJourney = {
        pay: [{ prisonPayBand: { id: 1 }, incentiveLevel: 'Enhanced' }],
        flat: [],
      } as unknown

      const pathParams = { payRateType: 'flat' }
      const queryParams = {}

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toEqual([
        { property: 'bandId', error: 'A rate for the selected band and incentive level already exists' },
      ])
    })

    it('should not consider the current pay rate as a duplicate', async () => {
      const body = {
        bandId: 1,
      }

      const createJourney = {
        pay: [],
        flat: [{ prisonPayBand: { id: 1 } }],
      } as unknown

      const pathParams = { payRateType: 'flat' }
      const queryParams = { bandId: '1' }

      const requestObject = plainToInstance(DummyForm, { createJourney, pathParams, queryParams, ...body })
      const errors = await validate(requestObject).then(errs => errs.flatMap(associateErrorsWithProperty))

      expect(errors).toHaveLength(0)
    })
  })
})
