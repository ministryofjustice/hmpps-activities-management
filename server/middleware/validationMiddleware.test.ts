import { Request, Response } from 'express'
import { IsIn, IsNotEmpty, ValidateNested } from 'class-validator'
import { Expose, Type } from 'class-transformer'
import validationMiddleware from './validationMiddleware'

describe('validationMiddleware', () => {
  describe('middleware', () => {
    const res = { redirect: jest.fn(), locals: {} } as unknown as Response
    let req = {} as Request

    const notEmptyMessage = 'not empty'
    const notValidMessage = 'not a valid selection'

    class DummyChild {
      @Expose()
      @IsIn(['valid'], { message: notValidMessage })
      @IsNotEmpty({ message: notEmptyMessage })
      name: string
    }

    class DummyForm {
      @Expose()
      @IsNotEmpty({ message: notEmptyMessage })
      id: string

      @Expose()
      @ValidateNested()
      @Type(() => DummyChild)
      child: DummyChild
    }

    afterEach(() => {
      jest.resetAllMocks()
    })

    it('should call next when there are no validation errors', async () => {
      const next = jest.fn()
      req = {
        params: {},
        body: {
          id: 'abc',
          child: { name: 'valid' },
        },
        session: {},
        journeyData: {},
      } as Request

      await validationMiddleware(DummyForm)(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should return flash responses', async () => {
      const next = jest.fn()
      req = {
        params: {},
        flash: jest.fn(),
        body: {
          id: '',
          child: { name: 'valid' },
        },
        session: {},
        journeyData: {},
      } as unknown as Request

      await validationMiddleware(DummyForm)(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify([{ field: 'id', message: notEmptyMessage }]),
      )
      expect(req.flash).toHaveBeenCalledWith('formResponses', JSON.stringify(req.body))
    })

    it('should chain parent and child property names to report the bottom level error message', async () => {
      const next = jest.fn()
      req = {
        params: {},
        flash: jest.fn(),
        body: {
          id: 'abc',
          child: { name: '' },
        },
        session: {},
        journeyData: {},
      } as unknown as Request

      await validationMiddleware(DummyForm)(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'validationErrors',
        JSON.stringify([{ field: 'child-name', message: notEmptyMessage }]),
      )
    })
  })
})
