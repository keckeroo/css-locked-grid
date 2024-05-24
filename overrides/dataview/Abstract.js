Ext.define('EXTJS_30089.dataview.Abstract', {
    override: 'Ext.dataview.Abstract',

    initialize: function() {
        var me = this;

        me.callParent();

        // If there are space-taking scrollbars, prevent mousdown on a scrollbar
        // from focusing the view. This event will percolate up to the view if not
        // first stopped by any child element.
        if (Ext.scrollbar.width()) {
            me.bodyElement.on({
                'touchstart': '_checkScrollbarTouch',
                'touchend'  : '_checkScrollbarTouch',
                scope: me
            });
        }
    },

    privates: {
        // Nullify old handler for touchstart. Now handled by _checkScrollbarTouch
        // REMOVE THIS METHOD WHEN APPLYING FIX TO FRAMEWORK
        _onContainerTouchStart: () => { },

        _checkScrollbarTouch: function(e) {
            var me = this,
                eventType = e.type,
                lastLocation = eventType === 'touchstart' ? 'scrollbar' : null,
                isWithinScrollbar;

            if (e.getTarget(me.scrollbarSelector)) {
                // target is a scrollbar in a VirtualScroller
                e.preventDefault();
                isWithinScrollbar = true;
            }
            else if (!e.getTarget(me.itemSelector)) {
                e.preventDefault();

                if (!me.bodyElement.getClientRegion().contains(e.getPoint())) {
                    // target is a native scrollbar
                    isWithinScrollbar = true;
                }
            }

            if (isWithinScrollbar) {
                me.getNavigationModel().lastLocation = lastLocation;
            }
        }
    }
});