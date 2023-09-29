Ext.define('cssLockedGrid.dataview.List', {
    override: 'Ext.dataview.List',

    privates: {
        syncRows: function(bottomUp) {
            this.callParent(arguments);
        }
    }
})