/**
 * Address issues scroll navigation issues with FilterBar
 * Jira TBD
 */
Ext.define(null, {
    override: 'Ext.grid.plugin.filterbar.FilterBar',

    createFilterBar: function() {
        var me = this,
            grid = me.getGrid(),
            header = grid.getHeaderContainer(),
            pos = grid.indexOf(header) || 0;
 
        if (grid.initialized) {

            var x = me.setBar(grid.insert(pos + 1, {
                xtype: 'fieldpanel',
                hidden: me.getHidden(),
                cls: [me.filterBarCls, Ext.baseCSSPrefix + 'headercontainer'],
                docked: 'top',
                // the column header container has a weight of 100 so we want
                // to dock it after that.
                weight: 110,
                weighted: true,
                autoSize: null,
                manageBorders: true,
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                scrollable: {
                    type: 'virtual',
                    x: false,
                    y: false,
                    indicators: {
                        x: false,
                        y: false
                    }
                }
            }));
        }
    }
})