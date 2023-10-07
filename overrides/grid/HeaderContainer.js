/**
 * Updated to sort column(s) before adding them to the grid item list.
 * This ensures that columns are grouped together by region before they
 * are added to the grid.
 */
Ext.define('cssLockedGrid.grid.HeaderContainer', {
    override: 'Ext.grid.HeaderContainer',

    // If (re)configuring - sort items by region first
    add: function(items) {

        if (this.isCssLockedGrid && this.items.length === 0) {
            this.sortByRegion(items);
        }

        return this.callParent([ items ]);
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