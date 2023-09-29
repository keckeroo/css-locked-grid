Ext.define(null, {
    override: 'Ext.scroll.Scroller',

    privates: {
        getEnsureVisibleXY: function (el, options) {
            var position = this.getPosition(),
                viewport = this.component ? this.component.getScrollableClientRegion() : this.getElement(),
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

            if (options.adjustForCenterRegion) {
                mylog('adjust for center is ', options.adjustForCenterRegion)
                var scrollDirection = newPosition.x - position.x;
                var view = options.location.view;
                var centerRegionBox = view.getCenterRegionBox();
                var cellBox = Ext.get(el).getBox();
                var borderPadding = view.el.getBorderPadding();

//console.log('>>> border padding is ', borderPadding)
//console.group('boxes');
                console.log(cellBox);
                console.log(centerRegionBox);
                console.groupEnd()

                var gridLeft = view.el.getBox().left;
                cellBox.left -= gridLeft;
                cellBox.left -= borderPadding.beforeX;
                cellBox.right -= borderPadding.afterX;

//                cellBox.x -= borderPadding.beforeX;
                console.group('Ensure Visible');
                console.log('Scroll Direction is ', scrollDirection)
                console.log('current calculated scrollTo position = ', newPosition.x)
                console.log('cellbox left is ', cellBox.left)

                if (scrollDirection === 0) {
                    // Cell is within boundaries of grid - adjust for center
                    mylog('cell is within boundaries of grid - adjust for center');
                    if (cellBox.width > centerRegionBox.width) {
                        mylog ('cellbox width is larger than center width - align cell start to left side of center region');
                        newPosition.x = position.x + (cellBox.left - centerRegionBox.left);
                    } else if (cellBox.left < centerRegionBox.left) {
                        mylog('cell box left is left of center region left - bring cell into view')
//                        debugger;
//                        console.log(cellBox.left, centerRegionBox.left)
//debugger;
                        newPosition.x = newPosition.x + (cellBox.left - centerRegionBox.left);
                    } else if (cellBox.right > centerRegionBox.right) {
                        mylog(`cell box right (${cellBox.right}) is past center right (${centerRegionBox.right})  - bring cell into view`);
                        newPosition.x = newPosition.x + (cellBox.right - centerRegionBox.right) ;
                    }
                    else {
                        mylog('i am not moving anthing - no need to adjust for some reason')
                    }
                } else if (scrollDirection < 0) {
                    // cell.left < view.left, always align cell to left side of center region
                    mylog('cell is left of center left ... always align cell to left side of center region')
                    newPosition.x = newPosition.x - (centerRegionBox.left - viewport.left);
                } else { // scrollDirection > 0
                    mylog('cell is to right of center right edge .. .scroll into view')
                    // Target cell is wider than center region - align to left
                    // side of region to show start of cell
                    if (cellBox.width > centerRegionBox.width) {
                        mylog('cell is wider than center region - align left');
                        newPosition.x = position.x + (cellBox.left - centerRegionBox.left);
                    } else {
                        // Otherwise, align end of cell to right side of region
                        mylog('aligning right side of cell to right side of center region')
                        console.log('>> right values are ', centerRegionBox.right, viewport.right)
                        newPosition.x = newPosition.x + (centerRegionBox.right - viewport.right);
                    }
                }
                mylog('new position is ', newPosition.x);
                console.groupEnd()
            }

            newPosition.x = options.x === false ? position.x : newPosition.x;
            newPosition.y = options.y === false ? position.y : newPosition.y;
            return newPosition;
        },
    }
});