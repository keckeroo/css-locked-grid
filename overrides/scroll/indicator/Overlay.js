/**
 * Updates to overlay indicator to adjust scrollbar and indicator sizing
 * for changes to grid 'center' region.
 */
Ext.define('cssLockedGrid.scroll.indicator.Overlay', {
    override: 'Ext.scroll.indicator.Overlay',

    /**
     * Sets the value of this scroll indicator.
     * @param {Number} value The scroll position on the configured {@link #axis}
     */
    updateValue: function(value) {
        console.log('OVERLAY update value ...')
        var me = this,
            el = me.element,
            names = me.names,
            axis = me.getAxis(),
            scroller = me.getScroller(),
            maxScrollPosition = scroller.getMaxUserPosition()[axis],
            clientSize = scroller.getUserClientSize()[axis] || scroller.getClientSize()[axis],
            baseLength = me.length,
            length = baseLength,
            maxPosition = clientSize - baseLength - me.sizeAdjust,
            round = Math.round,
            position;

        if (value < 0) {
            length = round(baseLength + (baseLength * value / clientSize));
            position = 0;
        }
        else if (value > maxScrollPosition) {
            length = round(baseLength - (baseLength * (value - maxScrollPosition) / clientSize));
            position = maxPosition + baseLength - length;
        }
        else {
            position = round(value / maxScrollPosition * maxPosition);
        }

        //
//        console.log('client size is ', clientSize)
//        console.log('length is ', length)
        if (axis === 'x') {
            position = position + scroller.getUserClientX();
        }

        me[names.translate](position);
        el[names.setLength](length);
    },

    privates: {
        /**
         * Caches the values that are set via stylesheet rules (size and margin)
         * @private
         */

        refreshLength: function() {
            var me = this,
                names = me.names,
                axis = me.getAxis(),
                scroller = me.getScroller(),
                scrollSize = scroller.getSize()[axis],
                clientSize = scroller.getUserClientSize()[axis] || scroller.getClientSize()[axis],
                ratio = clientSize / scrollSize,
                baseSizeAdjust = me.margin * 2,
                sizeAdjust = me.hasOpposite() ? (baseSizeAdjust + me.size) : baseSizeAdjust,
                length = Math.round((clientSize - sizeAdjust) * ratio);

            me.sizeAdjust = sizeAdjust;

console.log('seeting indicator to ', length)
console.log('adjust is ', sizeAdjust)
            /**
             * @property {Number} length
             * @private
             * The indicator's "length" (height for vertical indicators, or width for
             * horizontal indicators)
             */
            me.length = length;
            me.element[names.setLength](length);
        }
    }
});