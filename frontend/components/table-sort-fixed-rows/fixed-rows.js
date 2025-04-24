import { SortableTable } from '@ministryofjustice/frontend'

/*
 * When the attribute `data-table-fixed-rows` is applied to an MoJ sortable table this method overrides the default
 * sorting behaviour to enable fixed columns.
 * To use, add a `data-sort-fixed` attribute with the value "top" or "bottom" to the table cell to exclude it from
 * the column sort.
 */
SortableTable.prototype.mojSort = SortableTable.prototype.sort
SortableTable.prototype.sort = function (rows, columnNumber, sortDirection) {
  var tableHasFixedRow = rows[0].closest('table').getAttribute('data-table-fixed-rows')
  if (!tableHasFixedRow) return SortableTable.prototype.mojSort(...arguments)

  return rows.sort(
    function (rowA, rowB) {
      var tdA = rowA.querySelectorAll('td')[columnNumber]
      var tdB = rowB.querySelectorAll('td')[columnNumber]

      // If the cell is fixed, return the fixed sort value
      if (tdA.getAttribute('data-sort-fixed')) {
        return tdA.getAttribute('data-sort-fixed') === 'top' ? -1 : 1
      }
      if (tdB.getAttribute('data-sort-fixed')) {
        return tdB.getAttribute('data-sort-fixed') === 'top' ? 1 : -1
      }

      var valueA = this.getCellValue(tdA)
      var valueB = this.getCellValue(tdB)

      var sortVal = 0
      if (valueA < valueB) {
        sortVal = -1
      } else if (valueA > valueB) {
        sortVal = 1
      }

      return sortDirection === 'ascending' ? sortVal : -sortVal
    }.bind(this),
  )
}
