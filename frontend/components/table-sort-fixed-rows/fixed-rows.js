/*
 * When the attribute `data-table-fixed-rows` is applied to an MoJ sortable table this method overrides the default
 * sorting behaviour to enable fixed columns.
 * To use, add a `data-sort-fixed` attribute with the value "top" or "bottom" to the table cell to exclude it from
 * the column sort.
 */
MOJFrontend.SortableTable.prototype.mojSort = MOJFrontend.SortableTable.prototype.sort
MOJFrontend.SortableTable.prototype.sort = function (rows, columnNumber, sortDirection) {
  if (!this.table.data('table-fixed-rows')) return MOJFrontend.SortableTable.prototype.mojSort(...arguments)

  var newRows = rows.sort(
    $.proxy(function (rowA, rowB) {
      var tdA = $(rowA).find('td').eq(columnNumber)
      var tdB = $(rowB).find('td').eq(columnNumber)

      // If the cell is fixed, return the fixed sort value
      if ($(tdA).attr('data-sort-fixed')) return $(tdA).attr('data-sort-fixed') == 'top' ? -1 : 1
      if ($(tdB).attr('data-sort-fixed')) return $(tdB).attr('data-sort-fixed') == 'top' ? 1 : -1

      var valueA = this.getCellValue(tdA)
      var valueB = this.getCellValue(tdB)

      var sortVal = 0
      if (valueA < valueB) {
        sortVal = -1
      } else if (valueA > valueB) {
        sortVal = 1
      }

      return sortDirection === 'ascending' ? sortVal : -sortVal
    }, this)
  )
  return newRows
}
