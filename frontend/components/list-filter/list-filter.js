import { FilterToggleButton } from '@ministryofjustice/frontend'

function ListFilter(container) {
  this.container = container

  new FilterToggleButton({
    startHidden: true,
    toggleButton: {
      container: $('.moj-action-bar__filter'),
      showText: 'Show filter',
      hideText: 'Hide filter',
      classes: 'govuk-button--secondary',
    },
    closeButton: {
      container: $('.moj-filter__header-action'),
      text: 'Close',
    },
    filter: {
      container: $('.moj-filter'),
    },
  })
}

export default ListFilter
