ActivitiesFrontend.nodeListForEach = function (nodes, callback) {
  if (window.NodeList.prototype.forEach) {
    return nodes.forEach(callback)
  }
  for (var i = 0; i < nodes.length; i++) {
    callback.call(window, nodes[i], i, nodes)
  }
}

ActivitiesFrontend.initAll = function () {
  var $backLinks = document.querySelectorAll('[class*=js-backlink]')
  ActivitiesFrontend.nodeListForEach($backLinks, function ($backLink) {
    new ActivitiesFrontend.BackLink($backLink)
  })

  var $printButtons = document.querySelectorAll('[class*=js-print]')
  ActivitiesFrontend.nodeListForEach($printButtons, function ($printButtons) {
    new ActivitiesFrontend.PrintButton($printButtons)
  })

  var $cards = document.querySelectorAll('.card--clickable')
  ActivitiesFrontend.nodeListForEach($cards, function ($card) {
    new ActivitiesFrontend.Card($card)
  })

  var $multiSelects = document.querySelectorAll('[data-module="activities-multi-select"]')
  ActivitiesFrontend.nodeListForEach($multiSelects, function ($multiSelect) {
    new ActivitiesFrontend.MultiSelect($multiSelect)
  })

  var $autoCompleteElements = document.getElementsByName('autocompleteElements')
  ActivitiesFrontend.nodeListForEach($autoCompleteElements, function ($autoCompleteElements) {
    new ActivitiesFrontend.AutoComplete($autoCompleteElements)
  })

  var $calendars = document.querySelectorAll('[data-module="calendar"]')
  ActivitiesFrontend.nodeListForEach($calendars, function ($calendar) {
    new ActivitiesFrontend.Calendar($calendar).init()
  })

  var $filters = document.querySelectorAll('[data-module="activities-list-filter"]')
  ActivitiesFrontend.nodeListForEach($filters, function ($filter) {
    const startShown = $filter.getAttribute('data-filter-start-shown') === 'true'
    new ActivitiesFrontend.ListFilter($filter, startShown)
  })
}
