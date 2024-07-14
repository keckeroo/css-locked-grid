Ext.define(null, {
    override: 'Ext.scroll.Scroller',

    privates: {

        callPartners: function(method, scrollX, scrollY, deltaX, deltaY) {
            var me = this,
                partners = me._partners,
                axes, id, partner, pos, scroller, x, y;

            if (!me.suspendSync) {
                for (id in partners) {
                    partner = partners[id];
                    scroller = partner.scroller;

                    if (!scroller.isPrimary && !partner.called) {
                        partner.called = true; // this flag avoids infinite recursion
                        axes = partners[id].axes;
                        pos = scroller.position;

                        x = (!axes.x || scrollX === undefined) ? pos.x : scrollX;
                        y = (!axes.y || scrollY === undefined) ? pos.y : scrollY;

                        if (!axes.x) {
                            console.log('DEBUGGER DEBUGGER ... we are not scrolling in X!!!!!!');
                            console.log(x, pox.x);
                        }
//                        scroller[method](x, y, (x - pos.x) || 0, (y - pos.y) || 0); // ORIGINAL
                        scroller[method](x, y, deltaX || 0, deltaY || 0);

                        scroller.callPartners(method, x, y); // , deltaX, deltaY);

                        partner.called = false;
                    }
                }
            }
        },

        getEnsureVisibleXY: function (el, options) {
            var position = this.getPosition(),
                viewport = this.component ? this.component.getScrollableClientRegion() : this.getElement(),
                location = options.location,
                isCssLockedGrid = location && location.view && location.view.isCssLockedGrid,
                isCenterRegion  = isCssLockedGrid && location.column.getRegion() === 'center',
                newPosition, align;

            if (el && el.element && !el.isElement) {
                options = el;
                el = options.element;
            }

            options = options || {};
            align = options.align;

            if (align) {
                if (Ext.isString(align)) {
                    align = {
                        x: options.x === false ? null : align,
                        y: options.y === false ? null : align
                    };
                } else if (Ext.isObject(align)) {
                    if (align.x && options.x === false) {
                        align.x = null;
                    }
                    if (align.y && options.y === false) {
                        align.y = null;
                    }
                }
            }

            newPosition = Ext.fly(el).getScrollIntoViewXY(viewport, position.x, position.y, align);

            // If location column is in center region, adjust position translations accordingly to ensure
            // target cell is not hidden by any locked region.
            if (isCenterRegion) { // location && options.adjustForCenterRegion) {
                var scrollDirection = newPosition.x - position.x;
                var view = location.view;
                var centerRegionBox = view.getCenterRegionBox();
                var cellBox = Ext.get(el).getBox();
                var offsets = Ext.get(el).getOffsetsTo(view.el);
                var borderPadding = view.el.getBorderPadding();

                // Adjust for local coordinates
                cellBox.left = offsets[0];
                cellBox.top  = offsets[1];
                cellBox.right = cellBox.left + cellBox.width;
                cellBox.bottom = cellBox.top + cellBox.height;

                if (scrollDirection === 0) {
                    // Cell is within boundaries of grid - adjust for center
//                    console.log('cell is within boundaries of grid - adjust for center');
                    if (cellBox.width > centerRegionBox.width) {
//                        console.log ('cellbox width is larger than center width - align cell start to left side of center region');
                        newPosition.x = position.x + (cellBox.left - centerRegionBox.left);
                    } else if (cellBox.left < centerRegionBox.left) {
//                        console.log('cell box left is left of center region left - bring cell into view')
                        newPosition.x = newPosition.x + (cellBox.left - centerRegionBox.left);
                    } else if (cellBox.right > centerRegionBox.right) {
//                        console.log(`cell box right (${cellBox.right}) is past center right (${centerRegionBox.right})  - bring cell into view`);
                        newPosition.x = newPosition.x + (cellBox.right - centerRegionBox.right) ;
                    }
                    else {
//                        console.log('i am not moving anthing - no need to adjust for some reason')
                    }
                } else if (scrollDirection < 0) {
                    // cell.left < view.left, always align cell to left side of center region
//                    console.log(scrollDirection, ': cell is left of center left ... always align cell to left side of center region')
                    newPosition.x = newPosition.x - centerRegionBox.left;
                } else { // scrollDirection > 0
//                    console.log('cell is to right of center right edge .. .scroll into view')
                    // Target cell is wider than center region - align to left
                    // side of region to show start of cell
                    if (cellBox.width > centerRegionBox.width) {
//                        console.log('cell is wider than center region - align left');
                        newPosition.x = position.x + (cellBox.left - centerRegionBox.left);
                    } else {
                        // Otherwise, align end of cell to right side of region
//                        console.log('aligning right side of cell to right side of center region')
//                        console.log('>> right values are ', centerRegionBox.right, viewport.right)
                        newPosition.x = newPosition.x + (viewport.right - centerRegionBox.right)
                    }
                }
//                console.log('new position is ', newPosition.x);
//                console.groupEnd()
            }

            newPosition.x = options.x === false ? position.x : newPosition.x;
            newPosition.y = options.y === false ? position.y : newPosition.y;
            return newPosition;
        }
    }
});