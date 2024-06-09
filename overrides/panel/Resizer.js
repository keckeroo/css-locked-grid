/**
 * This override fixes issues with resizer not preventing continued resizing of the target
 * container (the one with the resizer configured) when the resizer is dragged beyond constraint
 * values. This also includes logic to incorporate minWidth of sibling when in split mode for
 * resizer constraints
 *
 * Issues resolved (as resizer):
 * - Resizing centered floating component should increment size by 2 pixels for each pixel
 *   resized as centering should increase both the side being resized and its opposite side.
 * - Resizing must check computedStyle as dialogs have CSS driven min-width as a default.
 *
 * Issues resolved (as split)
 * - Respect min/max width of split target sibling
 */
Ext.define('EXTJS_UNFILED_JIRA_001.panel.Resizer', {
    override: 'Ext.panel.Resizer',

    privates: {
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
                snap = me.getSnap() || emptyConstrain,
                minSize = me.getMinSize() || emptyConstrain,
                maxSize = me.getMaxSize() || emptyConstrain,
                defaultMinSize = me.defaultMinSize,
                defaultMaxSize = me.defaultMaxSize,
                isCentered = target.isCentered(),
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

            // If we are in split mode and drag edge is not a corner, check for
            // split sibling. If none or it is hidden, just return from drag as
            // there is nothing to resize.
            if (me.getSplit() && !edge.corner) {
                sibling = (edge.adjustHeightOffset < 0 || edge.adjustWidthOffset < 0) ? target.previousSibling() : target.nextSibling();
                if (!sibling || sibling.isHidden()) {
                    e.stopPropagation();
                    // Prevent any further drag events from completing
                    return false;
                }
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
                target        : target,
                edgeName      : edgeName,
                dynamic       : dynamic,
                startBox      : region,
                snapHeight    : snap[1],
                snapWidth     : snap[0],
                clearFlex     : clearFlex,
                // Note well - positioned here does not use target.isPositioned as that
                // returns false for any floated component.
                positioned    : (target.getTop() !== null || target.getLeft() !== null || target.getBottom() !== null || target.getRight() !== null),
                // Note well - check for CSS min-width style which is applied in some components even if a value
                // is not specified on the component directly.
                minHeight     : me.calculateConstrain(target.getMinHeight() || target.el.getStyle('min-height'), minSize[1], defaultMinSize),
                minWidth      : me.calculateConstrain(target.getMinWidth() || target.el.getStyle('min-width'), minSize[0], defaultMinSize),
                maxHeight     : me.calculateConstrain(target.getMaxHeight(), maxSize[1], defaultMaxSize),
                maxWidth      : me.calculateConstrain(target.getMaxWidth(), maxSize[0], defaultMaxSize),
                isCentered    : isCentered,
                edge          : edge,
                asFloat       : asFloat,
                preserveRatio : asFloat ? me.getPreserveRatio() : false,
                ratio         : asFloat ? region.width / region.height : 0,
                start         : region[edge.startEdge],
                floated       : target.getFloated(),
                sibling       : sibling, // pass along sibling info
                modifiesX     : asFloat && edge.adjustWidthOffset < 0 && !isCentered,  // if centered, we do not modify X (setting size alone will position target correctly)
                modifiesY     : asFloat && edge.adjustHeightOffset < 0 && !isCentered, // if centered, we do not modify Y (setting size alone will position target correctly)
                adjustWidthOffset: edge.adjustWidthOffset * (isCentered ? 2 : 1),      // if centered multiply adjust offset by 2 as we are resizing in both vertical and horizontal directions at same time
                adjustHeightOffset: edge.adjustHeightOffset * (isCentered ? 2 : 1),    // if centered multiply adjust offset by 2 as we are resizing in both vertical and horizontal directions at same time
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

        handleDrag: function(e) {
            var info, target, edge, asFloat, box, horz, vert, offsetWidth, offsetHeight,
                adjustWidthOffset, adjustHeightOffset, modifiesX, modifiesY, minHeight,
                minWidth, maxHeight, maxWidth, snappedWidth, snappedHeight, w, h, ratio,
                dragRatio, oppX, oppY, newBox;

            if (!this.dragStarted) {
                return;
            }

            info = this.info;
            target = info.target;
            edge = info.edge;
            asFloat = info.asFloat;
            box = info.startBox;
            horz = edge.horz;
            vert = edge.vert;
            offsetWidth = 0;
            offsetHeight = 0;
            adjustWidthOffset = info.adjustWidthOffset;
            adjustHeightOffset = info.adjustHeightOffset;
            modifiesX = info.modifiesX;
            modifiesY = info.modifiesY;
            minHeight = info.minHeight;
            minWidth  = info.minWidth;
            maxHeight = info.maxHeight;
            maxWidth  = info.maxWidth;

            if (adjustWidthOffset) {
                // Keep - testing for visual artifact when mouse is moved rapidly beyond
                // min/max values
                // offsetWidth = Ext.Number.constrain(Math.round(adjustWidthOffset * e.deltaX), minWidth - box.width, maxWidth - box.width);
                offsetWidth = Math.round(adjustWidthOffset * e.deltaX);
            }

            if (adjustHeightOffset) {
                offsetHeight = Math.round(adjustHeightOffset * e.deltaY);
            }

            newBox = {
                width: box.width + offsetWidth,
                height: box.height + offsetHeight,
                x: box.x + (modifiesX ? -offsetWidth : 0),
                y: box.y + (modifiesY ? -offsetHeight : 0)
            };

            w = newBox.width;
            h = newBox.height;

            snappedWidth = horz ? this.snap(w, info.snapWidth, offsetWidth > 0) : w;
            snappedHeight = vert ? this.snap(h, info.snapHeight, offsetHeight > 0) : h;

            if (w !== snappedWidth || h !== snappedHeight) {
                if (modifiesX) {
                    newBox.x -= snappedWidth - w;
                }

                if (modifiesY) {
                    newBox.y -= snappedHeight - h;
                }

                newBox.width = w = snappedWidth;
                newBox.height = h = snappedHeight;
            }

            if (horz && (w < minWidth || w > maxWidth)) {
                newBox.width = w = Ext.Number.constrain(w, minWidth, maxWidth);

                if (modifiesX) {
                    newBox.x = box.x + (box.width - w);
                }
            }

            if (vert && (h < minHeight || h > maxHeight)) {
                newBox.height = h = Ext.Number.constrain(h, minHeight, maxHeight);

                if (modifiesY) {
                    newBox.y = box.y + (box.height - h);
                }
            }

            if (asFloat && (info.preserveRatio || e.shiftKey)) {
                ratio = info.ratio;
                h = Math.min(Math.max(minHeight, w / ratio), maxHeight);
                // Use newBox.height because we just overwrote h
                w = Math.min(Math.max(minWidth, newBox.height * ratio), maxWidth);

                if (horz && vert) {
                    // corner
                    oppX = box.x + (modifiesX ? box.width : 0);
                    oppY = box.y + (modifiesY ? box.height : 0);

                    dragRatio = Math.abs(oppX - e.pageX) / Math.abs(oppY - e.pageY);

                    if (dragRatio > ratio) {
                        newBox.height = h;
                    }
                    else {
                        newBox.width = w;
                    }

                    if (modifiesX) {
                        newBox.x = box.x - (newBox.width - box.width);
                    }

                    if (modifiesY) {
                        newBox.y = box.y - (newBox.height - box.height);
                    }
                }
                else if (horz) {
                    // width only, adjust height to match
                    newBox.height = h;
                }
                else {
                    // height only, adjust width to match
                    newBox.width = w;
                }
            }

            if (target.hasListeners.resizedrag) {
                target.fireEvent('resizedrag', target, {
                    edge: info.edgeName,
                    event: e,
                    width: newBox.width,
                    height: newBox.height
                });
            }

            this.resize(newBox, e.type === 'dragend', e);
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
                onTarget = info.dynamic || atEnd,
                positioned = info.positioned,
                resizeTarget, isProxy, prop, diff, offset,
                targetParent, parentXY, positionEnd;

            // If dynamic or at drag end - we are going to resize the target
            if (onTarget) {
                resizeTarget = me.getTarget();
            }
            else {
                // otherwise we are resizing the proxy
                resizeTarget = info.proxy;
//                positioned = false;
                isProxy = true;
            }

            if (!asFloat && isProxy) {
                prop = edge.sizeProp;
                offset = horz ? edge.adjustWidthOffset : edge.adjustHeightOffset;
                diff = (newBox[prop] - box[prop]) * offset;
                resizeTarget[edge.splitPosSetter](info.start + diff);
            }
            else {
                // Resize the target with new height / width dimensions.
                resizeTarget.setSize(
                    horz ? newBox.width : undefined, vert ? newBox.height : undefined
                );

                if (!isProxy && info.clearFlex) {
                    resizeTarget.setFlex(null);
                }

                // New change - ensure we only do this if the component is NOT
                // positioned (ie - it does not have top/right/bottom/left positioning
                // values set.
//                console.log(posChanged, positioned, floated, onTarget);
                if (posChanged && !positioned) {
                    // Note: continue to monitor this config value as currently cannot
                    // determine if/when this is ever triggered as posChange signifies 
                    // that x/y has been modified but not sure how this happens when 
                    // target is not floated.
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
                sibling = info.sibling;
                invertMap = me.sideInvertMap;

                if (edge.horz) {
                    prop = edge.constrainProp.horz;
                    info.maxWidth = Math.min(
                        info.maxWidth, Math.abs(box[prop] - parentBox[invertMap[prop]])
                    );
                    // Respect sibling min/maxWidth value - this is the magic
                    if (sibling) {
                        if (sibling.getMinWidth()) {
                            info.maxWidth = Math.min( parentBox.width - info.sibling.getMinWidth(), info.maxWidth );
                        }
                        if (sibling.getMaxWidth()) {
                            info.minWidth = Math.max( parentBox.width - info.sibling.getMaxWidth(), info.minWidth );
                        }
                    }
                }

                if (edge.vert) {
                    prop = edge.constrainProp.vert;
                    info.maxHeight = Math.min(
                        info.maxHeight, Math.abs(box[prop] - parentBox[invertMap[prop]])
                    );
                    // Respect sibling min/maxHeight value - and more magic
                    if (sibling) {
                        if (sibling.getMinHeight()) {
                            info.maxHeight = Math.min( parentBox.height - info.sibling.getMinHeight(), info.maxHeight );
                        }
                        if (sibling.getMaxHeight()) {
                            info.minHeight = Math.max( parentBox.height - info.sibling.getMaxHeight(), info.minHeight ) + 10;
                        }
                    }
                }
            }

            parent.removeChild(clone);
        }
    }
});
