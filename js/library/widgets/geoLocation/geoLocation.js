/*global define,dojo,dojoConfig,Modernizr,alert */
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
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/on",
    "dojo/topic",
    "dijit/_WidgetBase",
    "esri/tasks/GeometryService",
    "esri/geometry/Point",
    "esri/symbols/PictureMarkerSymbol",
    "esri/SpatialReference",
    "esri/graphic",
    "dojo/i18n!application/js/library/nls/localizedStrings"
], function (declare, lang, domConstruct, on, topic, _WidgetBase, GeometryService, Point, PictureMarkerSymbol, SpatialReference, Graphic, sharedNls) {

    //========================================================================================================================//

    return declare([_WidgetBase], {
        sharedNls: sharedNls,

        /**
        * create geolocation widget
        *
        * @class
        * @name widgets/geoLocation/geoLocation
        */
        postCreate: function () {

            /**
            * Modernizr.geolocation checks for support for geolocation on client browser
            * if browser is not supported, geolocation widget is not created
            */
            if (Modernizr.geolocation) {
                this.domNode = domConstruct.create("div", { "title": sharedNls.tooltips.locate, "class": "esriCTTdGeolocation" }, null);
                this.own(on(this.domNode, "click", lang.hitch(this, function () {
                    /**
                    * minimize other open header panel widgets and call geolocation service
                    */
                    topic.publish("setMaxLegendLength");
                    this._showCurrentLocation();
                })));
            }
        },

        /**
        * get device location from geolocation service
        * @param {string} dojo.configData.GeometryService Geometry service url specified in configuration file
        * @memberOf widgets/geoLocation/geoLocation
        */

        _showCurrentLocation: function () {
            var mapPoint, self = this, currentBaseMap, geometryServiceUrl, geometryService;
            geometryServiceUrl = dojo.configData.GeometryService;
            geometryService = new GeometryService(geometryServiceUrl);

            /**
            * get device location using geolocation service
            * @param {object} position Co-ordinates of device location in spatialReference of wkid:4326
            */
            navigator.geolocation.getCurrentPosition(function (position) {
                mapPoint = new Point(position.coords.longitude, position.coords.latitude, new SpatialReference({
                    wkid: 4326
                }));
                topic.publish("showProgressIndicator");

                /**
                * projects the device location on the map
                * @param {string} dojo.configData.ZoomLevel Zoom level specified in configuration file
                * @param {object} mapPoint Map point of device location in spatialReference of wkid:4326
                * @param {object} newPoint Map point of device location in spatialReference of map
                */
                geometryService.project([mapPoint], self.map.spatialReference).then(function (newPoint) {
                    currentBaseMap = self.map.getLayer("defaultBasemap");
                    if (!currentBaseMap) {
                        currentBaseMap = self.map.getLayer("defaultBasemap0");
                    }

                    if (currentBaseMap && currentBaseMap.visible) {
                        if (!currentBaseMap.fullExtent.contains(newPoint[0])) {
                            alert(sharedNls.errorMessages.invalidLocation);
                            return;
                        }
                    }
                    mapPoint = newPoint[0];
                    topic.publish("geoLocation-Complete", mapPoint);
                    self.map.centerAndZoom(mapPoint, dojo.configData.ZoomLevel);
                    self._addGraphic(mapPoint);
                }, function () {
                    alert(sharedNls.errorMessages.invalidProjection);
                    topic.publish("hideProgressIndicator");
                });
            }, function () {
                alert(sharedNls.errorMessages.invalidLocation);
                topic.publish("hideProgressIndicator");
            });
        },

        /**
        * add push pin on the map
        * @param {object} mapPoint Map point of device location in spatialReference of map
        * @memberOf widgets/geoLocation/geoLocation
        */
        _addGraphic: function (mapPoint) {
            var locatorMarkupSymbol, geoLocationPushpin, graphic;
            geoLocationPushpin = dojoConfig.baseURL + dojo.configData.LocatorSettings.DefaultLocatorSymbol;
            locatorMarkupSymbol = new PictureMarkerSymbol(geoLocationPushpin, "35", "35");
            graphic = new Graphic(mapPoint, locatorMarkupSymbol, null, null);
            this.map.getLayer("esriGraphicsLayerMapSettings").clear();
            this.map.getLayer("esriGraphicsLayerMapSettings").add(graphic);
        }

    });
});
