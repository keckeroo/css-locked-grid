/**
 * EXTJS-?????
 * Fix issue with insertAfter logic
 */
Ext.define('EXTJS_insert.Container', {
    override: 'Ext.Container',

    // Fixes issue with insert logic
    insertAfter: function (item, relativeToItem) {
        var items = this.getItems(),
            ret, index, relativeIndex, itemIindex;

        if (relativeToItem === null) {
            ret = this.add(item);
        } else {
            index = items.indexOf(relativeToItem);

            //<debug>
            if (index === -1) {
                Ext.raise('Item does not exist in container');
            }
            //</debug>

            itemIndex = items.indexOf(item);
            if (itemIndex !== -1 && itemIndex > index) {
                ++index;
            }
            ret = this.insert(index, item)
        }
        return ret;
    }
});
