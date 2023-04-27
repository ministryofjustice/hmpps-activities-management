import accessibleAutocomplete from 'accessible-autocomplete'

function AutoComplete(meta) {
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

export default AutoComplete
