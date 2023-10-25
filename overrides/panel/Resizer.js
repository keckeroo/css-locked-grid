/**
 * This override fixes issues with resizer not preventing continued resizing of the target
 * container (the one with the resizer configured) when the resizer is dragged beyond constraint
 * values. This also includes logic to incorporate minWidth of sibling when in split mode for 
 * resizer constraints
 */
Ext.define('cssLockedGrid.panel.Resizer', {
    override: 'Ext.panel.Resizer',

    privates: {
        /**
         * @property {Object} edgeInfoMap
         * Meta information about each edge.
         *
         * ADDED 'sibling' method for north/south/east/west edges so that
         * we may reference target slibling when in split mode. This is critical
         * so that divider constraints can respect sibling minWidth 
         * @private
         */
        edgeInfoMap: {
            north: {
                vert: true,
                constrainProp: {
                    vert: 'bottom'
                },
                adjustHeightOffset: -1,
                splitPosSetter: 'setY',
                oppSplitPosSetter: 'setX',
                sizeProp: 'height',
                startEdge: 'top',
                sibling: 'nextSibling',
                touchAction: { panY: false }
            },
            northeast: {
                horz: true,
                vert: true,
                corner: true,
                constrainProp: {
                    horz: 'left',
                    vert: 'bottom'
                },
                adjustHeightOffset: -1,
                adjustWidthOffset: 1,
                touchAction: { panX: false, panY: false }
            },
            east: {
                horz: true,
                constrainProp: {
                    horz: 'left'
                },
                adjustWidthOffset: 1,
                splitPosSetter: 'setX',
                oppSplitPosSetter: 'setY',
                sizeProp: 'width',
                startEdge: 'right',
                sibling: 'nextSibling',
                touchAction: { panX: false }
            },
            southeast: {
                horz: true,
                vert: true,
                corner: true,
                constrainProp: {
                    horz: 'left',
                    vert: 'top'
                },
                adjustHeightOffset: 1,
                adjustWidthOffset: 1,
                touchAction: { panX: false, panY: false }
            },
            south: {
                vert: true,
                constrainProp: {
                    vert: 'top'
                },
                adjustHeightOffset: 1,
                splitPosSetter: 'setY',
                oppSplitPosSetter: 'setX',
                sizeProp: 'height',
                startEdge: 'bottom',
                sibling: 'previousSibling',
                touchAction: { panY: false }
            },
            southwest: {
                horz: true,
                vert: true,
                corner: true,
                constrainProp: {
                    horz: 'right',
                    vert: 'top'
                },
                adjustHeightOffset: 1,
                adjustWidthOffset: -1,
                touchAction: { panX: false, panY: false }
            },
            west: {
                horz: true,
                constrainProp: {
                    horz: 'right'
                },
                adjustWidthOffset: -1,
                splitPosSetter: 'setX',
                oppSplitPosSetter: 'setY',
                sizeProp: 'width',
                startEdge: 'left',
                sibling: 'previousSibling',
                touchAction: { panX: false }
            },
            northwest: {
                horz: true,
                vert: true,
                corner: true,
                constrainProp: {
                    horz: 'right',
                    vert: 'bottom'
                },
                adjustHeightOffset: -1,
                adjustWidthOffset: -1,
                touchAction: { panX: false, panY: false }
            }
        },

        handleDragStart: function(e) {
            var me = this,
                emptyConstrain = me.emptyConstrain,
                target = me.getTarget(),
                hasListeners = target.hasListeners,
                dynamic = me.getDynamic(),
                edgeName = e.target.getAttribute('data-edge'),
                edge = me.edgeInfoMap[edgeName],
                horz = edge.horz,
                vert = edge.vert,
                region = target.element.getRegion(),
                split = me.getSplit(),
                snap = me.getSnap() || emptyConstrain,
                minSize = me.getMinSize() || emptyConstrain,
                maxSize = me.getMaxSize() || emptyConstrain,
                defaultMinSize = me.defaultMinSize,
                defaultMaxSize = me.defaultMaxSize,
                info, proxy, context, asFloat, layout, layoutVert, clearFlex, sibling;

            if (hasListeners.beforeresizedragstart) {
                context = {
                    edge: edgeName,
                    event: e
                };

                if (target.fireEvent('beforeresizedragstart', target, context) === false) {
                    return;
                }
            }

            // Fetch target sibling if we are in split mode
            if (split && edge.sibling) {
                sibling = target[edge.sibling]();
            }

            asFloat = target.getFloated() || target.isPositioned();

            if (target.getFlex()) {
                layout = me.getBoxLayout();

                if (layout) {
                    layoutVert = layout.getVertical();
                    clearFlex = (horz && !layoutVert) || (vert && layoutVert);
                }
            }

            me.info = info = {
                target: target,
                edgeName: edgeName,
                dynamic: dynamic,
                startBox: region,
                snapHeight: snap[1],
                snapWidth: snap[0],
                clearFlex: clearFlex,
                minHeight: me.calculateConstrain(target.getMinHeight(), minSize[1], defaultMinSize),
                minWidth: me.calculateConstrain(target.getMinWidth(), minSize[0], defaultMinSize),
                maxHeight: me.calculateConstrain(target.getMaxHeight(), maxSize[1], defaultMaxSize),
                maxWidth: me.calculateConstrain(target.getMaxWidth(), maxSize[0], defaultMaxSize),
                edge: edge,
                asFloat: asFloat,
                preserveRatio: asFloat ? me.getPreserveRatio() : false,
                ratio: asFloat ? region.width / region.height : 0,
                start: region[edge.startEdge],
                floated: target.getFloated(),
                sibling: sibling // pass along sibling info
            };

            if (!dynamic) {
                info.proxy = proxy = me.createProxy(edge, asFloat);

                if (asFloat) {
                    proxy.setBox(region);
                }
                else {
                    proxy[edge.splitPosSetter](info.start);
                    proxy[edge.oppSplitPosSetter](horz ? region.top : region.left);
                    proxy.setSize(
                        horz ? undefined : region.width, vert ? undefined : region.height
                    );
                }
            }

            me.setupDragConstraints(info);

            me.dragStarted = true;

            if (hasListeners.resizedragstart) {
                target.fireEvent('resizedragstart', target, context || {
                    edge: edgeName,
                    event: e
                });
            }

            e.stopPropagation();

            // Prevent any further drag events from completing
            return false;
        },

        resize: function(newBox, atEnd, e) {
            var me = this,
                info = me.info,
                target = info.target,
                box = info.startBox,
                asFloat = info.asFloat,
                edge = info.edge,
                x = newBox.x,
                y = newBox.y,
                posChanged = asFloat && (box.x !== x || box.y !== y),
                horz = edge.horz,
                vert = edge.vert,
                floated = info.floated,
                split = me.getSplit(),
                onTarget = info.dynamic || atEnd,
                resizeTarget, isProxy, prop, diff, offset,
                targetSibling = target.nextSibling() || target.previousSibling(),
                targetParent, parentXY, positionEnd;

            if (onTarget) {
                resizeTarget = me.getTarget();
            }
            else {
                resizeTarget = info.proxy;
                isProxy = true;
            }

            if (!asFloat && isProxy) {
                prop = edge.sizeProp;
                offset = horz ? edge.adjustWidthOffset : edge.adjustHeightOffset;
                diff = (newBox[prop] - box[prop]) * offset;
                resizeTarget[edge.splitPosSetter](info.start + diff);
            }
            else {
                // Prevent any adjustments in box sizing if we computed a new width which is
                // outside the contraints of the resizer based on sibling information.
                if (split && !atEnd) {
                    if (
                        newBox.width >= info.maxWidth ||
                        newBox.width <= info.minWidth ||
                        newBox.height >= info.maxHeight ||
                        newBox.height <= info.minHeight
                    ) {
                        // We are dragging out of bounds - just stop it.
                        return;
                    }
                }

                resizeTarget.setSize(
                    horz ? newBox.width : undefined, vert ? newBox.height : undefined
                );

                if (!isProxy && info.clearFlex) {
                    resizeTarget.setFlex(null);
                }

                if (posChanged) {
                    positionEnd = !floated && onTarget;

                    if (positionEnd) {
                        targetParent = target.element.dom.parentNode;
                        parentXY = Ext.fly(targetParent).getXY();
                    }

                    if (horz) {
                        if (positionEnd) {
                            resizeTarget.setLeft(x - parentXY[0]);
                        }
                        else {
                            resizeTarget.setX(x);
                        }
                    }

                    if (vert) {
                        if (positionEnd) {
                            resizeTarget.setTop(y - parentXY[1]);
                        }
                        else {
                            resizeTarget.setY(y);
                        }
                    }
                }
            }

            if (atEnd) {
                if (target.hasListeners.resizedragend) {
                    target.fireEvent('resizedragend', target, {
                        edge: info.edgeName,
                        event: e,
                        width: newBox.width,
                        height: newBox.height
                    });
                }
            }
        },

        /**
         * Updated to include sibling minWidth values in constraint values
         */
        setupDragConstraints: function(info) {
            var me = this,
                dom = me.getTarget().element.dom,
                parent = dom.parentNode,
                clone = dom.cloneNode(false),
                fly = Ext.fly(clone),
                maxSize = me.defaultMaxSize,
                box, parentBox, edge, prop, invertMap;

            clone.style.position = 'absolute';

            fly.setMinHeight(info.minHeight);
            fly.setMinWidth(info.minWidth);
            fly.setMaxHeight(info.maxHeight);
            fly.setMaxWidth(info.maxWidth);

            // Make the fly really small, measure the width
            fly.setHeight(1);
            fly.setWidth(1);

            parent.appendChild(clone);
            info.minHeight = fly.getHeight();
            info.minWidth = fly.getWidth();

            // Make the fly really big
            fly.setHeight(maxSize);
            fly.setWidth(maxSize);

            info.maxHeight = fly.getHeight();
            info.maxWidth = fly.getWidth();

            if (me.getConstrainToParent()) {
                box = info.startBox;
                parentBox = Ext.fly(parent).getRegion();
                edge = info.edge;
                invertMap = me.sideInvertMap;

                if (edge.horz) {
                    prop = edge.constrainProp.horz;
                    info.maxWidth = Math.min(
                        info.maxWidth, Math.abs(box[prop] - parentBox[invertMap[prop]])
                    );
                    // Respect sibling minWidth value - this is the magic
                    if (info.sibling) {
                        info.maxWidth -= info.sibling.getMinWidth();
                    }
                }

                if (edge.vert) {
                    prop = edge.constrainProp.vert;
                    info.maxHeight = Math.min(
                        info.maxHeight, Math.abs(box[prop] - parentBox[invertMap[prop]])
                    );
                    // Respect sibling minWidth value - and more magic
                    if (info.sibling) {
                        info.maxHeight -= info.sibling.getMin();
                    }
                }
            }

            parent.removeChild(clone);
        }
    }
});