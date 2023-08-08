import { nodeListForEach } from '../../utils'

function StickySelect(container) {
  this.container = container

  this.toggleAllButton = this.container.querySelector('#checkboxes-all')
  this.checkboxes = this.container.querySelectorAll('tbody .govuk-checkboxes__input')
  this.radios = this.container.querySelectorAll('tbody .govuk-radios__input')
  this.stickyBar = this.container.querySelector('.sticky-select-action-bar')
  this.selectedCount = this.container.querySelector('.sticky-select-action-bar__count')
  this.itemsDescriptionSingular = this.stickyBar.getAttribute('data-description-singular')
  this.itemsDescriptionPlural = this.stickyBar.getAttribute('data-description-plural')
  this.clearLink = this.container.querySelector('.sticky-select-action-bar__clear-link')
  this.actionButtons = this.container.querySelectorAll('.govuk-button')

  this.stickyBar.setAttribute('aria-disabled', 'true')

  this.toggleAllButton?.addEventListener('change', this.handleToggleAllButtonChanged.bind(this))
  this.toggleAllButton?.setAttribute('autocomplete', 'off')

  this.clearLink.addEventListener('click', this.clearAll.bind(this))

  nodeListForEach(
    this.checkboxes,
    function ($cb) {
      $cb.addEventListener('change', this.handleCheckboxChanged.bind(this))
      $cb.setAttribute('autocomplete', 'off')
    }.bind(this)
  )

  nodeListForEach(
    this.radios,
    function ($r) {
      $r.addEventListener('change', this.handleRadioChanged.bind(this))
      $r.setAttribute('autocomplete', 'off')
    }.bind(this)
  )
}

StickySelect.prototype.handleCheckboxChanged = function () {
  var count = 0
  nodeListForEach(
    this.checkboxes,
    function ($cb) {
      if ($cb.checked) count++
    }.bind(this)
  )

  if (count > 0) {
    this.stickyBar.classList.add('sticky-select-action-bar--active')
    this.stickyBar.setAttribute('aria-disabled', 'false')

    this.selectedCount.innerText = `${count} selected`

    if (count === 1 && this.itemsDescriptionSingular) {
      this.selectedCount.innerText = `${count} ${this.itemsDescriptionSingular} selected`
    } else if (count > 1 && this.itemsDescriptionPlural) {
      this.selectedCount.innerText = `${count} ${this.itemsDescriptionPlural} selected`
    }

    this.handleDisabledButtons(count)
  } else {
    this.stickyBar.classList.remove('sticky-select-action-bar--active')
    this.stickyBar.setAttribute('aria-disabled', 'true')
  }
}

StickySelect.prototype.handleRadioChanged = function () {
  var count = 0
  nodeListForEach(
    this.radios,
    function ($cb) {
      if ($cb.checked) count++
    }.bind(this)
  )

  if (count > 0) {
    this.stickyBar.classList.add('sticky-select-action-bar--active')
    this.stickyBar.setAttribute('aria-disabled', 'false')

    this.selectedCount.innerText = `${count} selected`

    if (this.itemsDescriptionSingular) {
      this.selectedCount.innerText = `${count} ${this.itemsDescriptionSingular} selected`
    }

    this.handleDisabledButtons(count)
  } else {
    this.stickyBar.classList.remove('sticky-select-action-bar--active')
    this.stickyBar.setAttribute('aria-disabled', 'true')
  }
}

StickySelect.prototype.handleToggleAllButtonChanged = function () {
  nodeListForEach(
    this.checkboxes,
    function ($el) {
      var event = document.createEvent('HTMLEvents')
      event.initEvent('change', false, true)
      $el.dispatchEvent(event)
    }.bind(this)
  )
}

StickySelect.prototype.handleDisabledButtons = function(checkCount) {
  const forbiddenActionIds = [...this.radios, ...this.checkboxes]
    .filter($el => $el.checked)
    .flatMap($el => $el.getAttribute('data-forbidden-action')?.split(' '))
    .filter($el => Boolean($el))

  nodeListForEach(
    this.actionButtons,
    function ($el) {
      if (parseInt($el.dataset.maxItems) < checkCount || forbiddenActionIds.includes($el.id)) {
        $el.setAttribute('disabled', 'disabled')
      } else {
        $el.removeAttribute('disabled')
      }
    }.bind(this)
  )
}

StickySelect.prototype.clearAll = function () {
  nodeListForEach(
    this.checkboxes,
    function ($el) {
      if ($el.checked) {
        $el.checked = false
        var event = document.createEvent('HTMLEvents')
        event.initEvent('change', false, true)
        $el.dispatchEvent(event)
      }
    }.bind(this)
  )

  nodeListForEach(
    this.radios,
    function ($el) {
      if ($el.checked) {
        $el.checked = false
        var event = document.createEvent('HTMLEvents')
        event.initEvent('change', false, true)
        $el.dispatchEvent(event)
      }
    }.bind(this)
  )

  if (this.toggleAllButton?.checked) {
    this.toggleAllButton.checked = false
    var event = document.createEvent('HTMLEvents')
    event.initEvent('click', false, true)
    this.toggleAllButton.dispatchEvent(event)
  }
}

export default StickySelect
