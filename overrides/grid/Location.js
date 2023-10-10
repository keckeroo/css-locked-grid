/**
 * Updates to grid location to permit some limited usage of virtual store.
 */
Ext.define('cssLockedGrid.grid.Location', {
    override: 'Ext.grid.Location',

    privates: {
        // ODD - this does not get called when navigating UP/DOWN
        // within a column ...  one would think it would ?
        getUpdatedLocation: function (column, targetRowIndex) {
            var me = this,
                grid = column.getGrid(),
                store = me.view.store,
                isVirtualStore = store.isVirtualStore,
                // KC,TODO: FIX ISSUE WHEN GRID HAS VIRTUAL STORE
                // getData returns null for virtual store.
                // TEMPORARY WORK AROUND - NEED TO INVESTIGATE WHY store.getData
                // was used rather that store.getAt()
                targetRecord = isVirtualStore ? store.getAt(targetRowIndex): store.getData().getAt(targetRowIndex),
                location = grid.createLocation(targetRecord);

            location.column = column;
            location.columnIndex = grid.getVisibleColumns().indexOf(column);
            location.cell = location.row && location.row.getCellByColumn(column);
            if (location.cell) {
                delete me.event;
                delete me.actionable;
                location.isTreeLocation = !!location.cell.isTreeCell;
                location.sourceElement = location.cell.el.dom;
                return location;
            } else {
                return null;
            }
        },

        /*
         * Navigates to the next visible *cell* Location.
         * @param {Boolean/Object} options An options object or a boolean flag meaning wrap
         * @param {Boolean} [options.wrap] `true` to wrap from the last to the first Location.
         * @return {Ext.grid.Location} A Location object representing the new location.
         * @private
         */
        nextCell: function(options) {
            var me = this,
                startPoint = me.clone(),
                result = me.clone(),
                columns = me.getVisibleColumns(),
                store = me.view.store,
                isVirtualStore = store.isVirtualStore,
                rowIndex = store.indexOf(me.row.getRecord()),

                targetIndex,
                wrap = false;

            if (options) {
                if (typeof options === 'boolean') {
                    wrap = options;
                }
                else {
                    wrap = options.wrap;
                }
            }

            do {
                // If we are at the start of the row, or it's not a grid row,
                // Go up to the last column.
                targetIndex = columns.indexOf(result.column) + 1;

                if (targetIndex === columns.length || !me.child.isGridRow) {
                    // We need to move down only if current row index > 1
                    if (rowIndex < store.getCount() - 1) {
                        result = me.getUpdatedLocation(columns[0], rowIndex + 1);
                    }
                    else if (wrap) {
                        result = me.getUpdatedLocation(columns[0], 0);
                    }
                }
                else {
                    result = me.getUpdatedLocation(columns[targetIndex], rowIndex);
                }

                // We've wrapped all the way round without finding a visible location.
                // Quit now.
                if (result && result.equals(startPoint)) {
                    break;
                }

                if (!result) {
                    result = startPoint;
                    break;
                }
            } while (result && !result.sourceElement);

            return result;
        }
    }
})