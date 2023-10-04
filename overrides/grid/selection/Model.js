/**
 * Fixed issue with selection model not clearing selection and updated incorrect
 * method name used to obtain visible columns.
 */
Ext.define('cssLockedGrid.grid.selectionModel', {
    override: 'Ext.grid.selection.Model',

    privates: {

        onColumnsChanged: function () {
            var me = this,
                selData = me.getSelection(),
                view, selectionChanged;

            // When columns have changed, we have to deselect *every* cell in the row range
            // because we do not know where the columns have gone to.
            if (selData) {
                view = selData.view;
                if (selData.isCells) {
                    console.log('here')
                    // Original code forgot to clear selection.
                    selData.clear();

                    // FIXED method name
                    // was view.visibleColumn() - that is classic method
                    // EXTJS-29997
                    if (view.getVisibleColumns().length) {

                        selData.eachCell(function (location) {
                            view.onCellDeselect(location);
                        });
                    } else {
                        // clearSelections is now deselectAll
                        // EXTJS-29997
                        me.deselectAll();
                    }
                }
                // We have to deselect columns which have been hidden/removed
                else if (selData.isColumns) {
                    selectionChanged = false;

                    selData.eachColumn(function (column) {
                        if (!column.isVisible() || !view.isAncestor(column)) {
                            me.remove(column);
                            selectionChanged = true;
                        }
                    });
                }
            }

            // This event is fired directly from the HeaderContainer before the view updates.
            // So we have to wait until idle to update the selection UI.
            // NB: fireSelectionChange calls updateSelectionExtender after firing its event.
            Ext.on('idle', selectionChanged ? me.fireSelectionChange : me.updateSelectionExtender,
                me, {
                    single: true
                });
        }
    }
});