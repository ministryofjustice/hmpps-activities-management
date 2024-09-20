import { nodeListForEach } from './utils'
import BackLink from './components/back-link/back-link'
import PrintButton from './components/print-button/print-button'
import PrintSeparateSlipsButton from './components/print-button/print-separate-slips-button'
import Card from './components/card/card'
import StickySelect from './components/sticky-select/sticky-select'
import AutoComplete from './components/autocomplete/autocomplete'
import Calendar from './spikes/calendar'
import ListFilter from './components/list-filter/list-filter'
import AppointmentEndDate from './components/appointment-end-date/end-date'
import SelectAllLink from './components/select-all-link/select-all-link'
import FormSpinner from './components/form-spinner/form-spinner'

function initAll() {
  var $backLinks = document.querySelectorAll('[class*=js-backlink]')
  nodeListForEach($backLinks, function ($backLink) {
    new BackLink($backLink)
  })

  var $printButtons = document.querySelectorAll('[class*=js-print]')
  nodeListForEach($printButtons, function ($printButtons) {
    new PrintButton($printButtons)
  })

  var $printSeparateSlipsButtons = document.querySelectorAll('[class*=separate-slips-print]')
  nodeListForEach($printSeparateSlipsButtons, function ($printSeparateSlipsButtons) {
    new PrintSeparateSlipsButton($printSeparateSlipsButtons)
  })

  var $cards = document.querySelectorAll('.card--clickable')
  nodeListForEach($cards, function ($card) {
    new Card($card)
  })

  var $stickySelects = document.querySelectorAll('[data-module="activities-sticky-select"]')
  nodeListForEach($stickySelects, function ($stickySelect) {
    new StickySelect($stickySelect)
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
    new ListFilter($filter)
  })

  var $appointmentEndDates = document.querySelectorAll('[data-module="appointment-end-date"]')
  nodeListForEach($appointmentEndDates, function ($appointmentEndDate) {
    new AppointmentEndDate($appointmentEndDate)
  })

  var $selectAllLinks = document.querySelectorAll('[data-module="select-all-link"]')
  nodeListForEach($selectAllLinks, function ($selectAllLink) {
    new SelectAllLink($selectAllLink)
  })

  var $spinnerForms = document.querySelectorAll('[data-module="form-spinner"]')
  nodeListForEach($spinnerForms, function ($spinnerForm) {
    new FormSpinner($spinnerForm)
  })
}

export {
  initAll,
  BackLink,
  PrintButton,
  Card,
  StickySelect,
  AutoComplete,
  Calendar,
  ListFilter,
  AppointmentEndDate,
  SelectAllLink,
  FormSpinner,
}
