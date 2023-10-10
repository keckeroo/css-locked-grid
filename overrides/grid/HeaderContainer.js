/**
 * Updated to sort column(s) before adding them to the grid item list.
 * This ensures that columns are grouped together by region before they
 * are added to the grid.
 *
 * This override also ensures that the 'columnschanged' event is fired for
 * add, insert and remove methods. This triggers the framework's grid selection
 * model's 'onColumnsChanged' method which clears selections whenever the grid
 * column ordering has been modified. The framework never fired this event
 * so selections where never cleared.
 */
Ext.define('cssLockedGrid.grid.HeaderContainer', {
    override: 'Ext.grid.HeaderContainer',

    // If (re)configuring - sort items by region first
    add: function(items) {
        if (this.isCssLockedGrid && this.items.length === 0) {
            this.sortByRegion(items);
        }

        // Fire event first so that selection styling can be removed
        this.getGrid().fireEvent('columnschanged', 'add', this);
        return this.callParent([ items ]);
    },

    insert: function (index, item) {
        // Fire event first so that selection styling can be removed
        this.getGrid().fireEvent('columnschanged', 'insert', this);
        return this.callParent([ index, item ]);
    },

    remove: function (which, destroy) {
        // Fire event first so that selection styling can be removed
        this.getGrid().fireEvent('columnschanged', 'remove', this);
        return this.callParent([ which, destroy ]);
    },

    privates: {
        sortByRegion: function(items) {
            var me = this,
                regions = me.getGrid().getRegions();

            if (items) {
                Ext.Array.sort(items, function(lhs, rhs) {
                    return regions[me.getLockedRegion(lhs)].weight - regions[me.getLockedRegion(rhs)].weight;
                });
            }
        },

        getLockedRegion: function(item) {
            switch (item.locked) {
                case (true || 'left') :
                    return 'left';
                case 'right':
                    return 'right';
                default:
                    return 'center'
            }
        }
    }
})