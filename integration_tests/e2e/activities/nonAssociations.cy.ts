import getActivity from '../../fixtures/activitiesApi/getActivity.json'
import getInmateDetails from '../../fixtures/prisonerSearchApi/getPrisoner-MDI-A5015DY.json'
import getNonAssociations from '../../fixtures/activitiesApi/non_associations.json'
import NonAssociationsPage from '../../pages/activities/nonAssociations'
import Page from '../../pages/page'
import { ActivitySchedule } from '../../../server/@types/activitiesAPI/types'

const getPrisonerAllocations = [
  {
    prisonerNumber: 'G6512VC',
    allocations: [
      {
        activitySummary: 'Barbering A',
        activityId: 858,
        scheduleId: 837,
        scheduleDescription: 'Barbering A',
      },
    ],
  },
  {
    prisonerNumber: 'G6815UH',
    allocations: [
      {
        activitySummary: 'Box making',
        activityId: 58,
        scheduleId: 58,
        scheduleDescription: 'Box making',
      },
    ],
  },
]
const activitySchedule1 = {
  id: 1,
  description: '',
  internalLocation: {
    id: 1,
    code: 'EDU-ROOM-1',
    description: 'Education - R1',
  },
  capacity: 10,
  activity: {
    id: 858,
    prisonCode: 'MDI',
    attendanceRequired: true,
    inCell: false,
    onWing: false,
    offWing: false,
  },
} as unknown as ActivitySchedule
const activitySchedule2 = {
  id: 1,
  description: '',
  internalLocation: {
    id: 1,
    code: 'EDU-ROOM-1',
    description: 'Education - R1',
  },
  capacity: 10,
  activity: {
    id: 58,
    prisonCode: 'MDI',
    attendanceRequired: true,
    inCell: false,
    onWing: false,
    offWing: false,
  },
} as unknown as ActivitySchedule

const activity58 = { schedules: [activitySchedule2], id: 58 } as unknown as JSON
const activity858 = { schedules: [activitySchedule1], id: 858 } as unknown as JSON

context('Non-associations', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.stubEndpoint('GET', '/activities/2/filtered', getActivity)
    cy.stubEndpoint('GET', '/activities/58/filtered', activity58)
    cy.stubEndpoint('GET', '/activities/858/filtered', activity858)
    cy.stubEndpoint('GET', '/prisoner/A5015DY', getInmateDetails)
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', getNonAssociations)
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', getPrisonerAllocations)
    cy.signIn()
  })
  it('should render the page - NAs present', () => {
    cy.visit('/activities/non-associations/2/A5015DY')
    const page = Page.verifyOnPage(NonAssociationsPage)
    page.caption().should('contain.text', 'A basic english course suitable for introduction to the subject')
    page.title().should('contain.text', 'Alfonso Cholak’s non-associations')
    page
      .para1()
      .should(
        'contain.text',
        'Check if attending this activity could mean Alfonso Cholak coming into contact with someone they must be kept apart from.',
      )
    page.NoNaActivity().should('not.exist')
    page.NoNaPrison().should('not.exist')
    cy.get('h2')
      .first()
      .should('contain.text', 'People allocated to A basic english course suitable for introduction to the subject')
    page
      .naActivityTable()
      .find('td')
      .then($data => {
        expect($data.get(0).innerText).to.contain('Adalie, Izrmonntas\nG6512VC')
        expect($data.get(1).innerText).to.contain('A-N-2-24S')
        expect($data.get(2).innerText).to.contain('Barbering A')
        expect($data.get(3).innerText).to.contain(
          'Where to keep apart: Cell and landing\n\nReason: Bullying\n\nComments: Keep apart\n\nAlfonso Cholak’s role: Perpetrator',
        )
        expect($data.get(4).innerText).to.contain('15 October 2024')
      })
    cy.get('h2').eq(1).should('contain.text', 'Other people in Moorland (HMP & YOI)')
    page
      .naPrisonTable()
      .find('td')
      .then($data => {
        expect($data.get(0).innerText).to.contain('Alanoine, Uzfanaye\nG6815UH')
        expect($data.get(1).innerText).to.contain('E-1-14S')
        expect($data.get(2).innerText).to.contain('Box making')
        expect($data.get(3).innerText).to.contain(
          'Where to keep apart: Cell, landing and wing\n\nReason: Gang related\n\nComments: Explain why these prisoners should be kept apart. Include any relevant IR numbers, if you have them.By saving these details, you confirm that, to the best of your knowledge, the information you have provided is correct. Plus 17 characters.!\n\nAlfonso Cholak’s role: Perpetrator',
        )
        expect($data.get(4).innerText).to.contain('8 August 2024')
      })
  })
  it('should go to the allocation page for that activity when link is clicked', () => {
    cy.visit('/activities/non-associations/2/A5015DY')
    const page = Page.verifyOnPage(NonAssociationsPage)
    page.allocationLink(858).click()
    cy.location().should(loc => {
      expect(loc.pathname).to.eq('/activities/allocation-dashboard/858')
    })
  })
  it('should render the page - NAs not present', () => {
    cy.stubEndpoint('GET', '/schedules/2/non-associations\\?prisonerNumber=A5015DY', [])
    cy.stubEndpoint('POST', '/prisons/MDI/prisoner-allocations', [])

    cy.visit('/activities/non-associations/2/A5015DY')
    const page = Page.verifyOnPage(NonAssociationsPage)
    page.caption().should('contain.text', 'A basic english course suitable for introduction to the subject')
    page.title().should('contain.text', 'Alfonso Cholak’s non-associations')
    page
      .para1()
      .should(
        'contain.text',
        'Check if attending this activity could mean Alfonso Cholak coming into contact with someone they must be kept apart from.',
      )
    cy.get('h2')
      .first()
      .should('contain.text', 'People allocated to A basic english course suitable for introduction to the subject')
    cy.get('h2').eq(1).should('contain.text', 'Other people in Moorland (HMP & YOI)')
    cy.get('[data-qa=na-table]').should('not.exist')
    page
      .NoNaActivity()
      .should(
        'contain.text',
        'Alfonso Cholak has no open non-associations with anyone who is allocated to A basic english course suitable for introduction to the subject',
      )
    page
      .NoNaPrison()
      .should('contain.text', 'Alfonso Cholak has no open non-associations with anyone else in Moorland (HMP & YOI)')
  })
})
