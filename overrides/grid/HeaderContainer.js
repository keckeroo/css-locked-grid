/**
 * Adds new event 'columnschanged' to header container to signify 
 * to locked grid that we may need to update grid column sizing or
 * locked statuses.
 */
Ext.define('cssLockedGrid.grid.HeaderContainer', {
    override: 'Ext.grid.HeaderContainer',

    onColumnAdd: function () {
        var me = this,
            grid = me.getGrid();

        this.callParent(arguments);
        grid.fireEvent('columnschanged', 'add', me);
    },

    onColumnMove: function () {
        var me = this,
            grid = me.getGrid();

        this.callParent(arguments);
        grid.fireEvent('columnschanged', 'insert', me);
    },

    onColumnRemove: function () {
        var me = this,
            grid = me.getGrid();

        this.callParent();
        grid.fireEvent('columnschanged', 'remove', me);
    }

/*
    add: function (items) {
        var me = this,
            grid = me.getGrid();

        grid.fireEvent('columnschanged', 'add', me);
        ret = this.callSuper([items]);
    },

    insert: function (index, item) {
        var me = this,
            grid = me.getGrid();

        grid.fireEvent('columnschanged', 'insert', me);
        return this.callSuper([index, item]);
    },

    remove: function (which, destroy) {
        var me = this,
            grid = me.getGrid();

        grid.fireEvent('columnschanged', 'remove', me);
        return this.callSuper([which, destroy]);
    }
*/

})