import { nodeListForEach } from '../../utils'

function SelectAllLink(container) {
  this.container = container

  if (!this.container.dataset.checkboxName) return

  const checkboxName = this.container.dataset.checkboxName

  this.container.addEventListener('click', function (e) {
    const checkboxes = document.querySelectorAll(`input[name="${checkboxName}"]`)
    nodeListForEach(checkboxes, function (checkbox) {
      checkbox.checked = true
    })
    e.preventDefault()
  })
}

export default SelectAllLink
