import { nodeListForEach } from '../../utils'

function SelectAllLink(container) {
  this.container = container
  this.checkboxes = document.querySelectorAll(`input[name="${this.container.dataset.checkboxName}"]`)
  this.allSelected = false

  nodeListForEach(this.checkboxes, $cb => {
    $cb.addEventListener('change', () => this.setLinkText())
    $cb.setAttribute('autocomplete', 'off')
  })

  this.container.addEventListener('click', e => {
    e.preventDefault()
    nodeListForEach(this.checkboxes, checkbox => (checkbox.checked = !this.allSelected))
    this.setLinkText()
  })

  this.setLinkText = () => {
    this.allSelected = true
    nodeListForEach(this.checkboxes, checkbox => {
      if (!checkbox.checked) this.allSelected = false
    })
    this.container.innerText = this.allSelected ? 'Clear all' : 'Select all'
  }

  this.setLinkText()
}

export default SelectAllLink
