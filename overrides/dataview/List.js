Ext.define(null, {
    override: 'Ext.dataview.List',

    privates: {
        onContainerScroll: function(scroller, x, y, dx, dy) {
            var me = this;

            me.callParent([ scroller, x, y, dx, dy ]);
            me.refreshItemHeaders(); //++
        },

        onBodyResize: function(el, info) {
            var me = this,
                height = info.height,
                width = info.width;
     
            if (width === me.getVisibleWidth()) {
                me.setVisibleHeight(height);
            }
            else {
                // Since updateVisibleWidth will be called, we don't want to waste
                // time doing a horz sync... we'll handle it all in the vertical
                me.suspendSync = true;
                me.setVisibleHeight(me.outerCt.measure('h'));
                me.suspendSync = false;
     
                me.setVisibleWidth(width);
                me.refreshScrollerSize();
                me.refreshItemHeaders(); //++
            }
        },

        /*
         * Align item headers when dataview is scrolled horizontally
        */
        refreshItemHeaders: function() {
            var me = this,
                width, headers,
                scroller = me.getScrollable(),
                left = scroller.getPosition().x;

            if (!me.isGrouping()) {
                return;
            }

            width = scroller.getClientSize().x;
            headers = me.query('itemheader');

//            console.log(width, ' vs ', me.getVisibleWidth(), scroller.position.x);

            if (headers.length) {
//                    item.setContentWidth(me.getScrollable().getClientSize().x); // SHOW ENTIRE HEADER ON SCREEN - NO OVERFLOW
                //++ Align each item header
                headers.forEach(header => header.alignHeader(left, width)); //++
            }
        },

        updateInnerWidth: function(innerWidth) {
            this.callParent([ innerWidth ]);
            this.refreshItemHeaders(); //++
        },

        syncPinnedHorz: function(item) {
            var me = this,
                scroller = item.getScrollable();
            item.el.setWidth(me.getScrollable().getClientSize().x);
//            console.log('SETING WIDTH TO ', me.getScrollable().getClientSize().x);

            // I'm not sure about this one. Should the header (all headers, not just
            // pinned) not be the fixed width of the grid and not move ?
            if (item.isItemHeader && me.getHorizontalOverflow()) {
                // NEW NEW NEW
                item.setContentWidth(me.getScrollable().getClientSize().x); // SHOW ENTIRE HEADER ON SCREEN - NO OVERFLOW
//                item.setContentWidth(me.getInnerWidth()); // SHOW ENTIRE HEADER ON SCREEN - NO OVERFLOW
            }
            
            if (me.getHorizontalOverflow() && me.getScrollable().isPrimary !== false) {
                scroller.scrollTo(me.getVisibleLeft(), null);
            }
        },

        syncRows: function(bottomUp) {
            var me = this,
                renderInfo = me.renderInfo,
                scrollDock = me.scrollDockedItems,
                partners = me.getRenderPartners(),
                i, position, indexTop, len, innerCt, maxHeight, contentHeight, height, partnerLen, j, p;
            if (!me.infinite) {
                me.syncItemRange();
                return;
            }
            if (!me.isActivePartner()) {
                return;
            }
            maxHeight = me.getMaxHeight();
            len = me.dataItems.length;
            indexTop = renderInfo.indexTop;
            partnerLen = partners.length;
            if (len) {
                if (bottomUp) {
                    position = renderInfo.bottom;
                } else {
                    position = renderInfo.top;
                    if (!indexTop && scrollDock) {
                        position = scrollDock.start.height;
                    }
                }
                for (i = 0; i < partnerLen; ++i) {
                    for (j = 0; j < len; ++j) {
                        partners[i].changeItem(j, indexTop + j);
                    }
                }
            }
            me.measureItems();
            me.positionItems(position, bottomUp, len);
            for (i = 0; i < partnerLen; ++i) {
                p = partners[i];
                if (p.pinnedHeader) {
                    p.syncPinnedHeader();
                }
                if (p.pinnedFooter) {
                    p.syncPinnedFooter();
                }
                if (p.stickyItems.length) {
                    p.syncStickyItems();
                }
                if (maxHeight) {
                    innerCt = p.innerCt;
                    contentHeight = renderInfo.bottom + p.gapAfter;
                    scrollDock = p.scrollDockedItems;
                    if (scrollDock) {
                        contentHeight += scrollDock.end.height;
                    }
                    height = innerCt.measure('h');
                    
                    height = p.el.measure('h') - height + p.el.getBorderWidth('tb');
                    
                    height = Math.min(maxHeight - height, contentHeight);
                    p.setInnerCtHeight(height);
                }
            }
        },

        syncRowsToHeight: function(force) {
//            console.log('>>> >>> syncRowsToHeight ', force);
            var me = this,
                
                bufferZone = me.getBufferSize(),
                infinite = me.infinite,
                rowCountWas = me.getItemCount(),
                rowHeight = me.rowHeight || 24,
                
                firstTime = !me.heightSyncs++,
                renderInfo = me.renderInfo,
                oldIndexBottom = renderInfo && renderInfo.indexBottom,
                storeCount = me.store && me.store.getCount(),
                                
                visibleHeight = me.getMaxHeight() || me.getVisibleHeight(),
                
                partners, indexTop, rowCount, i, len, p, active;
            if (!me.isActivePartner() || (!rowCount && !me.store)) {
                return;
            }
                     
            if (infinite) {    
                rowCount = Math.ceil(visibleHeight / rowHeight) + bufferZone;
                rowCount = Math.min(rowCount, storeCount);
            } else {
                rowCount = storeCount;
            }
            partners = me.getRenderPartners();
            len = partners.length;
            for (i = 0; i < len; ++i) {
                p = partners[i];
                active = p.isActivePartner();
                p.setItemCount(rowCount);
                
                if ((firstTime && me.store.isVirtualStore) || rowCountWas !== rowCount || storeCount < oldIndexBottom) {
                    if (infinite && active) {
                        indexTop = Math.min(storeCount - rowCount, renderInfo.indexTop);
                        indexTop = Math.max(0, indexTop);
                        if (indexTop === p.getTopRenderedIndex()) {
                            
                            p.updateTopRenderedIndex(indexTop);
                        } else {
                            p.setTopRenderedIndex(indexTop);
                        }
                    }
                    if (!rowCountWas) {
                        p.refreshGrouping();
                    }
                    force = force !== false;
                    if (force && storeCount < oldIndexBottom && active) {
                        
                        
                        renderInfo.top = renderInfo.indexTop * rowHeight;
                    }
                }
            }
            if (force || firstTime) {
                me.syncRows();
                console.log('firing view ready ' , force, firstTime);
                me.fireEvent('viewready', me);
            }
        },

        xsyncStickyItems: function() {
//            console.log('>>> >>> syncStickyItems');
            var me = this,
                stickyItems = me.stickyItems,
                n = stickyItems.length,
                i, stickyItem, stickyPos;
            for (i = 0; i < n; ++i) {
                stickyPos = me.constrainStickyItem(stickyItem = stickyItems[i]);
                if (stickyPos !== null) {
                    me.setItemPosition(stickyItem, stickyPos);
                }
            }
        },
        xdoSyncVerticalOverflow: function() {
            var scroller = this.getScrollable();
            this.setVerticalOverflow(scroller.getSize().y > scroller.getClientSize().y);
        },
     


        xsyncPinnedHeader: function(visibleTop) {
            console.log('sync Pinned Header ', visibleTop);
            var me = this,
                dataItems = me.dataItems,
                len = dataItems.length,
                pinnedHeader = me.pinnedHeader,
                renderInfo = me.renderInfo,                
                grouping = me.pinHeaders && pinnedHeader && len && me.isGrouping(),
                hide = pinnedHeader,
                indexTop = renderInfo.indexTop,
                scrollDock = me.scrollDockedItems,
                headerIndices, headers, height, index, visibleTopIndex, y, headerIndex, gap, item;

                visibleTop = visibleTop || me.getVisibleTop() || 0;
            
            if (grouping) {
                hide = (scrollDock && visibleTop <= scrollDock.start.height) || (visibleTopIndex = me.bisectPosition(visibleTop)) < 0 || visibleTopIndex >= len;
                if (!hide) {
                    visibleTopIndex += indexTop;
                    headers = me.groupingInfo.header;
                    headerIndices = headers.indices;
                    index = Ext.Number.binarySearch(headerIndices, visibleTopIndex);
                    
                    if (headerIndices[index] !== visibleTopIndex) {
                        --index;
                    }
                    headerIndex = headerIndices[index];
                    pinnedHeader.setGroup(headers.map[headerIndex]);

                    if (headerIndex >= indexTop) {
                        item = dataItems[headerIndex - indexTop];
                        gap = me.gapMap[headerIndex] || 0;
                        if (gap) {
                            hide = visibleTop - item.$y0 < gap;
                        } else 
                        {
                            hide = item.$y0 === visibleTop;
                        }
                    }

                    if (!hide) {
                        ++index;
                        if (index < headerIndices.length) {
                            index = headerIndices[index] - indexTop;                            
                            y = (index < len) ? dataItems[index].$y0 - visibleTop : 0;
                        } else {
                            y = renderInfo.bottom - visibleTop;
                            hide = y <= 0;
                        }
                        if (!hide) {
                            height = me.measureItem(pinnedHeader);
                            y = (y && y < height) ? y - height : 0;
                            me.setItemPosition(pinnedHeader, y || 0);
                        }
                    }
                }
            }
            if (hide) {
                me.setItemHidden(pinnedHeader, true);
            } else if (pinnedHeader) {
                me.syncPinnedHorz(pinnedHeader);
            }
        },



    }
});