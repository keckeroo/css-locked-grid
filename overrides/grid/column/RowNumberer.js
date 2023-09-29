/**
 * Define row numberer as locked by default. Also disable dragging.
 * 
 * NOTE: There is an issue when this component is used via the rowNumbers
 * config for grids. The css is not correctly applied to the column so 
 * the column is not transformed.
 */
Ext.define('cssLockedGrid.grid.column.RowNumberer', {
    override: 'Ext.grid.column.RowNumberer',

    locked: true,
    draggable: false
});