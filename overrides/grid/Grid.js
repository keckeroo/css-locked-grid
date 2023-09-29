/** 
 * EXTJS-29962: Grid column resizing not resizing cached (unused items)
 * This code is unrelated to css locked grid but is included to help add
 * to overall grid fixes.
 */
Ext.define('EXTJS_29962.grid.Grid', {
    override: 'Ext.grid.Grid',

    onStoreRefresh: function() {
        debugger;
        this.callParent();
    },
    
    privates: {
        // Fix issue with cells not resizing when they are filtered out
        onColumnComputedWidthChange: function (changedColumns, totalColumnWidth) {
            var me = this,
                groupingInfo = me.groupingInfo;

            if (!me.destroying) {
                // Set the item containing element to the correct width.
                me.setInnerWidth(totalColumnWidth);

                me.setCellSizes(changedColumns, me.items.items);

                // >>>>> BEGIN OVERRIDE
                me.setCellSizes(changedColumns, me.itemCache.unused);
                // <<<<< END OVERRIDE

                if (me.isGrouping()) {
                    me.setCellSizes(changedColumns, groupingInfo.header.unused);
                    me.setCellSizes(changedColumns, groupingInfo.footer.unused);
                }

                // Row sizing rules change if we have flexed columns.
                if (me.hasListeners.columnlayout) {
                    me.fireEvent('columnlayout', me, changedColumns, totalColumnWidth);
                }
            }
        }
    }
});