/**
 * Updates to FilterBar to make it work with css locked grid columns.
 */
Ext.define('cssLockedGrid.grid.plugin.filterbar.FilterBar', {
    override: 'Ext.grid.plugin.filterbar.FilterBar',

    updateGrid: function (grid, oldGrid) {
        var me = this,
            listeners = me.getHeaderListeners();

        me.callSuper([grid, oldGrid]);

        me.listenersHeader = Ext.destroy(me.listenersHeader);

        if (grid && listeners) {
            me.listenersHeader = grid.getHeaderContainer().on(Ext.apply(listeners, {
                scope: me,
                destroyable: true
            }));
        }
    },

    updateBar: function (bar) {
        var me = this,
            grid = me.getGrid(),
            header = grid && grid.getHeaderContainer();

        if (bar) {
            header.getScrollable().addPartner(bar.getScrollable(), 'x');
            me.initializeFilters(header.getColumns());
        }
    },

    onColumnAdd: function (header, column, index) {
        var bar = this.getBar(),
            filter = column.getFilterType();

        if (!bar) {
            return;
        }

        if (!filter || !filter.isGridFilter) {
            filter = this.createColumnFilter(column);
        }

        bar.insert(index, filter.getField());
    },
})