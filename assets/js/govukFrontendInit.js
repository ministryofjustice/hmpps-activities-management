window.GOVUKFrontend.initAll()
window.MOJFrontend.initAll()

// Initiate the back links
$('[class*=js-backlink]').on('click', e => {
  e.preventDefault()
  if ($('ul.govuk-error-summary__list').length > 0) {
    window.history.go(-2)
  } else {
    window.history.go(-1)
  }
})

$('[class*=js-print]').on('click', e => {
  e.preventDefault()
  window.print()
})
