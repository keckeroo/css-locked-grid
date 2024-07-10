Ext.define(null, {
    override: 'Ext.scroll.VirtualScroller',

    config: {
        // NOTE WELL - all these values should be reconfigured
        // as a locked grid configuration with a single setter
        // to trigger refesh and work on all these as a single
        // changed set of values
        // Perhaps lockedSettings: { axisSize: { x, y }, barX, regionSizes: { .... }
        // Sizes of client x and y axis
        userClientSize: { x: null, y: null },

        // X point at which to start x axis scroller
        userClientX: 0,

        /**
         * @private
         * Used to determine if x axis scrollbar adjusts left to accommodate y
         * axis scrollbar. We only do this if there is no left region.
         */
        hasRightRegion: null
    },

    updateUserClientSize: function(value, oldValue) {
        this.refreshAxes();
    },

    privates: {
        onScroll: function(logicalX, logicalY) {
            var me = this,
                position = me.position,
                deltaX = logicalX - position.x,
                deltaY = logicalY - position.y,
                pageSize, pageSizeX, pageSizeY, offsetX, offsetY, physicalX, physicalY;

            if (deltaX || deltaY) {
                position.x = logicalX;
                position.y = logicalY;

                if (me.getInfinite()) {
                    pageSize = me.getPageSize();
                    pageSizeX = pageSize.x;

                    if (pageSizeX) {
                        offsetX = me.getOffsetX();
                        physicalX = logicalX - offsetX;

                        if (physicalX > pageSizeX) {
                            me.setOffsetX(Math.floor(logicalX / pageSizeX) * pageSizeX);
                        }
                        else if (physicalX < -pageSizeX) {
                            me.setOffsetX(Math.ceil(logicalX / pageSizeX) * pageSizeX);
                        }
                    }

                    pageSizeY = pageSize.y;

                    if (pageSizeY) {
                        offsetY = me.getOffsetY();
                        physicalY = logicalY - offsetY;

                        if (physicalY > pageSizeY) {
                            me.setOffsetY(Math.floor(logicalY / pageSizeY) * pageSizeY);
                        }
                        else if (physicalY < -pageSizeY) {
                            me.setOffsetY(Math.ceil(logicalY / pageSizeY) * pageSizeY);
                        }
                    }
                }

                if (me.isPrimary) {
                    me.callIndicators('onScroll');
                    me.callPartners('onPartnerScroll', logicalX, logicalY);
                    me.fireScroll(logicalX, logicalY, deltaX, deltaY);
                    me.callPartners('fireScroll', logicalX, logicalY, deltaX, deltaY);
                }
            }
        },
    }
});