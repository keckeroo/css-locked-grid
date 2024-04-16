/**
 * Fixed issue with selection model not clearing selection and updated incorrect
 * method name used to obtain visible columns.
 */
Ext.define('EXTJS_JIRA_002.grid.selection.Model', {
    override: 'Ext.grid.selection.Model',

    privates: {
        /**
         * Called when the grid's Navigation model detects navigation events (`mousedown`,
         * `click` and certain `keydown` events).
         * @param {Ext.event.Event} navigateEvent The event which caused navigation.
         * @private
         */
        onNavigate: function(navigateEvent) {
            var me = this,
                view = me.getView(),
                store = me.getStore(),
                selectingRows = me.getRows(),
                selectingCells = me.getCells(),
                selectingColumns = me.getColumns(),
                checkbox = me.getCheckbox(),
                checkboxOnly = me.checkboxOnly,
                mode = me.getMode(),
                location = navigateEvent.to,
                toColumn = location.column,
                record = location.record,
                sel = me.getSelection(),
                ctrlKey = navigateEvent.ctrlKey,
                shiftKey = navigateEvent.shiftKey,
                adding = true,
                isSpace = navigateEvent.getKey() === navigateEvent.SPACE,
                count, changedRow, selectionChanged, selected, lastSelected;

            // Honour the stopSelection flag which any prior handlers may set.
            // A SelectionColumn handles its own processing.
            if (navigateEvent.stopSelection || toColumn === me.checkboxColumn) {
                return;
            }

            // *key* navigation
            if (!navigateEvent.pointerType && !isSpace) {
                // CTRL/key just navigates, does not select
                if (ctrlKey) {
                    return;
                }

                // If within a row and not going to affect cell or column selection, then ignore.
                changedRow = !navigateEvent.from ||
                    (location.recordIndex !== navigateEvent.from.recordIndex);

                if (!changedRow && !(selectingCells || selectingColumns)) {
                    return;
                }
            }

            // Click is the mouseup at the end of a multi-cell/multi-column select swipe; reject.
            if (sel &&
                (sel.isCells || (sel.isColumns && selectingRows && !(ctrlKey || shiftKey))) &&
                sel.getCount() > 1 && !shiftKey && navigateEvent.type === 'click') {
                return;
            }

            // If all selection types are disabled, or it's not a selecting event, return
            if (!(selectingCells || selectingColumns || selectingRows) ||
                !record || navigateEvent.type === 'mousedown') {
                return;
            }

            // Ctrl/A key - Deselect current selection, or select all if no selection
            if (ctrlKey && navigateEvent.keyCode === navigateEvent.A && mode === 'multi') {
                // No selection, or only one, select all
                if (!sel || sel.getCount() < 2) {
                    me.selectAll();
                }
                else {
                    me.deselectAll();
                }

                me.updateHeaderState();

                return;
            }

            if (shiftKey && mode === 'multi') {
                // If the event is in one of the row selecting cells, or cell selecting is
                // turned off

                if (toColumn === me.numbererColumn || toColumn === me.checkColumn ||
                    !(selectingCells || selectingColumns) ||
                    (sel && (sel.isRows || sel.isRecords))) {

                    if (selectingRows) {
                        // If checkOnly is set, and we're attempting to select a row outside
                        // of the checkbox column, reject
                        if (toColumn !== checkbox && checkboxOnly) {
                            return;
                        }

                        if (!shiftKey && !ctrlKey) {
                            sel.clear();
                        }

                        // Ensure selection object is of the correct type
                        sel = me.getSelection('records');

                        // First shift
                        if (!sel.getRangeSize() || !(shiftKey || ctrlKey)) {
                            if (me.selectionStart == null || !(shiftKey || ctrlKey)) {
                                me.selectionStart = location.recordIndex;
                            }
                            sel.setRangeStart(me.selectionStart);
                        }
                        else {
                            // To have lastselected index to create range for multiple selection
                            lastSelected = Ext.isEmpty(sel.lastSelectedRecIndx)
                                ? new Ext.grid.Location(view, me.getLastSelected()).recordIndex
                                : sel.lastSelectedRecIndx;

                            // Because a range has already been started, and we are shift-selecting,
                            // we need to continue selection from the last selected location

                            // NEW CODE - this is commented out as it wasn't permitting range to shrink
                            if (!shiftKey) {
                                sel.setRangeStart(lastSelected);  // this is required to start new range when dealing with multiple ranges 
                            }
                        }

                        // end the range selection at the current location
                        sel.setRangeEnd(location.recordIndex);
                        selectionChanged = true;
                    }
                }
                // Navigate event in a normal cell
                else {
                    if (selectingCells) {
                        // Ensure selection object is of the correct type
                        sel = me.getSelection('cells');
                        count = sel.getCount();

                        // First shift
                        if (!sel.getRangeSize()) {
                            sel.setRangeStart(
                                navigateEvent.from ||
                                new Ext.grid.Location(me.getView(), { record: 0, column: 0 })
                            );
                        }

                        sel.setRangeEnd(location);
                        adding = count < sel.getCount();
                        selectionChanged = true;
                    }
                    else if (selectingColumns) {
                        // Ensure selection object is of the correct type
                        sel = me.getSelection('columns');

                        if (!sel.getCount()) {
                            sel.setRangeStart(toColumn);
                        }

                        sel.setRangeEnd(toColumn);
                        selectionChanged = true;
                    }
                }
            }
            // NOT MULTI + SHIFT
            else {
                // Clear selection start as we are not in SHIFT state.
                me.selectionStart = null;

                // Check for change in selection type
                if (sel && (mode !== 'multi' || !ctrlKey) && !isSpace) {
                    sel.clear(true);
                }

                // If we are selecting rows and (the event is in one of the row selecting
                // cells or we're *only* selecting rows) then select this row
                if (selectingRows &&
                    (toColumn === me.numbererColumn || toColumn === checkbox || !selectingCells)) {

                    // Ensure selection object is of the correct type
                    sel = me.getSelection('records'); // NEW (fix?)

                    if (mode === 'multi') {

                        if (!ctrlKey) {
                            sel.clear();
                        }

                        if (!sel.getRangeSize() || !(shiftKey || ctrlKey)) {
                            if (me.selectionStart == null || !(shiftKey || ctrlKey)) {
                                me.selectionStart = location.recordIndex;
                            }
                            sel.setRangeStart(me.selectionStart);
                        }
                    }

                    // If checkOnly is set, and we're attempting to select a row outside of the
                    // checkbox column, reject. Also reject if we're navigating by key within the same row.

                    if (toColumn !== checkbox && checkboxOnly || (navigateEvent.keyCode &&
                            navigateEvent.from && record === navigateEvent.from.record)) {
                        return;
                    }

                    // Toggle row selection
                    if (sel.isSelected(record)) {
                        // Only remove if ctrlKey or checkbox or row is deselectable
                        if (ctrlKey || toColumn === checkbox || me.getDeselectable()) {
                            sel.remove(record);
                            selectionChanged = true;
                        }
                    }
                    else {
                        // Add row to selection
                        sel.add(record, ctrlKey || toColumn === checkbox || mode === 'simple');
                        selectionChanged = true;
                    }

                    if (selectionChanged && (selected = sel.getSelected()) && selected.length) {
                        me.selectionStart = store.indexOf(selected.first());
                        sel.setRangeStart(me.selectionStart);
                    }
                }
                // Navigate event in a normal cell
                else {
                    // Prioritize cell selection over column selection
                    if (selectingCells) {
                        // Ensure selection object is of the correct type and cleared.
                        sel = me.getSelection('cells', true);
                        sel.setRangeStart(location);
                        selectionChanged = true;
                    }
                    else if (selectingColumns) {
                        // Ensure selection object is of the correct type
                        sel = me.getSelection('columns');

                        if (ctrlKey) {
                            if (sel.isSelected(toColumn)) {
                                    sel.remove(toColumn);
                            }
                            else {
                                sel.add(toColumn);
                            }
                        }
                        else {
                            sel.setRangeStart(toColumn);
                        }

                        selectionChanged = true;
                    }
                }
            }

            // If our configuration allowed selection changes, update check header and fire event
            if (selectionChanged) {
                // Base class reacts to RecordSelection mutating its record Collection
                // It will fire the events and update the checked header state.

                if (!sel.isRecords) {
                    me.fireSelectionChange(null, adding);
                }
            }

            me.lastDragLocation = location;
        },

        // CHANGED
        // Added columnadd and columnremove listeners
        // Removed columnchanged listener
        getViewListeners: function() {
            return {
                columnadd: 'onColumnsChanged', // Added
                columnremove: 'onColumnsChanged', // Added 
                columnmove: 'onColumnsChanged',
                scope: this,
                destroyable: true
            };
        },

        // CHANGED
        getSelection: function(what, reset) {
            var config, result;

            // The two are interchangeable, to callers, but virtual stores use
            // row range selection as opposed to record collection.
            if (what === 'rows' || what === 'records') {
                what = this.getStore().isVirtualStore ? 'rows' : 'records';
            }

            result = this.callSuper();

            // If called with a required type, ensure that the selection object
            // is of that type.
            if (what) {
                what = what.toLowerCase();

                // We have no selection configured OR the current selection
                // differs from the requested selection type, change the selection
                // type
                if (!result || result.type !== what) {
                    config = {
                        type: what
                    };

                    if (what === 'records') {
                        config.selected = this.getSelected();
                    }

                    // START OVERRIDE
                    // ENSURE THAT SELECTION START IS CLEARED BECAUSE WE ARE CHANGING SELECTION TYPES
                    this.selectionStart = null;
                    // END OVERRIDE
                    this.setSelection(config);

                    result = this.callSuper();
                }
                else if (reset) {
                    result.clear(true);
                }
            }

            return result;
        },

        // CHANGED
        onColumnsChanged: function () {
            var me = this,
                selData = me.getSelection(),
                view, selectionChanged;

            // When columns have changed, we have to deselect *every* cell in the row range
            // because we do not know where the columns have gone to.
            if (selData) {
                view = selData.view;
                if (selData.isCells) {
                    selData.clear();
                    selectionChanged = true;
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