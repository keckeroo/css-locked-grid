/*
 * Ext.grid.cell.Base
 *
 * This override adds 'locked' context to a cell to indicate
 * region (left/right) in which cell is locked.
 */
Ext.define('cssLockedGrid.grid.cell.Base', {
    override: 'Ext.grid.cell.Base',

    config: {
        locked: null
    },

    lockedCls: Ext.baseCSSPrefix + 'locked',

    lockedRegionCls: {
        left: Ext.baseCSSPrefix + 'locked-left',
        right: Ext.baseCSSPrefix + 'locked-right'
    },

    /**
     * Adds or removes locked css for a cell based on updated locked value.
     * 
     * @param {String} locked 
     * @param {String} oldLocked 
     */
    updateLocked: function (locked, oldLocked) {
        var me = this;

        // Clear any transform settings and remove any locked styling
        me.setStyle({
            transform: null
        });
        me.removeCls([me.lockedCls, me.lockedRegionCls.left, me.lockedRegionCls.right]);

        if (me.lockedRegionCls[locked]) {
            me.addCls([me.lockedCls, me.lockedRegionCls[locked]]);
        }
    },

    privates: {
        beginRefresh: function (context) {
            var me = this,
                column = me.getColumn(),
                row = me.row;

            // Ask our parent row or column to kick things off...
            context = context ||
                (row ? row.beginRefresh() : {
                    record: me.getRecord()
                });

            //<debug>
            ++me.refreshCounter; // for testing
            context.from = context.from || 'cell';
            //</debug>

            context.cell = me;
            context.column = column;
            context.dataIndex = me.dataIndex;
            context.scope = column.getScope();

            return context;
        }
    }
});
