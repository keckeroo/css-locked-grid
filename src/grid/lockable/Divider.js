/**
 * Region divider for css locked grid
 */
Ext.define('Ext.grid.lockable.RegionDivider', {
    extend: 'Ext.Component',
    xtype: 'regiondivider',

    config: {
        grid   : null,
        region : null,
        width  : 1
    },

    baseCls: Ext.baseCSSPrefix + 'grid-region-divider',

    initialize: function () {
        var me = this;

        me.getGrid().on({
            scope: me,
            refresh: 'showDivider',
            resize: 'showDivider',
            columnhide: 'showDivider',
            columnshow: 'showDivider',
            columnresize: 'showDivider',
            columnlockedchange: 'showDivider'
        })
    },

    showDivider: function() {
        var me = this,
            grid = me.getGrid(),
            scrollableMax = grid.getScrollable().getMaxPosition().x,
            borderPadding = grid.el.getBorderPadding(),
            centerRegionBox = grid.getCenterRegionBox(),
            region = me.getRegion(),
            visible = !!grid.getRegionWidth(region) && !(region === 'right' && !scrollableMax);

        me.setVisibility(visible);
        me.setHeight(centerRegionBox.bodyHeight);
        me.setXY(centerRegionBox[region], centerRegionBox.bodyTop);
    }
});