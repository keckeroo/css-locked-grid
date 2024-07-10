Ext.define(null, {
    override: 'Ext.dataview.ItemHeader',

    privates: {

        alignHeader: function(x, width) {
//            var addUnits = Ext.Element.addUnits;
            var left = this.isPinnedItem ? 0 : x;
//            var width = addUnits(w);

            this.setContentWidth(width);
            this.el.setWidth(width).setLeft(left);
 //           this.el.setLeft(left); // Style({ left: left, width: width });
        },

        updateContentWidth: function(width) {
            console.log('>> UPDATING CONTENT WIDTH TO ', width);
            console.log(Ext.isNumber(width));
//            if (Ext.isNumber(width)) {
//                debugger;
//            }
            this.callParent(arguments);
        }
    }
});
