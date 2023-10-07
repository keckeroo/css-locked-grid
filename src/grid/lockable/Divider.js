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
            columnadd: 'showDivider',
            columnremove: 'showDivider',
            columnhide: 'showDivider',
            columnshow: 'showDivider',
            columnresize: 'showDivider',
            columnlockedchange: 'showDivider'
        })
    },

    /**
     * @method
     * Calculates divider height and top position as well as if the divider should be
     * displayed or not based on right/left region content.
     *
     * TODO: ENSURE GRID PADDING/MARGIN/BORDERS are accounted for when computing divider position.
     * NOTE: Positioning of RIGHT divider calculatins MAY be off by 1px to far to the right.... investigate
     *       You can notice this when the z-index for the divider is removed.
     */
    showDivider: function() {
        var me = this,
            grid = me.getGrid(),
            region = me.getRegion(),
            height = grid.bodyElement.getSize().height,
            scrollMax = grid.getScrollable().getMaxPosition().x,
            regionWidth = grid.getRegionWidth(region),
            visible = !!regionWidth && !(region === 'right' && !scrollMax);

        if (visible) {
            const dockedItems = grid.getDockedItems();
            const gridBox = grid.el.getBox();
            const borders = grid.el.getBorders();
            const borderPadding = grid.el.getBorderPadding();
            let x = 0, y = 0;

            if (region === 'left') {
                x = regionWidth + (borderPadding.beforeX - borders.beforeX);
            }
            else {
                x = (gridBox.right - gridBox.left - borderPadding.afterX) - regionWidth;
                x -= (borderPadding.afterX - borders.afterX);
            }

            dockedItems.forEach(item => {
                switch (item.getDocked()) {
                    case 'top':
                        if (['headercontainer', 'container'].includes(item.xtype)) {
                            height += item.getSize().height;
                            break;
                        }
                        y += item.getSize().height;
                        break;
                    case 'bottom':
                        // We may need to adjust for docked 'rows' (summmary, etc). For now, we do nothing
                        // with bottom docked items.
                }
            });
            me.setHeight(height);
            me.setXY(x, y);
        }

        me.setVisibility(visible);
    }
});