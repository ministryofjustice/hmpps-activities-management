function MultiSelect(container) {
  this.container = container

  this.toggleAllButton = this.container.querySelector('#checkboxes-all')
  this.checkboxes = this.container.querySelectorAll('tbody .govuk-checkboxes__input')
  this.stickyBar = this.container.querySelector('.multi-select-sticky')
  this.selectedCount = this.container.querySelector('.multi-select-sticky__count')

  this.stickyBar.setAttribute('aria-disabled', 'true')

  this.toggleAllButton.addEventListener('change', this.handleToggleAllButtonChanged.bind(this))
  this.toggleAllButton.setAttribute('autocomplete', 'off')

  ActivitiesFrontend.nodeListForEach(
    this.checkboxes,
    function ($cb) {
      $cb.addEventListener('change', this.handleCheckboxChanged.bind(this))
      $cb.setAttribute('autocomplete', 'off')
    }.bind(this)
  )
}

MultiSelect.prototype.handleCheckboxChanged = function () {
  var count = 0
  ActivitiesFrontend.nodeListForEach(
    this.checkboxes,
    function ($cb) {
      if ($cb.checked) count++
    }.bind(this)
  )

  this.selectedCount.innerText = `${count} selected`

  if (count > 0) {
    this.stickyBar.classList.add('multi-select-sticky--active')
    this.stickyBar.setAttribute('aria-disabled', 'false')
  } else {
    this.stickyBar.classList.remove('multi-select-sticky--active')
    this.stickyBar.setAttribute('aria-disabled', 'true')
  }
}

MultiSelect.prototype.handleToggleAllButtonChanged = function () {
  ActivitiesFrontend.nodeListForEach(
    this.checkboxes,
    function ($el) {
      var event = document.createEvent('HTMLEvents')
      event.initEvent('change', false, true)
      $el.dispatchEvent(event)
    }.bind(this)
  )
}

export default MultiSelect
