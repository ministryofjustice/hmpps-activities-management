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

    // By default accessible-autocomplete creates an input element with type="text".
    // We want to use type="search" to enable the clear button (cross) on these inputs
    document.querySelector('#' + el).setAttribute('type', 'search')
  })
}

export default AutoComplete
