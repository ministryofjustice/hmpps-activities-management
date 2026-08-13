import * as cheerio from 'cheerio'
import { compile, Template } from 'nunjucks'
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
    attendanceListContext.instance.isAmendable = true
    attendanceListCancelledContext.instance.date = today
    compiledTemplate = compile(snippet.toString(), njkEnv)
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

  it('should allow an amendable session to be cancelled', () => {
    const $ = cheerio.load(compiledTemplate.render(attendanceListContext))

    expect($('a[href="cancel"]:contains("Cancel this session")')).toHaveLength(1)
  })

  it('should not be able to cancel session a when instance.isAmendable is flagged false', () => {
    attendanceListContext.instance.isAmendable = false
    const $ = cheerio.load(compiledTemplate.render(attendanceListContext))
    expect($('a[href="cancel"]')).toHaveLength(0)
  })

  it('should display cancellation details and actions for a cancelled session', () => {
    const instance = {
      ...attendanceListCancelledContext.instance,
      cancelledBy: 'USER1',
      cancelledTime: '2023-02-02T10:15:23',
      cancelledReason: 'Location unavailable',
      comment: 'this is a comment',
      isAmendable: true,
    }

    const userMap = new Map([
      [
        'USER1',
        {
          username: 'USER1',
          name: 'John Smith',
        } as UserDetails,
      ],
    ])

    const $ = cheerio.load(
      compiledTemplate.render({
        instance,
        userMap,
      }),
    )

    const notification = $('.govuk-notification-banner')
    const notificationText = notification.text().replace(/\s+/g, ' ').trim()

    expect(notification.find('.govuk-notification-banner__heading').text().trim()).toBe('Session cancelled')

    expect(notificationText).toContain(
      'This activity session has been cancelled by USER1 - J. Smith on Thursday, 2 February 2023',
    )

    expect(notificationText).toContain('Location unavailable - this is a comment')

    expect(notification.find('a:contains("View or edit cancellation")')).toHaveLength(1)
    expect(notification.find('a:contains("uncancel this session")')).toHaveLength(1)
  })

  it('should display Employer-paid tag when outside work flag is set', () => {
    attendanceListContext.isPayable = false
    attendanceListContext.instance.activitySchedule.activity.outsideWork = true
    attendanceListContext.user.externalActivitiesRolledOut = true

    const $ = cheerio.load(compiledTemplate.render(attendanceListContext))
    expect($('strong:contains("Employer-paid")')).toHaveLength(1)
  })
})
