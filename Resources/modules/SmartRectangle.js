/*
 * Returns { x, y, width, height } - x / y as coordinates of top left corner -
 * based on various format of input -
 *     x | left | l | startX | start.x | start,
 *     centerX | center.x | center,
 *     endX | end.x | end,
 *     right | fromRight,
 *     width | w | side | size.width | size.w | size,
 *     context: { x, y, width, height } | (
 *         contextX,
 *         contextWidth,
 *     )
 *     // these are only used if `useGridInfo`
 *     columns | cells,
 *     cellWidth | cellSide | cellSize.width | cellSize.w | cellSize |
 *         columnWidth | stepX |
 *         cell.width | cell.w | cell.side | 
 *         cell.size.width | cell.size.w | cell.size |
 *         column.width | column.w | step.x | step
 * and analogues for vertical axis can be combined in almost any form.
 * Optimized for (x | left) & (width | w).
 * Default context is (x = 0, y = 0, width = 1, height = 1).
 */

function SmartRectangle(params, scaleX, scaleY, useGridInfo) {

    if (scaleX === undefined) scaleX = 1;
    if (scaleY === undefined) scaleY = 1;

    function getParam(/* arguments */) {
        var keys = Array.prototype.slice.apply(arguments);
        for (var i = 0; i < keys.length; i++) {
            key = keys[i];
            var res = params[key];
            if (!isNaN(res) && isFinite(res)) return res;
            if (key.indexOf(".") !== -1) try { 
                res = eval("params." + key);
                if (!isNaN(res) && isFinite(res)) return res;
            } catch(e) {};
        }
    }

    // try most popular first
    if ([
            this.x      = scaleX * getParam("x", "left"),
            this.y      = scaleY * getParam("y", "top"),
            this.width  = scaleX * getParam("width",  "w"),
            this.height = scaleY * getParam("height", "h")
        ].some(isNaN)
    ) {

        var context = {
            x: getParam("contextX", "context.x"),
            y: getParam("contextY", "context.y"),
            width:  getParam("contextWidth",  "context.width"),
            height: getParam("contextHeight", "context.height")
        };
        if (context.x === undefined) context.x = 0;
        if (context.y === undefined) context.y = 0;
        if (context.width  === undefined) context.width  = 1;
        if (context.height === undefined) context.height = 1;

        var h = [
            getParam("x", "left", "l", "startX", "start.x", "start"),
            getParam("centerX", "center.x", "center"),
            getParam("endX", "end.x", "end"),
            getParam("right", "fromRight"), 
            getParam("width", "w", "side", "size.width", "size.w", "size"),
            useGridInfo ? getParam("columns", "cells") : undefined,
            useGridInfo ? getParam(
                "cellWidth", "cellSide", "cellSize.width", "cellSize.w", "cellSize",
                "columnWidth", "stepX",
                "cell.width", "cell.w", "cell.side",
                "cell.size.width", "cell.size.w", "cell.size",
                "column.width", "column.w", "step.x", "step"
            ) : undefined,
            context.x,
            context.x + context.width
        ];

        var v = [
            getParam("y", "top", "t", "startY", "start.y", "start"),
            getParam("centerY", "center.y", "center"),
            getParam("endY", "end.y", "end"),
            getParam("bottom", "fromBottom"), 
            getParam("height", "h", "side", "size.height", "size.h", "size"),
            useGridInfo ? getParam("rows", "cells") : undefined,
            useGridInfo ? getParam(
                "cellHeight", "cellSide", "cellSize.height", "cellSize.h", "cellSize",
                "rowHeight", "stepY",
                "cell.height", "cell.h", "cell.side",
                "cell.size.height", "cell.size.h", "cell.size",
                "row.height", "row.h", "step.y", "step"
            ) : undefined,
            context.y,
            context.y + context.height
        ];

        this.width  = (h[4] = getSize.apply(null, h)) * scaleX;
        this.height = (v[4] = getSize.apply(null, v)) * scaleY;
        this.x = getStart.apply(null, h) * scaleX;
        this.y = getStart.apply(null, v) * scaleY;

    }

}



function getSize(start, middle, end, fromEnd, size, cells, cellSize, ctxMin, ctxMax) {

    if (size !== undefined) {
        return size;
    } else 
    if (cells !== undefined && cellSize !== undefined) {
        return cells * cellSize;
    } else 
    if (start !== undefined) {
        if (middle !== undefined) {
            return 2 * (middle - start);
        } else
        if (end !== undefined) {
            return end - start;
        } else
        if (fromEnd !== undefined) {
            return ctxMax - fromEnd - start;
        } else {
            return ctxMax - ctxMin - start;
        }
    } else
    if (middle !== undefined) {
        if (end !== undefined) {
            return 2 * (end - middle);
        } else 
        if (fromEnd !== undefined) {
            return (ctxMax - fromEnd - middle) * 2;
        } else {
            return 2 * Math.min(ctxMin + middle, ctxMax - middle);
        }
    } else
    if (end !== undefined) {
        return end - ctxMin;
    } else
    if (fromEnd !== undefined) {
        return ctxMax - ctxMin - fromEnd;
    } else {
        return ctxMax - ctxMin;
    }

}



function getStart(start, middle, end, fromEnd, size, cells, cellSize, ctxMin, ctxMax) {

    if (start !== undefined) {
        return start;
    } else
    if (middle !== undefined) {
        return middle - size / 2;
    } else
    if (end !== undefined) {
        return end - size;
    } else
    if (fromEnd !== undefined) {
        return ctxMax - fromEnd - size;
    } else {
        return ctxMin;
    }

}



module.exports = SmartRectangle;