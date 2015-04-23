/*global require,dojo,dojoConfig,esri,esriConfig,alert */
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

require([
    "coreLibrary/widgetLoader",
    "application/js/config",
    "esri/config",
    "dojo/domReady!"
], function (WidgetLoader, config, esriConfig) {
    //========================================================================================================================//

    try {
        dojo.configData = config;
        if (dojo.configData.ProxyUrl && (!dojo.configData.ProxyUrl.match("http://") && (!dojo.configData.ProxyUrl.match("https://")))) {
            dojo.configData.ProxyUrl = dojoConfig.baseURL + dojo.configData.ProxyUrl;
        }
        esriConfig.defaults.io.proxyUrl = dojo.configData.ProxyUrl;
        esriConfig.defaults.io.timeout = 180000;
        /**
        * load application configuration settings from configuration file
        * create an object of widget loader class
        */
        var applicationWidgetLoader = new WidgetLoader();
        applicationWidgetLoader.startup();

    } catch (ex) {
        alert(ex.message);
    }
});
