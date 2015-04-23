/*global define,dojo */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/*
| Copyright 2013 Esri
|
| Licensed under the Apache License, Version 2.0 (the "License");
| you may not use this file except in compliance with the License.
| You may obtain a copy of the License at
|
|    http://www.apache.org/licenses/LICENSE-2.0
|
| Unless required by applicable law or agreed to in writing, software
| distributed under the License is distributed on an "AS IS" BASIS,
| WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
| See the License for the specific language governing permissions and
| limitations under the License.
*/
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/dom-geometry",
    "dijit/_WidgetBase"
], function (declare, domGeom, WidgetBase) {

    //========================================================================================================================//

    return declare([WidgetBase], {
        _containerWidth: null,
        _containerHeight: null,
        _scrollBarContainer: null,
        _scrollBarContent: null,
        _scrollBarTrack: null,
        _scrollBarHandle: null,
        _yMax: null,
        _topPosition: null,
        _dragStart: null,
        _currentYCoordinate: null,
        _currentTop: 0,
        _scrollableContent: null,
        _touchStartPosition: null,
        _scrollingTimer: null,
        _isScrolling: false, //flag to detect is touchmove event scrolling div

        /**
        * create scrollbar widget
        *
        * @class
        * @name widgets/scrollbar/scrollbar
        */

        postCreate: function () {
            this.inherited(arguments);
            var coords = dojo.coords(this.domNode);
            this._containerHeight = coords.h;
            this._containerWidth = coords.w;

            this._scrollBarContainer = dojo.create("div", {}, this.domNode);
            this._scrollBarContent = dojo.create("div", { "class": "scrollbar_content" }, this._scrollBarContainer);
            this._scrollBarContent.style.height = this._containerHeight + "px";
        },

        /**
        * set content of scrollbar conatiner
        * @memberOf widgets/scrollbar/scrollbar
        */
        setContent: function (content) {
            this._scrollableContent = content;
            this._scrollBarContent.appendChild(content);
        },

        /**
        * remove content of scrollbar conatiner
        * @memberOf widgets/scrollbar/scrollbar
        */
        removeContent: function () {
            dojo.destroy(this._scrollableContent);
        },

        /**
        * reset scrollbar conatiner
        * @memberOf widgets/scrollbar/scrollbar
        */
        resetScrollBar: function (duration) {
            setTimeout(dojo.hitch(this, function () {
                this._registerScrollbar();
            }), duration);
        },

        /**
        * remove scrollbar
        * @memberOf widgets/scrollbar/scrollbar
        */
        removeScrollBar: function () {
            return true;
        },

        /**
        * create scrollbar
        * @memberOf widgets/scrollbar/scrollbar
        */
        createScrollBar: function (duration) {
            return true;
        },


        /**
        * register scrollbar
        * @memberOf widgets/scrollbar/scrollbar
        */
        _registerScrollbar: function () {
            return true;
        }
    });
});
