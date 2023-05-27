import { nodeListForEach } from '../../utils'

function MultiSelect(container) {
  this.container = container

  this.toggleAllButton = this.container.querySelector('#checkboxes-all')
  this.checkboxes = this.container.querySelectorAll('tbody .govuk-checkboxes__input')
  this.stickyBar = this.container.querySelector('.multi-select-sticky')
  this.selectedCount = this.container.querySelector('.multi-select-sticky__count')
  this.itemsDescriptionSingular = this.stickyBar.getAttribute('data-description-singular')
  this.itemsDescriptionPlural = this.stickyBar.getAttribute('data-description-plural')
  this.clearLink = this.container.querySelector('.multi-select-sticky__clear-link')
  this.actionButtons = this.container.querySelectorAll('.govuk-button')

  this.stickyBar.setAttribute('aria-disabled', 'true')

  this.toggleAllButton.addEventListener('change', this.handleToggleAllButtonChanged.bind(this))
  this.toggleAllButton.setAttribute('autocomplete', 'off')

  this.clearLink.addEventListener('click', this.clearAll.bind(this))

  nodeListForEach(
    this.checkboxes,
    function ($cb) {
      $cb.addEventListener('change', this.handleCheckboxChanged.bind(this))
      $cb.setAttribute('autocomplete', 'off')
    }.bind(this)
  )
}

MultiSelect.prototype.handleCheckboxChanged = function () {
  var count = 0
  nodeListForEach(
    this.checkboxes,
    function ($cb) {
      if ($cb.checked) count++
    }.bind(this)
  )

  if (count > 0) {
    this.stickyBar.classList.add('multi-select-sticky--active')
    this.stickyBar.setAttribute('aria-disabled', 'false')

    this.selectedCount.innerText = `${count} selected`

    if (count === 1 && this.itemsDescriptionSingular) {
      this.selectedCount.innerText = `${count} ${this.itemsDescriptionSingular} selected`
    } else if (count > 1 && this.itemsDescriptionPlural) {
      this.selectedCount.innerText = `${count} ${this.itemsDescriptionPlural} selected`
    }

    this.handleDisabledButtons(count)
  } else {
    this.stickyBar.classList.remove('multi-select-sticky--active')
    this.stickyBar.setAttribute('aria-disabled', 'true')
  }
}

MultiSelect.prototype.handleToggleAllButtonChanged = function () {
  nodeListForEach(
    this.checkboxes,
    function ($el) {
      var event = document.createEvent('HTMLEvents')
      event.initEvent('change', false, true)
      $el.dispatchEvent(event)
    }.bind(this)
  )
}

MultiSelect.prototype.handleDisabledButtons = function (checkCount) {
  nodeListForEach(
    this.actionButtons,
    function ($el) {
      if (parseInt($el.dataset.maxItems) < checkCount) {
        $el.setAttribute('disabled', 'disabled')
      } else {
        $el.removeAttribute('disabled')
      }
    }.bind(this)
  )
}

MultiSelect.prototype.clearAll = function () {
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

  if (this.toggleAllButton.checked) {
    this.toggleAllButton.checked = false
    var event = document.createEvent('HTMLEvents')
    event.initEvent('click', false, true)
    this.toggleAllButton.dispatchEvent(event)
  }
}

export default MultiSelect
