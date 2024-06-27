import * as cheerio from 'cheerio'
import nunjucks, { Template } from 'nunjucks'
import fs from 'fs'
import { format, startOfToday } from 'date-fns'
import { registerNunjucks } from '../../../../nunjucks/nunjucksSetup'
import attendanceListCancelledContext from '../../../fixtures/pages/record-attendance/attendance-list-cancelled.json'
import attendanceListContext from '../../../fixtures/pages/record-attendance/attendance-list.json'
import attendanceListNotEditableContext from '../../../fixtures/pages/record-attendance/attendance-list-not-editable.json'
import { UserDetails } from '../../../../@types/manageUsersApiImport/types'

const snippet = fs.readFileSync('server/views/pages/activities/record-attendance/attendance-list-single.njk')

const today = format(startOfToday(), 'yyyy-MM-dd')

describe('Views - Attendance list', () => {
  let compiledTemplate: Template

  const njkEnv = registerNunjucks()

  beforeEach(() => {
    attendanceListContext.instance.date = today
    attendanceListCancelledContext.instance.date = today
    compiledTemplate = nunjucks.compile(snippet.toString(), njkEnv)
  })

  it('should be able to mark attendance of session', () => {
    const $ = cheerio.load(compiledTemplate.render(attendanceListContext))
    expect($('input[name="selectedAttendances"]')).toHaveLength(2)
  })

  it('should not be able to mark attendance not WAITING', () => {
    const $ = cheerio.load(compiledTemplate.render(attendanceListContext))
    expect($('input[name="selectedAttendances"][value="2-G9584VP"]')).toHaveLength(0)
  })

  it('should not be able to mark attendance `WAITING` but not `editable`', () => {
    const $ = cheerio.load(compiledTemplate.render(attendanceListNotEditableContext))
    expect($('input[name="selectedAttendances"][value="2-G9584VP"]')).toHaveLength(0)
  })

  it('should not be able to mark attendance of cancelled session', () => {
    const $ = cheerio.load(
      compiledTemplate.render({
        instance: attendanceListCancelledContext.instance,
        userMap: new Map([['joebloggs', { name: 'Joe Bloggs' }]]) as unknown as Map<string, UserDetails>,
      }),
    )
    expect($('input[name="selectedAttendances"]')).toHaveLength(0)
  })

  it('should not be able to cancel session a when instance.isAmendable is flagged false', () => {
    attendanceListContext.instance.isAmendable = false
    const $ = cheerio.load(compiledTemplate.render(attendanceListContext))
    expect($('a[href="cancel"]')).toHaveLength(0)
  })
})
