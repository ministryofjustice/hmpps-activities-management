import express from 'express'
import request from 'supertest'
import config from '../config'
import setUpWebSecurity from './setUpWebSecurity'

describe('setUpWebSecurity', () => {
  it('allows new DPS forms and legacy search forms supplied by the shared header', async () => {
    const app = express()
    app.use(setUpWebSecurity())
    app.get('/', (_req, res) => res.sendStatus(200))

    const response = await request(app).get('/').expect(200)
    const directives = response.headers['content-security-policy'].split(';')

    expect(directives).toContain(`form-action 'self' ${config.dpsHomePageUrl} ${config.prisonerWorkActivitiesUrl}`)
  })
})
