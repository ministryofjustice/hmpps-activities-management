import { Request, Response } from 'express'
import UploadByCsv from './uploadByCsv'

describe('Route Handlers - Create Appointment - Start', () => {
  const handler = new UploadByCsv()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      session: {},
    } as unknown as Request
  })

  describe('GET', () => {
    it('should render upload by CSV view', async () => {
      await handler.GET(req, res)
      expect(res.render).toHaveBeenCalledWith('pages/appointments/create-and-edit/upload-by-csv')
    })
  })

  describe('POST', () => {
    it('should redirect to upload prisoner list', async () => {
      await handler.POST(req, res)
      expect(res.redirect).toHaveBeenCalledWith('upload-prisoner-list')
    })
  })
})
