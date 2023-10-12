Ext.define('cssLockedGrid.grid.CellEditor', {
    override: 'Ext.grid.CellEditor',

    // Adust zIndex down one level so that cell editor is below locked
    // region. Need to wrap in config object as this is the only way to 
    // change the default value of 10 
    // Not sure why an override has to put this in the config block whereas
    // in a subclass (extended) this is not the case.

    // Info: me.self.$config.values in constructor has zIndex: 10 ... coming
    // from prototype. Only way to override this seems to be wrapping this in
    // config in the override.
 
    config: {
        zIndex: 9,
    }
});