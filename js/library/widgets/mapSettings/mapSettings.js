/*global define,dojo,dojoConfig,alert,esri */
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
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/_base/array",
    "esri/arcgis/utils",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/query",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dojo/i18n!application/js/library/nls/localizedStrings",
    "esri/map",
    "esri/layers/ImageParameters",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "widgets/baseMapGallery/baseMapGallery",
    "esri/geometry/Extent",
    "esri/dijit/HomeButton",
    "dojo/Deferred",
    "dojo/DeferredList",
    "dojo/topic",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "widgets/infoWindow/infoWindow",
    "dojo/string",
    "dojo/number",
    "esri/geometry/Point",
    "dojo/domReady!"
], function (declare, domConstruct, domStyle, lang, on, array, esriUtils, dom, domAttr, query, Query, QueryTask, domClass, _WidgetBase, sharedNls, esriMap, ImageParameters, FeatureLayer, GraphicsLayer, BaseMapGallery, GeometryExtent, HomeButton, Deferred, DeferredList, topic, ArcGISDynamicMapServiceLayer, InfoWindow, string, number, Point) {

    //========================================================================================================================//

    return declare([_WidgetBase], {

        map: null,
        tempGraphicsLayerId: "esriGraphicsLayerMapSettings",
        featureGraphicsLayerId: "esriFeatureGraphicsLayer",
        bufferGraphicLayerId: "esriBufferGraphicsLayer",
        sharedNls: sharedNls,
        isInfoPopupShown: false,

        /**
        * initialize map object
        *
        * @class
        * @name widgets/mapSettings/mapSettings
        */
        postCreate: function () {
            var mapDeferred;
            topic.publish("showProgressIndicator");

            /**
            * load map
            * @param {string} dojo.configData.BaseMapLayers Basemap settings specified in configuration file
            */

            mapDeferred = esriUtils.createMap(dojo.configData.WebMapId, "esriCTParentDivContainer", {
                mapOptions: {
                    slider: true,
                    showAttribution: dojo.configData.ShowMapAttribution
                },
                ignorePopups: true
            });
            mapDeferred.then(lang.hitch(this, function (response) {
                this.map = response.map;
                dojo.webMapExtent = new GeometryExtent(response.map.extent.xmin, response.map.extent.ymin, response.map.extent.xmax, response.map.extent.ymax, this.map.spatialReference);
                dojo.selectedBasemapIndex = null;
                if (response.itemInfo.itemData.baseMap.baseMapLayers) {
                    this._setBasemapLayerId(response.itemInfo.itemData.baseMap.baseMapLayers);
                }
                topic.publish("filterRedundantBasemap", response.itemInfo);
                this._generateLayerURL(response.itemInfo.itemData.operationalLayers);
                topic.subscribe("showInfoWindow", lang.hitch(this, function (mapPoint, featureArray, count, isInfoArrowClicked) {
                    this._createInfoWindowContent(mapPoint, featureArray, count, isInfoArrowClicked);
                }));
                topic.subscribe("setInfoWindowOnMap", lang.hitch(this, function (infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight) {
                    this._onSetInfoWindowPosition(infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight);
                }));
                this.infoWindowPanel = new InfoWindow({ infoWindowWidth: dojo.configData.InfoPopupWidth, infoWindowHeight: dojo.configData.InfoPopupHeight });
                this._fetchWebMapData(response);
                topic.publish("setMap", this.map);
                topic.publish("hideProgressIndicator");
                this._mapOnLoad();
                dojo.isInfoPopupShared = false;
                this._activateMapEvents(response);
            }), function (Error) {
                domStyle.set(dom.byId("esriCTParentDivContainer"), "display", "none");
                alert(Error.message);
            });
        },

        /**
        * update infowindow content when it's position is set on map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _onSetInfoWindowPosition: function (infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight) {
            this.infoWindowPanel.resize(infoPopupWidth, infoPopupHeight);
            this.infoWindowPanel.hide();
            this.infoWindowPanel.setTitle(infoTitle);
            domStyle.set(query(".esriCTinfoWindow")[0], "visibility", "visible");
            this.infoWindowPanel.show(divInfoDetailsTab, screenPoint);
            dojo.infoWindowIsShowing = true;
            this._onSetMapTipPosition(screenPoint);
        },

        /**
        * set infowindow anchor position on map
        * @memberOf widgets/locator/locator
        */
        _onSetMapTipPosition: function () {
            if (dojo.selectedMapPoint) {
                var screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                screenPoint.y = this.map.height - screenPoint.y;
                this.infoWindowPanel.setLocation(screenPoint);
            }
        },

        /**
        * fetch webmap operational layers and generate settings
        * @memberOf widgets/mapSettings/mapSettings
        */
        _fetchWebMapData: function (response) {
            var webMapDetails, infowindowCurrentSettings = [], j, idx, popupField;
            webMapDetails = response.itemInfo.itemData;
            this.operationalLayers = [];
            for (j = 0; j < webMapDetails.operationalLayers.length; j++) {
                this.operationalLayers[j] = webMapDetails.operationalLayers[j];
                if (this.operationalLayers[j].popupInfo) {
                    if (!infowindowCurrentSettings[j]) {
                        infowindowCurrentSettings[j] = {};
                    }
                    infowindowCurrentSettings[j].InfoQueryURL = this.operationalLayers[j].url;
                    if (this.operationalLayers[j].popupInfo.title.split("{").length > 1) {
                        infowindowCurrentSettings[j].InfoWindowHeaderField = dojo.string.trim(this.operationalLayers[j].popupInfo.title.split("{")[0]);
                        for (idx = 1; idx < this.operationalLayers[j].popupInfo.title.split("{").length; idx++) {
                            infowindowCurrentSettings[j].InfoWindowHeaderField += " ${" + dojo.string.trim(this.operationalLayers[j].popupInfo.title.split("{")[idx]);
                        }
                    } else {
                        if (dojo.string.trim(this.operationalLayers[j].popupInfo.title) !== "") {
                            infowindowCurrentSettings[j].InfoWindowHeaderField = dojo.string.trim(this.operationalLayers[j].popupInfo.title);
                        } else {
                            infowindowCurrentSettings[j].InfoWindowHeaderField = dojo.configData.ShowNullValueAs;
                        }
                    }
                    infowindowCurrentSettings[j].InfoWindowData = [];
                    for (popupField in this.operationalLayers[j].popupInfo.fieldInfos) {
                        if (this.operationalLayers[j].popupInfo.fieldInfos.hasOwnProperty(popupField)) {
                            if (this.operationalLayers[j].popupInfo.fieldInfos[popupField].visible) {
                                infowindowCurrentSettings[j].InfoWindowData.push({
                                    "DisplayText": this.operationalLayers[j].popupInfo.fieldInfos[popupField].label + ":",
                                    "FieldName": "${" + this.operationalLayers[j].popupInfo.fieldInfos[popupField].fieldName + "}"
                                });
                            }
                        }
                    }
                }
                this.operationalLayers[j].InfowindowSettings = infowindowCurrentSettings[j];
            }

        },

        /**
        * get search setting from config
        * @param{string} searchKey is layer id to find search setting in config
        * @memberOf widgets/mapSettings/mapSettings
        */
        _getConfigSearchSetting: function (searchKey, workFlowIndex) {
            var i, configSearchSettings = dojo.configData.Workflows[workFlowIndex].SearchSettings;
            for (i = 0; i < configSearchSettings.length; i++) {
                if (configSearchSettings[i].QueryLayerId === searchKey) {
                    return configSearchSettings[i];
                }
            }
            if (i === configSearchSettings.length) {
                return false;
            }

        },

        /**
        * activate events on map
        * @memberOf widgets/mapSettings/mapSettings
        */
        _activateMapEvents: function (webMapRresponse) {
            this.map.on("click", lang.hitch(this, function (evt) {
                dojo.mapClickedPoint = evt.mapPoint;
                if (evt.graphic) {
                    topic.publish("loadingIndicatorHandler");
                    this._showInfoWindowOnMap(evt.mapPoint, webMapRresponse);
                    dojo.mapPointForInfowindow = evt.mapPoint.x + "," + evt.mapPoint.y;
                }
            }));
            this.map.on("extent-change", lang.hitch(this, function (evt) {
                var mapPoint;
                if (window.location.toString().split("$mapPointForInfowindow=").length > 1 && !this.isInfoPopupShown) {
                    this.isInfoPopupShown = true;
                    dojo.isInfoPopupShared = true;
                    mapPoint = new Point(window.location.toString().split("$mapPointForInfowindow=")[1].split("$")[0].split(",")[0], window.location.toString().split("$mapPointForInfowindow=")[1].split("$")[0].split(",")[1], this.map.spatialReference);
                    this._showInfoWindowOnMap(mapPoint, webMapRresponse);
                    dojo.mapPointForInfowindow = mapPoint.x + "," + mapPoint.y;
                } else {
                    this._onSetMapTipPosition();
                }
            }));
        },

        /**
        * show infowindow on map
        * @param{object} mapPoint is location on map to show infowindow
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showInfoWindowOnMap: function (mapPoint, webMapRresponse) {
            var onMapFeaturArray, deferredListResult, featureArray, j, i, k;
            onMapFeaturArray = [];
            for (k = 0; k < webMapRresponse.itemInfo.itemData.operationalLayers.length; k++) {
                if (webMapRresponse.itemInfo.itemData.operationalLayers[k].layerObject.visibleAtMapScale && webMapRresponse.itemInfo.itemData.operationalLayers[k].popupInfo) {
                    this._executeQueryTask(k, mapPoint, webMapRresponse.itemInfo.itemData.operationalLayers[k].url, onMapFeaturArray, webMapRresponse);

                }
            }
            deferredListResult = new DeferredList(onMapFeaturArray);
            featureArray = [];
            deferredListResult.then(lang.hitch(this, function (result) {
                if (result) {
                    for (j = 0; j < result.length; j++) {
                        if (result[j][1]) {
                            if (result[j][1].features.length > 0) {
                                for (i = 0; i < result[j][1].features.length; i++) {
                                    featureArray.push({
                                        attr: result[j][1].features[i],
                                        layerIndex: result[j][1].layerIndex,
                                        fields: result[j][1].fields
                                    });
                                }
                            }
                        }
                    }

                    this._fetchQueryResults(featureArray, mapPoint);
                }
            }), function (err) {
                alert(err.message);
            });
        },

        /**
        * fetch infowindow data from query task result
        * @memberOf widgets/mapSettings/mapSettings
        */
        _fetchQueryResults: function (featureArray, mapPoint) {
            var point, _this, featurePoint;
            if (featureArray.length > 0) {
                if (featureArray.length === 1) {
                    domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    if (featureArray[0].attr.geometry.type === "polygon") {
                        featurePoint = mapPoint;
                    } else {
                        featurePoint = featureArray[0].attr.geometry;
                    }
                    topic.publish("showInfoWindow", featurePoint, featureArray, 0, false);
                } else {
                    this.count = 0;
                    domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", '/' + featureArray.length);
                    if (featureArray[this.count].attr.geometry.type === "polyline") {
                        point = featureArray[this.count].attr.geometry.getPoint(0, 0);
                        topic.publish("showInfoWindow", point, featureArray, this.count, false);
                    } else {
                        if (featureArray[0].attr.geometry.type === "polygon") {
                            point = mapPoint;
                        } else {
                            point = featureArray[0].attr.geometry;
                        }
                        topic.publish("showInfoWindow", point, featureArray, this.count, false);
                    }
                    topic.publish("hideLoadingIndicatorHandler");
                    _this = this;
                    query(".esriCTdivInfoRightArrow")[0].onclick = function () {
                        _this._nextInfoContent(featureArray, point);
                    };
                    query(".esriCTdivInfoLeftArrow")[0].onclick = function () {
                        _this._previousInfoContent(featureArray, point);
                    };
                }
            } else {
                topic.publish("hideLoadingIndicatorHandler");
            }
        },

        /**
        * execute query task to find infowindow data
        * @param{string} index is layer index in operational layer array
        * @memberOf widgets/mapSettings/mapSettings
        */
        _executeQueryTask: function (index, mapPoint, QueryURL, onMapFeaturArray, webMapRresponse) {
            var esriQuery, queryTask, queryOnRouteTask, currentTime, layerIndex = index;
            queryTask = new QueryTask(QueryURL);
            esriQuery = new Query();
            currentTime = new Date();
            esriQuery.where = currentTime.getTime() + index.toString() + "=" + currentTime.getTime() + index.toString();
            esriQuery.returnGeometry = true;
            esriQuery.geometry = this._extentFromPoint(mapPoint);
            esriQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            esriQuery.outSpatialReference = this.map.spatialReference;
            esriQuery.outFields = ["*"];
            queryOnRouteTask = queryTask.execute(esriQuery, lang.hitch(this, function (results) {
                var deferred = new Deferred();
                results.layerIndex = layerIndex;
                deferred.resolve(results);
                return deferred.promise;
            }), function (err) {
                alert(err.message);
            });
            onMapFeaturArray.push(queryOnRouteTask);
        },

        /**
        * get extent from mappoint
        * @memberOf widgets/mapSettings/mapSettings
        */
        _extentFromPoint: function (point) {
            var screenPoint, sourcePoint, destinationPoint, sourceMapPoint, destinationMapPoint, tolerance = 15;
            screenPoint = this.map.toScreen(point);
            sourcePoint = new esri.geometry.Point(screenPoint.x - tolerance, screenPoint.y + tolerance);
            destinationPoint = new esri.geometry.Point(screenPoint.x + tolerance, screenPoint.y - tolerance);
            sourceMapPoint = this.map.toMap(sourcePoint);
            destinationMapPoint = this.map.toMap(destinationPoint);
            return new GeometryExtent(sourceMapPoint.x, sourceMapPoint.y, destinationMapPoint.x, destinationMapPoint.y, this.map.spatialReference);
        },

        /**
        * set default id for basemaps
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapLayerId: function (baseMapLayers) {
            var i = 0, defaultId = "defaultBasemap";
            if (baseMapLayers.length === 1) {
                this._setBasemapId(baseMapLayers[0], defaultId);
            } else {
                for (i = 0; i < baseMapLayers.length; i++) {
                    this._setBasemapId(baseMapLayers[i], defaultId + i);
                }
            }

        },

        /**
        * set default id for each basemap of webmap
        * @memberOf widgets/mapSettings/mapSettings
        */
        _setBasemapId: function (basmap, defaultId) {
            var layerIndex;
            this.map.getLayer(basmap.id).id = defaultId;
            this.map._layers[defaultId] = this.map.getLayer(basmap.id);
            layerIndex = array.indexOf(this.map.layerIds, basmap.id);
            if (defaultId !== basmap.id) {
                delete this.map._layers[basmap.id];
            }
            this.map.layerIds[layerIndex] = defaultId;
        },
        /**
        * Get operational layers
        * @param{url} operational layers
        * @memberOf widgets/mapSettings/mapSettings
        */
        _generateLayerURL: function (operationalLayers) {
            var i, str;
            for (i = 0; i < operationalLayers.length; i++) {
                str = operationalLayers[i].url.split('/');
                this._createLayerURL(str, operationalLayers[i]);
            }
        },


        /**
        * Generate Id and title of operational layers
        * @param{string} string value of layer ul
        * @memberOf widgets/mapSettings/mapSettings
        */
        _createLayerURL: function (str, layerObject) {
            var layerTitle, layerId, index, searchSettings, i;
            for (i = 0; i < dojo.configData.Workflows.length; i++) {
                searchSettings = dojo.configData.Workflows[i].SearchSettings;
                layerTitle = layerObject.title;
                layerId = str[str.length - 1];
                if (searchSettings) {
                    for (index = 0; index < searchSettings.length; index++) {
                        if (searchSettings[index].Title && searchSettings[index].QueryLayerId) {
                            if (layerTitle === searchSettings[index].Title && layerId === searchSettings[index].QueryLayerId) {
                                searchSettings[index].QueryURL = str.join("/");
                            }
                        }
                    }
                } else if (dojo.configData.Workflows[i].FilterSettings.FilterLayer) {
                    if (dojo.configData.Workflows[i].FilterSettings.FilterLayer.Title && dojo.configData.Workflows[i].FilterSettings.FilterLayer.QueryLayerId) {
                        if (layerTitle === dojo.configData.Workflows[i].FilterSettings.FilterLayer.Title && layerId === dojo.configData.Workflows[i].FilterSettings.FilterLayer.QueryLayerId) {
                            dojo.configData.Workflows[i].FilterSettings.FilterLayer.LayerURL = str.join("/");
                        }
                    }

                }
            }

        },

        /**
        * Specify basemap feature
        * @param{object} create basemap instance
        * @param{string} web map info
        * @memberOf widgets/mapSettings/mapSettings
        */
        _appendBasemap: function (basemap, webmapInfo) {
            var appendLayer = true, thumbnailSrc;
            array.some(dojo.configData.BaseMapLayers, lang.hitch(this, function (layer) {
                if (layer.MapURL === basemap.url) {
                    appendLayer = false;
                    return true;
                }
            }));
            if (appendLayer) {
                thumbnailSrc = (webmapInfo.thumbnail === null) ? dojo.configData.NoThumbnail : dojo.configData.PortalAPIURL + "content/items/" + webmapInfo.id + "/info/" + webmapInfo.thumbnail;
                dojo.configData.BaseMapLayers.push({
                    ThumbnailSource: thumbnailSrc,
                    Name: webmapInfo.title,
                    MapURL: basemap.url
                });
            }
        },

        _mapOnLoad: function () {
            var home, mapDefaultExtent, graphicsLayer, imgCustomLogo, extent, featureGrapgicLayer, imgSource, bufferGraphicLayer;

            /**
            * set map extent to default extent
            * @param {string} Default extent of map
            */
            extent = this._getQueryString('extent');
            if (extent !== "") {
                mapDefaultExtent = extent.split(',');
                mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                this.map.setExtent(mapDefaultExtent);
            }
            /**
            * load esri 'Home Button' widget
            */
            home = this._addHomeButton();
            domConstruct.place(home.domNode, query(".esriSimpleSliderIncrementButton")[0], "after");
            home.startup();

            if (dojo.configData.CustomLogoUrl && lang.trim(dojo.configData.CustomLogoUrl).length !== 0) {

                if (dojo.configData.CustomLogoUrl.match("http:") || dojo.configData.CustomLogoUrl.match("https:")) {
                    imgSource = dojo.configData.CustomLogoUrl;
                } else {
                    imgSource = dojoConfig.baseURL + dojo.configData.CustomLogoUrl;
                }
                imgCustomLogo = domConstruct.create("img", { "src": imgSource, "class": "esriCTCustomMapLogo" }, dom.byId("esriCTParentDivContainer"));
                domClass.add(imgCustomLogo, "esriCTCustomMapLogoBottom");
            }

            this._showBasMapGallery();
            graphicsLayer = new GraphicsLayer();
            graphicsLayer.id = this.tempGraphicsLayerId;
            this.map.addLayer(graphicsLayer);
            featureGrapgicLayer = new GraphicsLayer();
            featureGrapgicLayer.id = this.featureGraphicsLayerId;
            this.map.addLayer(featureGrapgicLayer);
            bufferGraphicLayer = new GraphicsLayer();
            bufferGraphicLayer.id = this.bufferGraphicLayerId;
            this.map.addLayer(bufferGraphicLayer);
        },

        _getQueryString: function (key) {
            var extentValue = "", regex, qs;
            regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
            qs = regex.exec(window.location.href);
            if (qs && qs.length > 0) {
                extentValue = qs[1];
            }
            return extentValue;
        },


        /**
        * load esri 'Home Button' widget which sets map extent to default extent
        * @return {object} Home button widget
        * @memberOf widgets/mapSettings/mapSettings
        */
        _addHomeButton: function () {
            var home = new HomeButton({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return home;
        },

        /**
        * Crate an object of base map gallery
        * @return {object} base map object
        * @memberOf widgets/mapSettings/mapSettings
        */
        _showBasMapGallery: function () {
            var basMapGallery = new BaseMapGallery({
                map: this.map
            }, domConstruct.create("div", {}, null));
            return basMapGallery;
        },
        /* return current map instance
        * @return {object} Current map instance
        * @memberOf widgets/mapSettings/mapSettings
        */
        getMapInstance: function () {
            return this.map;
        },

        /**
        * display next page of infowindow on clicking of next arrow
        * @memberOf widgets/mapSettings/mapSettings
        */
        _nextInfoContent: function (featureArray, point) {
            if (!domClass.contains(query(".esriCTdivInfoRightArrow")[0], "disableArrow")) {
                if (this.count < featureArray.length) {
                    this.count++;
                }
                if (featureArray[this.count]) {
                    domClass.add(query(".esriCTdivInfoRightArrow")[0], "disableArrow");
                    topic.publish("showInfoWindow", point, featureArray, this.count, true);
                }
            }
        },

        /**
        * display previous page of infowindow on clicking of previous arrow
        * @memberOf widgets/mapSettings/mapSettings
        */
        _previousInfoContent: function (featureArray, point) {
            if (!domClass.contains(query(".esriCTdivInfoLeftArrow")[0], "disableArrow")) {
                if (this.count !== 0 && this.count < featureArray.length) {
                    this.count--;
                }
                if (featureArray[this.count]) {
                    domClass.add(query(".esriCTdivInfoLeftArrow")[0], "disableArrow");
                    topic.publish("showInfoWindow", point, featureArray, this.count, true);
                }
            }
        },

        /**
        * create infowindow coontent for selected address
        * @memberOf widgets/locator/locator
        */
        _createInfoWindowContent: function (mapPoint, featureArray, count, isInfoArrowClicked, isFeatureListClicked) {
            var infoPopupFieldsCollection, infoPopupHeight, infoPopupWidth, divInfoDetailsTab, key, screenPoint,
                divInfoRow, i, j, fieldNames, link, divLink, infoTitle, attributes, infoIndex, utcMilliseconds;
            if (featureArray[count].attr && featureArray[count].attr.attributes) {
                attributes = featureArray[count].attr.attributes;
            } else if (featureArray[count].attribute) {
                attributes = featureArray[count].attribute;
            } else {
                attributes = featureArray[count].attributes;
            }
            infoIndex = featureArray[count].layerIndex;
            if (featureArray.length > 1 && (!isFeatureListClicked)) {

                if (featureArray.length > 1 && count !== featureArray.length - 1) {
                    domClass.add(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count);
                } else {
                    domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                }
                if (count > 0 && count < featureArray.length) {
                    domClass.add(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                } else {
                    domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                    domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", count + 1);
                }
            } else {
                domClass.remove(query(".esriCTdivInfoRightArrow")[0], "esriCTShowInfoRightArrow");
                domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "esriCTShowInfoLeftArrow");
                domAttr.set(query(".esriCTdivInfoFeatureCount")[0], "innerHTML", "");
                domAttr.set(query(".esriCTdivInfoTotalFeatureCount")[0], "innerHTML", "");
            }
            topic.publish("hideLoadingIndicatorHandler");
            infoPopupFieldsCollection = this.operationalLayers[infoIndex].InfowindowSettings.InfoWindowData;
            infoPopupHeight = dojo.configData.InfoPopupHeight;
            infoPopupWidth = dojo.configData.InfoPopupWidth;
            divInfoDetailsTab = domConstruct.create("div", { "class": "esriCTInfoDetailsTab" }, null);
            this.divInfoDetailsContainer = domConstruct.create("div", { "class": "divInfoDetailsContainer" }, divInfoDetailsTab);
            for (j = 0; j < featureArray[count].fields.length; j++) {
                if (featureArray[count].fields[j].type === "esriFieldTypeDate") {
                    if (attributes[featureArray[count].fields[j].name]) {
                        if (Number(attributes[featureArray[count].fields[j].name])) {
                            utcMilliseconds = Number(attributes[featureArray[count].fields[j].name]);
                            attributes[featureArray[count].fields[j].name] = dojo.date.locale.format(this.utcTimestampFromMs(utcMilliseconds), {
                                datePattern: dojo.configData.DatePattern,
                                selector: "date"
                            });
                        }
                    }
                } else if (featureArray[count].fields[j].type !== "esriFieldTypeOID" && featureArray[count].fields[j].type !== "esriFieldTypeString") {
                    if (attributes[featureArray[count].fields[j].name] && Number(attributes[featureArray[count].fields[j].name])) {
                        attributes[featureArray[count].fields[j].name] = number.format(Number(attributes[featureArray[count].fields[j].name]), { places: 2 });
                    }
                }
            }

            for (key = 0; key < infoPopupFieldsCollection.length; key++) {
                divInfoRow = domConstruct.create("div", { "className": "esriCTDisplayRow" }, this.divInfoDetailsContainer);
                // Create the row's label
                this.divInfoDisplayField = domConstruct.create("div", { "className": "esriCTDisplayField", "innerHTML": infoPopupFieldsCollection[key].DisplayText }, divInfoRow);
                this.divInfoFieldValue = domConstruct.create("div", { "className": "esriCTValueField" }, divInfoRow);
                for (i in attributes) {
                    if (attributes.hasOwnProperty(i)) {
                        if (!attributes[i] && attributes[i] !== 0) {
                            attributes[i] = sharedNls.showNullValue;
                        }
                    }
                }


                try {
                    fieldNames = string.substitute(infoPopupFieldsCollection[key].FieldName, attributes);
                } catch (ex) {
                    fieldNames = sharedNls.showNullValue;
                }
                if (fieldNames.match("http:") || fieldNames.match("https:")) {
                    link = fieldNames;
                    divLink = domConstruct.create("div", { "class": "esriCTLink", innerHTML: sharedNls.titles.moreInfo }, this.divInfoFieldValue);
                    on(divLink, "click", lang.hitch(this, this._makeWindowOpenHandler(link)));
                } else {
                    this.divInfoFieldValue.innerHTML = fieldNames;
                }


            }
            for (j in attributes) {
                if (attributes.hasOwnProperty(j)) {
                    if (!attributes[j]) {
                        attributes[j] = sharedNls.showNullValue;
                    }
                }
            }
            try {
                infoTitle = string.substitute(this.operationalLayers[infoIndex].InfowindowSettings.InfoWindowHeaderField, attributes);
            } catch (e) {
                infoTitle = sharedNls.showNullValue;
            }
            dojo.selectedMapPoint = mapPoint;
            if (!isInfoArrowClicked) {
                domClass.remove(query(".esriCTdivInfoRightArrow")[0], "disableArrow");
                domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "disableArrow");
                this._centralizeInfowindowOnMap(infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight);
            } else {
                screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                screenPoint.y = this.map.height - screenPoint.y;
                domClass.remove(query(".esriCTdivInfoRightArrow")[0], "disableArrow");
                domClass.remove(query(".esriCTdivInfoLeftArrow")[0], "disableArrow");
                topic.publish("hideProgressIndicator");
                topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight);
            }
        },

        utcTimestampFromMs: function (utcMilliseconds) { // returns Date
            return this.localToUtc(new Date(utcMilliseconds));
        },

        localToUtc: function (localTimestamp) { // returns Date
            return new Date(localTimestamp.getTime());
        },

        /**
        * Centralizes the infowindow on map
        * @memberOf widgets/locator/locator
        */
        _centralizeInfowindowOnMap: function (infoTitle, divInfoDetailsTab, infoPopupWidth, infoPopupHeight) {
            var extentChanged, screenPoint, extent, mapDefaultExtent;
            if (!dojo.isInfoPopupShared) {
                extentChanged = this.map.setExtent(this._calculateCustomMapExtent(dojo.selectedMapPoint));
            } else {
                extent = this._getQueryString('extent');
                if (extent !== "") {
                    mapDefaultExtent = extent.split(',');
                    mapDefaultExtent = new GeometryExtent({ "xmin": parseFloat(mapDefaultExtent[0]), "ymin": parseFloat(mapDefaultExtent[1]), "xmax": parseFloat(mapDefaultExtent[2]), "ymax": parseFloat(mapDefaultExtent[3]), "spatialReference": { "wkid": this.map.spatialReference.wkid} });
                    extentChanged = this.map.setExtent(mapDefaultExtent);
                }
            }
            extentChanged.then(lang.hitch(this, function () {
                topic.publish("hideProgressIndicator");
                screenPoint = this.map.toScreen(dojo.selectedMapPoint);
                screenPoint.y = this.map.height - screenPoint.y;
                topic.publish("setInfoWindowOnMap", infoTitle, divInfoDetailsTab, screenPoint, infoPopupWidth, infoPopupHeight);
            }));

        },
        /**
        * calculate extent of map
        * @memberOf widgets/locator/locator
        */
        _calculateCustomMapExtent: function (mapPoint) {
            var width, height, ratioHeight, totalYPoint, infoWindowHeight, xmin, ymin, xmax, ymax;

            width = this.map.extent.getWidth();
            height = this.map.extent.getHeight();
            ratioHeight = height / this.map.height;
            totalYPoint = dojo.configData.InfoPopupHeight + 30 + 61;
            infoWindowHeight = height - (ratioHeight * totalYPoint);
            xmin = mapPoint.x - (width / 2);
            ymin = mapPoint.y - infoWindowHeight;
            xmax = xmin + width;
            ymax = ymin + height;
            return new esri.geometry.Extent(xmin, ymin, xmax, ymax, this.map.spatialReference);
        }
    });
});
