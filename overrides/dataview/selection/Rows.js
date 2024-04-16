/**
 * A class which encapsulates a range of rows defining a selection in a grid.
 */
Ext.define('EXTJS_JIRA_002.dataview.selection.Rows', {
    override: 'Ext.dataview.selection.Rows',
 
    privates: {
        /**
         * @private
         */
        /**
         // PLACEHOLDER - KEEP AND REMOVE IF TESTS PASS
         clear: function(suppressEvent) {
            var me = this,
                view = me.view,
                partners = view.allPartners || view.selfPartner || [],
                selModel, i, partnerLen, selectable, selection, partner;
 
            for (i = 0, partnerLen = partners.length; i < partnerLen; ++i) {
                partner = partners[i];
                selectable = partner.getSelectable();
                selection = selectable.getSelection();
                selModel = selection.getSelectionModel();
 
                selModel.getSelected().removeAll();
                selection.getSelected().clear();
                
                // Enforce our selection model's deselectable: false by re-adding the last
                // selected index.
                // Suppress event because we might be firing it.
                if (!selModel.getDeselectable() && selection.lastSelected) {
                    selection.add(selection.lastSelected, true, true);
                }
 
                selection.manageSelection(null);
 
                if (!suppressEvent) {
                    selModel.fireSelectionChange();
                }
            }
            // START OVERRIDE
            // Ensure that range is reset as well
//            this.setRangeStart(null);  // ?? STILL NEEDED ???????
            // START OVERRIDE
        }, 
        */


        /**
         * Used during drag/shift+downarrow range selection on change of row.
         * @param {Number} end The end row index of the row drag selection.
         * @private
         */
        setRangeEnd: function(end) {
            var me = this,
                dragRange = me.dragRange || (me.dragRange = [0, end]),
                oldEnd = dragRange[1],
                start = dragRange[0],
                view = me.view,
                renderInfo = view.renderInfo,
                tmp = dragRange[1] = end,
                removeRange = [],
                addRange = false,
                rowIdx, limit;

            // Ranges retain whatever start end end point, regardless of order
            // We just need the real start and end index to test candidates for inclusion.
            if (start > end) {
                end = start;
                start = tmp;
            }
 
            rowIdx = Math.max(Math.min(dragRange[0], start, oldEnd, end),
                              renderInfo.indexTop);
 
            limit = Math.min(Math.max(dragRange[1], start, oldEnd, end),
                             renderInfo.indexBottom - 1);

            // Loop through the union of previous range and newly set range
            for (; rowIdx <= limit; rowIdx++) {
                // If we are outside the current dragRange, deselect
                if (rowIdx < start || rowIdx > end) {
                    view.onItemDeselect(rowIdx);
                    removeRange[removeRange.length ? 1 : 0] = rowIdx;
                }
                else {
                    view.onItemSelect(rowIdx, true);
                    addRange = true;
                }
            }
 
            if (addRange) {
                me.addRange(true);
            }
 
            if (removeRange.length) {
                // START OVERRIDE
                // Ensure that we have an end remove range value - not null
                if (!removeRange[1]) {
                    removeRange[1] = removeRange[0];
                }
                // END OVERRIDE
                me.removeRecordRange(removeRange[0], removeRange[1]);
            }
 
            me.lastSelectedIndex = end;
        }, 
    }
});
