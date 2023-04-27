import { nodeListForEach } from './utils'
import BackLink from './components/back-link/back-link'
import PrintButton from './components/print-button/print-button'
import Card from './components/card/card'
import MultiSelect from './components/multi-select/multi-select'
import AutoComplete from './components/autocomplete/autocomplete'
import Calendar from './spikes/calendar'
import ListFilter from './components/list-filter/list-filter'
import AppointmentEndDate from './components/appointment-end-date/end-date'

function initAll() {
  var $backLinks = document.querySelectorAll('[class*=js-backlink]')
  nodeListForEach($backLinks, function ($backLink) {
    new BackLink($backLink)
  })

  var $printButtons = document.querySelectorAll('[class*=js-print]')
  nodeListForEach($printButtons, function ($printButtons) {
    new PrintButton($printButtons)
  })

  var $cards = document.querySelectorAll('.card--clickable')
  nodeListForEach($cards, function ($card) {
    new Card($card)
  })

  var $multiSelects = document.querySelectorAll('[data-module="activities-multi-select"]')
  nodeListForEach($multiSelects, function ($multiSelect) {
    new MultiSelect($multiSelect)
  })

  var $autoCompleteElements = document.getElementsByName('autocompleteElements')
  nodeListForEach($autoCompleteElements, function ($autoCompleteElements) {
    new AutoComplete($autoCompleteElements)
  })

  var $calendars = document.querySelectorAll('[data-module="calendar"]')
  nodeListForEach($calendars, function ($calendar) {
    new Calendar($calendar).init()
  })

  var $filters = document.querySelectorAll('[data-module="activities-list-filter"]')
  nodeListForEach($filters, function ($filter) {
    const startShown = $filter.getAttribute('data-filter-start-shown') === 'true'
    new ListFilter($filter, startShown)
  })

  var $appointmentStartDate = document.querySelectorAll('[data-module="appointment-end-date"]')
  nodeListForEach($appointmentStartDate, function ($appointmentStartDate) {
    new AppointmentEndDate($appointmentStartDate)
  })
}

export { initAll, BackLink, PrintButton, Card, MultiSelect, AutoComplete, Calendar, ListFilter, AppointmentEndDate }
