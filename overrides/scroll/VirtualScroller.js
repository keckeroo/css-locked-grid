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
        // Used to determine if x axis scrollbar adjusts
        // left to accommodate y axis scrollbar. We only do
        // this if there is no left region.
        hasRightRegion: null
    },

    updateUserClientSize: function(value, oldValue) {
        this.refreshAxes();
    },
});