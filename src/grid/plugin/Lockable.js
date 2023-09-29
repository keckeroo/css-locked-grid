/**
 * This class is a grid plugin that adds locking features to the existing
 * Modern grid. It attempts to achieve the same functionality as
 * Ext.grid.locked.Grid using CSS to lock left and right regions reducing
 * the complexity of managing three different grids and all their configurations.
 */

// NOTE WELL NOTE WELL NOT WELL NOTE WELL!!!!!!!!!!
// - MUST TEST EVERYTHING WITH AN UNLOCKED GRID!!!!
// - MUST TEST EVERYTHING WITH VIRTUAL STORE !!!!

// **VISUAL ARTIFACTS AND ISSUES TO RESOLVE**
//
// TODO:
// - clicking on center column menu trigger can cause scroll jumping
// - visual artifacts in CELL select css when sorting columns
// - row numberer must be always left justified
// - update visual representation of bottom scrollbars for windows
// - focused cell should be focused when reusing cell during buffering (perhaps remembered)
//
// COMPLETED:
// * scrollbar at bottom needs to be in center region only
// * region delimiter using floating div
// * with cell selection - click - drag column - click another cell - two cells have cell selected styling
// * visual artifact when show/hide columns
// * need to  redraw region dividers when add/show/remove/hide columns
// * need to updated docked information when all items in a locked region are hidden
// * region dividers needs to adjust correctly when grid width < client width
// * spreadsheet selection should clear on any grid changes (columns, row insertions, etc)

Ext.myLogEnabled = true;

mylog = function() {
    var display = true;

    if (Ext.myLogEnabled) {
        console.log(...arguments);
    }
}

Ext.define('Ext.grid.plugin.Lockable', {
    extend: 'Ext.plugin.Abstract',
    alias: 'plugin.lockable',

    requires: [ 'Ext.grid.lockable.RegionDivider' ],

    config: {
        columnMenu: {
            items: {
                region: {
                    text: 'Locked',
                    iconCls: 'fi-lock',
                    menu: {}
                }
            }
        },

        regions: {
            left: {
                menuItem: {
                    text: 'Locked (Left)',
                    iconCls: 'fi-chevron-left'
                },
                weight: -10
            },
            center: {
                flex: 1,
                menuItem: {
                    text: 'Unlocked',
                    iconCls: 'fi-unlock'
                },
                weight: 0
            },
            right: {
                menuItem: {
                    text: 'Locked (Right)',
                    iconCls: 'fi-chevron-right'
                },
                weight: 10
            }
        }

    },

    setCmp: function (cmp) {
        this.cmp = cmp;

        if (cmp && cmp.isGrid && !cmp.isLockedGrid) {
            this.decorate(cmp);
        } else {
            Ext.log.error('Lockable plugin can only be used included for Ext.grid.Grid based classes.');
        }
    },

    statics: {
        decorate: function (target) {
            var plugin = this;
            //
            // Override grid component with specialized locked grid methods
            //
            Ext.override(target, {
                // differentiate between lockable plugin and Ext.grid.locked.Grid
                isLockedGrid: true,

                getRegions: function() {
                    return plugin.getRegions();
                },

                getRegionWidth: function (region) {
                    var grid = this,
                        scrollbarWidth = grid.getScrollable().scrollbarSize.width || 0,
                        regionColumns = grid.getVisibleColumns().filter(function (column) {
                            return column.getRegion() === region
                        }),
                        width = 0;

                    if (regionColumns) {
                        width = regionColumns.reduce(function (adder, col) {
                            return adder + col.getComputedWidth();
                        }, 0)
                    }

                    if (region === 'right') {
                        width && (width += scrollbarWidth);
                    }

                    return width;
                },

                getCenterRegionBox: function () {
                    var me = this,
                        gridBox = me.el.getBox(),
                        borders = me.el.getBorders(),
                        borderPadding = me.el.getBorderPadding(),
                        left = me.getRegionWidth('left') + (borderPadding.beforeX - borders.beforeX),
                        right = (gridBox.right - gridBox.left - borderPadding.afterX) - me.getRegionWidth('right'),
                        height = gridBox.height - (borderPadding.beforeY + borderPadding.afterY),
                        titleHeight = me.getTitleBar() ? me.getTitleBar().getSize().height : 0;

//console.log(borders);
//console.log(borderPadding)
                        right = right - (borderPadding.afterX - borders.afterX);

                    return {
                        x: left,
                        y: gridBox.y,
                        left: left,
                        right: right,
                        width: right - left,
                        height: height,

                        bodyTop: titleHeight + (borderPadding.beforeX - borders.beforeY),
                        bodyHeight: height - titleHeight,
                        bodyWidth: gridBox.width - (borderPadding.beforeX + borderPadding.afterX),
                    };
                },

                getRegionOffsets: function () {
                    var grid = this,
                        scroller = grid.getScrollable(),
                        position = scroller.getPosition(),
                        scrollerSize = scroller.getSize(),
                        clientSize = scroller.getClientSize(),
                        leftOffset = 0,
                        rightOffset = 0,
//                        clientSize,
                        overflow;

                    if (scrollerSize) {
                        overflow = clientSize.x - scrollerSize.x;
                        leftOffset = position.x;
                        rightOffset = leftOffset + overflow;
                    }

                    return {
                        left: leftOffset,
                        right: rightOffset
                    }
                },

                /**
                 * @ret {Boolean} true if grid currently has locked regions
                 */
                hasLockedRegions: function () {
                    var me = this,
                        hasLockedColumns = me.getVisibleColumns().find(function (column) {
                            return column.getLocked();
                        });

                    return hasLockedColumns;
                }
            })
        }
    },

    init: function (grid) {
        var scrollable = grid.getScrollable();
        var me = this;

        // Add locked regions to column menus
        grid.setColumnMenu(
            Ext.merge(grid.getColumnMenu(), me.getColumnMenu())
        );

        // Setup region dividers
        me.createDividers();

        scrollable.on({
            scope: me,
            scroll: 'onContainerScroll',
            scrollend: 'onContainerScroll'
        });

        grid.on({
            scope: me,

            refresh: 'refreshRegions',
            resize: 'refreshRegions',
            columnhide: 'refreshRegions',
            columnshow: 'refreshRegions',
            columnmove: 'refreshRegions',
            columnresize: 'refreshRegions',
            beforeshowcolumnmenu: 'onBeforeShowColumnMenu',
            columnlockedchange: 'onColumnLockedChange'
        })
    },

    privates: {
        createDividers: function() {
            var grid = this.getCmp();

            ['left', 'right'].forEach(region => {
                var divider = Ext.factory({
                    type: 'regiondivider',
                    grid: grid,
                    region: region
                }, 'Ext.grid.lockable.RegionDivider');
                divider.render(grid.el);
            });
        },

        onContainerScroll: function (scroller, x, y, dx, dy) {
            // Only refresh if horizontal scroll detected
//            if (dx !== 0) {
                this.refreshRegions(true);
//            }
        },

        refreshRegions: function (isScroll) {
            var me = this,
                grid = me.getCmp(),
                use3d = true,
                scroller = grid.getScrollable();

            var offsets = grid.getRegionOffsets();
//            console.log(scroller.getPosition())
            var lockedLeft = grid.el.query('.x-locked.x-locked-left');
            var lockedRight = grid.el.query('.x-locked.x-locked-right');
            var translateLeft = use3d ? `translate3d(${offsets.left}px, 0px, 0px)` : `translate(${offsets.left}px, 0px)`;
            var translateRight = use3d ? `translate3d(${offsets.right}px, 0px, 0px)` : `translate(${offsets.right}px, 0px)`;
            var centerBox = grid.getCenterRegionBox();

            lockedLeft.forEach(function (el) {
                el.style.transform = translateLeft;
            });

//            console.log('lockedRight is ', lockedRight)
//            console.log('translateRight is ', translateRight);
//            console.log('isScroll is ', isScroll);
//            console.log('scroller.isVirtualScroller is ', scroller.isVirtualScroller);

            lockedRight.forEach(function (el) {
                el.style.transform = translateRight;
            });

            if (scroller.isVirtualScroller && isScroll !== true) {
                // KEEP THIS ORDER UNTIL WE RECONFIGURE WITH BETTER LOCKED
                // GRID INFO TO PASS TO SCROLLERS
                scroller.setHasRightRegion(lockedRight.length > 0);
                scroller.setUserClientX(centerBox.left);
                scroller.setUserClientSize({
                    x: centerBox.width,
                    y: centerBox.height,
                });
            }
        },

        onBeforeShowColumnMenu: function (grid, column, menu) {
            var me = this,
                regionMenus = me.getRegions(),
                len = regionMenus.length,
                current = column.getRegion(),
                disabled = false,
                items, region, i, regionMenu;

            menu = menu.getComponent('region');
            if (menu) {
                // This column is always locked - hide locked column menu item

                if (column.getAlwaysLocked()) {
                    menu.setHidden(true);
                }

                menu = menu.getMenu();
                menu.removeAll();
                items = [];
                disabled = !!(grid.isDefaultPartner && grid.getVisibleColumns().length === 1);

                Ext.Object.each(regionMenus, function (region) {
                    items.push(Ext.applyIf({
                        disabled: disabled || region === current,
                        handler: me.handleChangedRegion.bind(me, region, column)
                    }, regionMenus[region].menuItem));
                })
                menu.add(items);
            }
        },

        handleChangedRegion: function (region, column) {
            column.setLocked(region);
        },

        onColumnLockedChange: function (grid, column, newValue, oldValue) {
            grid.refreshRegions();
        }
    }

}, function (plugin) {
    plugin.prototype.decorate = plugin.decorate;
});
