/**
 * Ext.dataview.NavigationModel
 * 
 * Changes here require passing an options object so that setLocation
 * can also pass options to ensureVisible required to give context
 * to css Locked Grid information.
 */
Ext.define('cssLockedGrid.dataview.NavigatonModel', {
    override: 'Ext.dataview.NavigationModel',

    setLocation: function (location, options) {
        var me = this,
            view = me.getView(),
            oldLocation = me.location,
            animation = options && options.animation,
            scroller, child, record, itemContainer, childFloatStyle, locationView;

        if (location == null) {
            return me.clearLocation();
        }
        if (!location.isDataViewLocation) {
            location = this.createLocation(location);
        }
        locationView = location.view;

        if (!location.equals(oldLocation)) {
            record = location.record;
            child = location.child;

            if (record && !child) {
                return locationView.ensureVisible(record, {
                    animation: animation
                }).then(function () {
                    if (!me.destroyed) {
                        locationView.getNavigationModel().setLocation({
                            record: record,
                            column: location.column
                        }, options);
                    }
                });
            }

            if (child && me.floatingItems == null) {
                child = child.isComponent ? child.el : Ext.fly(child);
                itemContainer = child.up();
                childFloatStyle = child.getStyleValue('float');
                me.floatingItems = (view.getInline && view.getInline()) || child.isStyle('display', 'inline-block') || childFloatStyle === 'left' || childFloatStyle === 'right' || (itemContainer.isStyle('display', 'flex') && itemContainer.isStyle('flex-direction', 'row'));
            }

            scroller = locationView.getScrollable();
            if (scroller) {
                // ORIGINAL
                //                scroller.ensureVisible(location.sourceElement, {
                //                    animation: options && options.animation,
                //                    location: location // I do not believe this is ever used at all
                //                });
                // END ORIGINAL
                scroller.ensureVisible(location.sourceElement, options);
            }

            me.handleLocationChange(location, options);

            if (!me.destroyed) {
                me.doFocus();
            }
        }
    }
});
