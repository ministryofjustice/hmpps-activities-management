ActivitiesFrontend.AutoComplete = function (meta) {
  this.meta = meta

  var autocompleteElements = this.meta.content.split(',')
  autocompleteElements.forEach(el => {
    accessibleAutocomplete.enhanceSelectElement({
      selectElement: document.querySelector('#' + el),
      showAllValues: true,
      preserveNullOptions: true,
    })
  })
}
