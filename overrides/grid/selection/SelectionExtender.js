/**
 * Updated so that the selection handler should not be displayed when the
 * cell to which it is attached is under a locked region. Took a cue from 
 * the Classic toolkit code which already handled this.
 */
Ext.define('cssLockedGrid.grid.selection.SelectionExtender', {
    override: 'Ext.grid.selection.SelectionExtender',

    alignHandle: function () {
        var me = this,
            shouldDisplay,
            lastCell = me.endPos,
            cellLocked = lastCell && lastCell.cell.getLocked();

        if (me.firstPos && lastCell && me.view.isRecordRendered(lastCell.recordIndex)) {
            lastCell = lastCell.clone({
                record: lastCell.record,
                column: lastCell.column
            }).getCell();

            if (lastCell && lastCell.isVisible()) {
                me.enable();
            } else {
                me.disable();
            }
            me.handle.alignTo(lastCell, 'c-br');
            // >>>>> NEW
            shouldDisplay = cellLocked || me.isHandleWithinView(me.view);
            me.handle.setVisibility(shouldDisplay);
            // <<<<< END NEW
        } else {
            me.disable();
        }
    },

    isHandleWithinView: function (view) {
        var me = this,
            // CHANGE
            viewBox = view.isCssLockedGrid ? view.getCenterRegionBox() : view.el.getBox(),
            handleBox = me.handle.getBox(),
            offsets = me.handle.getOffsetsTo(view.el),
            withinX;

            // Adjust for local coordinates
            handleBox.left = offsets[0];
            handleBox.top  = offsets[1];
            handleBox.right = handleBox.left + handleBox.width;
            handleBox.bottom = handleBox.top + handleBox.height;

        withinX = viewBox.left <= handleBox.left && viewBox.right >= (handleBox.right - handleBox.width);
        return withinX;
    }
})
