/**
 * Updated drop logic for grids so that a column that can be dragged,
 * but not locked, is not droppable on a locked region.
 */
Ext.define('cssLockedGrid.grid.HeaderDropZone', {
    override: 'Ext.grid.HeaderDropZone',

    isValidDrag: function (targetCmp, sourceCmp) {
        var info = this.info,
            // NEW
            regionChange = targetCmp.getLocked() !== sourceCmp.getLocked(),
            cursor, prevSibling, nextSibling, box, diff;

        if (!!targetCmp.up(sourceCmp)) {
            return false;
        }
        cursor = info.cursor.current;
        prevSibling = sourceCmp.previousSibling();
        nextSibling = sourceCmp.nextSibling();

        // Only a valid drop for siblings if dragged more than
        // half way through a sibling
        // CHANGE START
        if (sourceCmp.getAlwaysLocked() && regionChange) {
            return false;
        }
        if (targetCmp === prevSibling && !regionChange) {
            box = prevSibling.element.getBox();
            diff = (cursor.x - box.left) / box.width;
            if (diff > 0.5) {
                return false;
            }
            // CHANGE END
        } else if (targetCmp === nextSibling && !regionChange) {
            box = nextSibling.element.getBox();
            diff = (cursor.x - box.left) / box.width;
            if (diff <= 0.5) {
                return false;
            }
        }
        return true;
    },

    onDrop: function (info) {
        var me = this,
            dropMethod = 'insertBefore',
            ddManager, targetCmp, headerCt, sourceCmp, dropAt, position, relativeToItem, fromCtRoot, fromIdx, sourceCmpParent;
        if (!me.ddEl) {
            return;
        }
        ddManager = Ext.dd.Manager;
        targetCmp = ddManager.getTargetComp(info);
        headerCt = targetCmp.getParent() || targetCmp.getRootHeaderCt();
        sourceCmp = ddManager.getSourceComp(info);
        fromCtRoot = sourceCmp.getRootHeaderCt();
        fromIdx = fromCtRoot.indexOf(sourceCmp);
        dropAt = headerCt.indexOf(targetCmp);
        position = ddManager.getPosition(info, targetCmp, 'x');
        sourceCmpParent = sourceCmp.getParent();
        me.removeDropMarker();
        if (dropAt === -1) {
            return;
        }

        // NEW - Update lock info
        if (me.view.isLockedGrid) {
            sourceCmp.setLocked(targetCmp.getLocked())
        }

        if (position === 'after') {
            relativeToItem = headerCt.getAt(dropAt + 1);
            if (!relativeToItem) {
                dropMethod = 'insertAfter';
                relativeToItem = targetCmp;
            }
        } else {
            relativeToItem = headerCt.getAt(dropAt);
        }

        headerCt[dropMethod](sourceCmp, (relativeToItem || null));
        me.trackHeaderMove(sourceCmpParent, fromCtRoot);
        fromCtRoot.fireEvent('move', fromCtRoot, sourceCmp, dropAt, fromIdx);
    }
});