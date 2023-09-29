/**
 * Updates to bar indicator to adjust scrollbar and indicator sizing
 * for changes to grid 'center' region.
 */
Ext.define('cssLockedGrid.scroll.indicator.Bar', {
    override: 'Ext.scroll.indicator.Bar',

    privates: {
        // For reference
        xonRefresh: function() {
            var me = this,
                scroller = me.getScroller(),
                scrollEl = scroller.getElement(),
                axis = me.getAxis(),
                names = me.names[axis],
                axisValue = scroller[names.getAxis](),
                scrollSize = scroller.getSize()[axis],
                clientSize = scrollEl[axis === 'x' ? 'getWidth' : 'getHeight'](),
                scrollMax = scroller.getMaxPosition()[axis],
                oppositeScrollbarSize = scroller.getScrollbarSize()[names.oppositeSize],
                maxScrollSize = me.maxScrollSize;
 
            if (clientSize && scrollSize) {
                me.setEnabled(scroller.isAxisEnabled(me.getAxis()));
                me.toggleCls(me.scrollCls, axisValue === 'scroll');
                me.scale = Math.max(scrollMax /
                    (maxScrollSize - clientSize + oppositeScrollbarSize), 1);
 
                me.spacerElement.setStyle(names.spacerMargin, (
                    Math.min(scrollSize, maxScrollSize) - 1
                ) + 'px');
            }
        },

        onRefresh: function() {
            var me = this,
                scroller = me.getScroller(),
                scrollEl = scroller.getElement(),
                axis = me.getAxis(),
                names = me.names[axis],
                axisValue = scroller[names.getAxis](),
                scrollSize = scroller.getSize()[axis], // - scroller.getUserClientX(),
 //               scrollElSize = scrollEl[axis === 'x' ? 'getWidth': 'getHeight'](),
//                clientSize = scroller.getUserClientSize()[axis] || scrollEl[axis === 'x' ? 'getWidth' : 'getHeight'](),
                scrollElSize = scrollEl[axis === 'x' ? 'getWidth' : 'getHeight'](),
                scrollMax = scroller.getMaxPosition()[axis],
                oppositeScrollbarSize = scroller.getScrollbarSize()[names.oppositeSize],
                maxScrollSize = me.maxScrollSize;

            if (scrollElSize && scrollSize) {
                me.setEnabled(scroller.isAxisEnabled(me.getAxis()));
                me.toggleCls(me.scrollCls, axisValue === 'scroll');


                me.scale = Math.max(scrollMax /
                    (maxScrollSize - scrollElSize + oppositeScrollbarSize), 1);

//                console.group('Axis is ', axis);
//                console.log(scrollElSize, oppositeScrollbarSize)
//                console.log('scale is ', me.scale)
//                console.log('maxScrolsize = ', me.maxScrollSize)
//                console.groupEnd();

                me.spacerElement.setStyle(names.spacerMargin, (
                    Math.min(scrollSize, maxScrollSize) - 1
                ) + 'px');
console.log(axis, scrollSize, maxScrollSize);
//                console.log(me.spacerElement);

                if (axis === 'x') {
                    var clientSize, barWidth, adjust;

//                    console.log('doing X axis stuff')

                    if (scroller.getUserClientSize()) {
                        clientSize = scroller.getUserClientSize()['x'];
                        adjust = scrollElSize - clientSize;
                        console.log('scrollsize is ', scrollSize);
                        console.log('scrollElsize is ', scrollElSize);
                        console.log('adjust is ', adjust);
                        console.log('clientSize is ', clientSize);
                        scrollSize = scrollSize - adjust; // (219 + 210);
                        console.log('adjusted scrollSize is ', scrollSize)
                        me.spacerElement.setStyle(names.spacerMargin, (
                            Math.min(scrollSize, maxScrollSize) - 1
                        ) + 'px');
                        
//                        console.log(scroller.getUserClientSize());
//                        console.log(scroller.getUserClientX());
                        barWidth = clientSize; // this has to be the center region width and adjust bar to this size


//                        barWidth = scroller.getUserClientSize()[axis];
                        if (!scroller.getHasRightRegion()) {
                            barWidth -= oppositeScrollbarSize
                       }

                        me.el.setStyle('width', barWidth + 'px');
//                    me.el.setStyle('left', '0px'); // NEED TO ADJUST BORDER WIDTH as it is not computed in scroller position
                        me.el.setStyle('left', scroller.getUserClientX() + 'px')
                    }

                }
            }
        },

        updateAxis: function(axis, oldAxis) {
            var me = this,
                el = me.el,
                innerEl = me.getScroller().getInnerElement(),
                names = me.names[axis],
                extraPadding = Ext.isIE ? 1 : 0,
                scrollbarSize = (Ext.scrollbar.size()[names.size] + extraPadding) + 'px';
            // Added extra 1 px in scrollbarSize as in case of IE browser, it will
            // not respond to scrollbutton click if size <= native scroll bar size

            this.callSuper([axis, oldAxis]);

            el.setStyle(names.size, scrollbarSize);
            el.setStyle(names.margin, scrollbarSize);

            innerEl.setStyle(names.minSize, 'calc(100% - ' + scrollbarSize + ')');
        },
    }
});