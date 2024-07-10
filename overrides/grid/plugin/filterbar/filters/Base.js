/**
 * Introduce TAB navigation to FilterBar
 * JIRA: TBD
 */
Ext.define(null, {
    override: 'Ext.grid.plugin.filterbar.filters.Base',

    config: {
        fieldListeners: {
            change: 'onValueChange',
            operatorchange: 'onOperatorChange',
            initialize: 'onFieldRender',
            specialkey: 'onFieldSpecialKey',
            focus: 'onFieldFocus'
        }
    },

   /**
     * Handles "specialkey" event of filter editor and clears it when user hits ESC.
     *
     * @param {*} field 
     * @param {Ext.event.Event} e 
     * @private
     */
    onFieldSpecialKey: function(field, e) {
        var keyCode = e.getKey(),
            grid = this.grid,
            scrollable = grid.getScrollable(),
            targetField;

        if ((keyCode === e.ESC) && !Ext.isEmpty(field.getValue())) {
            if (field.clearValue) {
                field.clearValue();
            }
            else {
                field.setValue(null);
            }
        }

        // Navigate to next/previous Filter field
        if (keyCode === e.TAB) {
            // Prevent native tabbing to next/previous focusable item. We manually do this
            // using scroller's ensureVisible method for overall consistent navigation 
            // behavior within a grid.
            e.preventDefault();

            // Determine target field (if any) based on tab direction.
            targetField = e.shiftKey ? field.previousSibling("[isInputField]") : field.nextSibling("[isInputField]");
            
            // If found, focus field - the focus handler will ensure field is scrolled into view.
            if (targetField) {
                targetField.focus();
            }
        }
    },

    /**
     * @param {*} field 
     * @param {Ext.event.Event} e 
     * @private
     */
    onFieldFocus: function(field, e) {
        var grid = this.grid,
            scrollable = grid.getScrollable(),
            nav = grid.getNavigationModel(),
            location = grid.createLocation(nav);

        location.column = this.column;
        
        scrollable.ensureVisible(field.el, {
            location: location
        });
    }
});
