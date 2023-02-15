ActivitiesFrontend.MultiSelect = function (container) {
  this.container = container

  this.toggleAllButton = $(this.container.querySelector('#checkboxes-all'))
  this.checkboxes = $(this.container.querySelectorAll('tbody .govuk-checkboxes__input'))
  this.stickyBar = this.container.querySelector('.multi-select-sticky')
  this.selectedCount = this.container.querySelector('.multi-select-sticky__count')

  this.checkboxes.on('change', $.proxy(this, 'handleCheckboxChanged'))
  this.toggleAllButton.on('change', $.proxy(this, 'handleToggleAllButtonChanged'))

  this.checkboxes.each((i, cb) => $(cb).attr('autocomplete', 'off'))
  this.toggleAllButton.attr('autocomplete', 'off')
}

ActivitiesFrontend.MultiSelect.prototype.handleCheckboxChanged = function () {
  var count = this.checkboxes.filter(':checked').length
  this.selectedCount.innerText = `${count} selected`

  if (count > 0) {
    this.stickyBar.classList.add('multi-select-sticky--active')
  } else {
    this.stickyBar.classList.remove('multi-select-sticky--active')
  }
}

ActivitiesFrontend.MultiSelect.prototype.handleToggleAllButtonChanged = function () {
  this.checkboxes.each(
    $.proxy(function (index, el) {
      var event = document.createEvent('HTMLEvents')
      event.initEvent('change', false, true)
      el.dispatchEvent(event)
    }, this)
  )
}
