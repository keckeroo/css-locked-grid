/**
 * Update navigaton model to send information to parent 'setLocation' 
 * when locked grids are used as ensureVisible, in this case, needs 
 * information about center region box size and position to correctly
 * compute cell visibilty.
 */
Ext.define('cssLockedGrid.grid.NavigationModel', {
    override: 'Ext.grid.NavigationModel',

    setLocation: function (location, options) {
        var me = this,
            view = me.getView(),
            options = options || {},
            event = options && options.event;

        me.columnIndex = -1;

        if (location != null && !location.isGridLocation) {
            if (Ext.isArray(location)) {
                location = {
                    column: location[0],
                    record: location[1]
                };
            } else if (typeof location === 'number') {
                location = view.store.getAt(location);
            }
            location = me.createLocation(location);
            if (event) {
                location.event = event;
            }
        }

        // >>>>> NEW CODE
        if (view.isLockedGrid && location && !location.column.getLocked() && view.hasLockedRegions()) {
            Ext.apply(options, {
                adjustForCenterRegion: true,
                location: location
            })
        }
        // <<<<< END NEW CODE

        return me.callSuper([
            location,
            options
        ]);
    },

    privates: {
        onFocusMove: function (e) {
            var me = this,
                view = me.getView(),
                location = me.getLocation();

            if (e.toElement === view.el.dom && location) {
                me.clearLocation();
                return me.setLocation(location);
            }
            location = me.createLocation(e);

            if (!location.equals(me.location)) {
                // >>>>> NEW - SET LOCATION - GENERAL FIX - NOT LOCKED GRID RELATED
                // ENSURE CELL IS FULLY VISIBLE WHEN FOCUSED
                me.setLocation(location);
                // <<<<< END NEW
                me.handleLocationChange(location, {
                    event: e,
                    navigate: false
                });
            }
        }
    }
})
