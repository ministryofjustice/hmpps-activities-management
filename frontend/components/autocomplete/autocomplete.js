var autocompleteElements = document.getElementsByName('autocompleteElements')[0].content.split(',')

for (var i = 0; i < autocompleteElements.length; i++) {
  accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#' + autocompleteElements[i]),
    showAllValues: true,
    preserveNullOptions: true,
  })
}
