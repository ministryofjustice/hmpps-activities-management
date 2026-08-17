import express, { Request, Response } from 'express'
import request from 'supertest'
import setUpMultipartFormDataParsing from './setUpMultipartFormDataParsing'

describe('setUpMultipartFormDataParsing', () => {
  it('fails validation when uploaded file is larger than 100kb', async () => {
    const app = express()

    app.use((_req: Request, res: Response, next) => {
      res.validationFailed = (field?: string, message?: string): void => {
        res.status(400).json({ field, message })
      }

      next()
    })

    app.use(setUpMultipartFormDataParsing())

    app.post('/', (_req, res) => {
      res.sendStatus(204)
    })

    const response = await request(app).post('/').attach('file', Buffer.alloc(100001), 'too-large.csv')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      field: 'file',
      message: 'The selected file must be smaller than 100kb',
    })
  })
})
