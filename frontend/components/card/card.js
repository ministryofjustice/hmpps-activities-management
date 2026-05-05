function Card(container) {
  this.container = container

  const link = this.container.querySelector('a')
  if (link !== null) {
    link.addEventListener('click', e => {
      e.stopPropagation()
    })
    this.container.addEventListener('click', e => {
      e.stopPropagation()
      link.click()
    })
  }
}

export default Card
