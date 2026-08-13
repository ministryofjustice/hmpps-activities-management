import * as cheerio from 'cheerio'
import fs from 'fs'
import { compile, Template } from 'nunjucks'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'

const view = fs.readFileSync('server/views/pages/appointments/attendance/attendance-details.njk')

describe('Views - Appointments - Attendance - Attendance details', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  const viewContext = () => ({
    attendanceDetails: {
      appointmentId: 1,
      appointmentName: 'Gym',
      appointmentDate: '2026-08-12',
      recordedBy: 'jsmith',
      recordedTime: '2026-08-12T12:00:00',
      attended: true,
      prisonerName: 'Bumahwaju Alfres',
      prisonerNumber: 'G8438VW',
    },
    userMap: new Map([['jsmith', { name: 'John Smith', username: 'jsmith' }]]),
    isOlderThanSevenDays: false,
  })

  beforeEach(() => {
    compiledTemplate = compile(view.toString(), njkEnv)
  })

  it('should allow recent attendance to be changed', () => {
    const $ = cheerio.load(compiledTemplate.render(viewContext()))

    expect($('a:contains("Change")')).toHaveLength(1)
  })

  it('should not allow attendance more than 7 days old to be changed', () => {
    const context = viewContext()
    context.isOlderThanSevenDays = true

    const $ = cheerio.load(compiledTemplate.render(context))

    expect($('a:contains("Change")')).toHaveLength(0)
  })
})
