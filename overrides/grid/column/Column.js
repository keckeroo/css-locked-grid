/**
 * Add lockable configuration to grid columns. 
 */
Ext.define('cssLockedGrid.grid.column.Column', {
    override: 'Ext.grid.column.Column',

    config: {
        /**
         * @cfg {Boolean} lockable
         * Set to false to prevent a column from being locked or dragged to a locked
         * region. This property is set to true if the column's @{cfg:locked} config
         * is configured.
         */
        lockable: null,

        /**
         * @cfg {Boolean} alwaysLocked
         * Set to true to prevent a locked column from being moved from its locked region via dragging
         * or use of column menu locked option.
         */
        alwaysLocked: false
    },

    initialize: function () {
        var me = this;

        me.callParent();

        me.on({
            scope: me,
            columnlockedchange: 'onColumnLockedChange'
        })

    },

    applyLocked: function (locked) {
        // >>>>
        // >>>> LETS GET THIS TO BE ABLE TO DEFAULT TO A REGION
        // >>>>
        return locked === true ? 'left' : locked;
    },

    isLocked: function () {
        return this.getRegion() !== 'center';
    },

    getRegion: function () {
        return this._locked || 'center';
    },

    updateLockable: function (newVal, oldVal) {
        console.log('lockable is now ' + newVal);
    },

    updateLocked: function (newVal, oldVal) {
        var me = this,
            grid = me.getGrid(),
            cells = this.getCells(),
            headerCt = me.getRootHeaderCt(),
            columns = me.rendered ? headerCt.getColumns() : [],
            centerStart = columns.find((col) => !col.hasCls('x-locked')),
            centerEnd = columns.findLast((col) => !col.hasCls('x-locked')),
            fromCol = oldVal,
            toCol = newVal,
            colIndex = columns.indexOf(me),
            method, cls, pos;

        me.updateLockedCls(newVal);

        if (me.isRendered()) {
            // Unlock this column ... insert at correct location

            fromCol = fromCol || 'center';
            toCol = toCol || 'center';

            switch ((fromCol + toCol)) {
            case 'leftcenter':
            case 'centerleft':
            case 'rightleft':
                headerCt.insertBefore(me, centerStart);
                break;
            case 'leftright':
            case 'centerright':
            case 'rightcenter':
                headerCt.insertAfter(me, centerEnd);
            }

            me.fireEvent('columnlockedchange', grid, me, newVal, oldVal);
        }
    },

    updateLockedCls: function (locked) {
        var me = this,
            isLocked = me.isLocked(),
            grid = me.getGrid(),
            filterField = me.getFilterType() && me.getFilterType().field,
            cells = this.getCells(),
            method = isLocked ? 'addCls' : 'removeCls';

        me.removeCls(['x-locked', 'x-locked-left', 'x-locked-right']);
        me.setStyle({
            transform: null
        }); // Clear transformations

        if (isLocked) {
            me.addCls(['x-locked', `x-locked-${locked}`]);
        }

        //        console.log('CELLS LENGTH IS ', cells.length)
        cells.forEach(function (cell) {
            cell.setLocked(locked);
            // can we do all the other logic here rather than at cell level
        })

        // Check for filterbar and update style
        if (filterField) {
            this.applyLockedCls(filterField);
        }
    },

    applyLockedCls: function (cmp) {
        var me = this,
            cmps = Ext.Array.from(cmp),
            isLocked = me.isLocked(),
            region = me.getRegion();

        cmps.forEach(function (cmp) {
            cmp.removeCls(['x-locked', 'x-locked-left', 'x-locked-right']);
            cmp.setStyle({
                transform: null
            });

            if (isLocked) {
                cmp.addCls(['x-locked', `x-locked-${region}`]);
            }
        })
    },

    onColumnLockedChange: function (grid, col, newVal, oldVal) {
        grid.refresh();
        console.log('FROM COLUMN:COLUMN LOCKED HAS CHANGED')
    },

    updateFilterType: function (newFilterType, oldFilterType) {
        var filterField = newFilterType && newFilterType.field;

        if (filterField) {
            this.applyLockedCls(filterField);
        }
    },

    createCell: function (row) {
        var me = this,
            cfg = {
                row: row,
                ownerCmp: row || me,
                column: me,
                locked: me.getLocked(), // configure cell locked value
                width: me.rendered ? (me.getComputedWidth() || me.measureWidth()) : me.getWidth(),
                minWidth: me.getMinWidth()
            },
            align = me.getAlign(),
            cellCfg;

        if (row && row.isSummaryRow) {
            cellCfg = me.getSummaryCell();

            if (!cellCfg) {
                cellCfg = me.getCell();

                if (cellCfg.xtype === 'widgetcell') {
                    // We don't default to creating a widgetcell in a summary row, so
                    // fallback to a normal cell
                    cellCfg = Ext.apply({}, cellCfg);
                    cellCfg.xtype = 'gridcell';

                    delete cellCfg.widget;
                }
            }
        } else {
            cellCfg = me.getCell();
        }

        if (align) {
            // only put align on the config object if it is not null.  This prevents
            // the column's default value of null from overriding a value set on the
            // cell's class definition (e.g. widgetcell)
            cfg.align = align;
        }

        if (row) {
            cfg.hidden = me.isHidden(row.getGrid().getHeaderContainer());
            cfg.record = row.getRecord();

            if (!(cfg.ui = row.getDefaultCellUI())) {
                delete cfg.ui;
            }
        }

        if (typeof cellCfg === 'string') {
            cfg.xtype = cellCfg;
        } else {
            Ext.apply(cfg, cellCfg);
        }

        return cfg;
    },

    /*
     * @param {Boolean} all
     * True to return all column cells, not just ones associated with view rows
     */
    getCells: function (all) {
        var me = this,
            cells = [],
            rows = me.rendered ? this.getGrid().items.items : [],
            len = rows.length,
            i, row;

        if (all) {
            //            debugger;
        }
        for (i = 0; i < len; ++i) {
            row = rows[i];

            if (all || row.isGridRow) {
                cells.push(row.getCellByColumn(this));
            }
        }

        return cells;
    }
});
