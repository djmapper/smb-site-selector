/*global define */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,indent:4 */
/** @license
| Version 10.2
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
define({
    root: {
        showNullValue: "@es@ N/A",
        buttons: {
            okButtonText: "@es@ OK",
            link: "@es@ Link",
            email: "correo electrónico",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
            facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
            twitter: "Twitter",  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
            embedding: "@es@ Embedded URL"
        },
        tooltips: {
            search: "Buscar",
            reports: "@es@ Site Selector",
            locate: "Ubicación actual",
            share: "Compartir",
            help: "Ayuda",
            clearEntry: "@es@ Clear",
            previous: "@es@ Previous",
            next: "@es@ Next"
        },
        titles: {
            informationPanelTitle: "@es@ Information for current map view",
            searchBuildingText: "@es@ Search buildings near an address",
            hideText: "@es@ Hide more options",
            showText: "@es@ Show more options",
            sliderDisplayText: "@es@ Show results within ",
            communityText: "@es@ Search communities by city, county or region",
            searchCommunityText: "@es@ Search communities in",
            searchBusinessText: "@es@ Search business near an address",
            serachSiteText: "@es@ Search sites near an address",
            countStatus: "de",
            webpageDisplayText: "@es@ Copy/Paste HTML into your web page",
            textDownload: "@es@ Download",
            result: "@es@ Back To Result",
            sortBy: "@es@  Sort by",
            select: "@es@ Select",
            toText: "@es@ to",
            fromText: "@es@ from"
        },
        errorMessages: {
            invalidSearch: "@es@ No results found",
            downloadError: "@es@ Unable to complete operation",
            geometryIntersectError: "@es@ The searched area is outside the area of interest and will not be analyzed.",
            falseConfigParams: "@es@ Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times",
            invalidLocation: "@es@ Current location not found",
            invalidProjection: "@es@ Unable to plot current location on the map",
            widgetNotLoaded: "@es@ Unable to load widgets.",
            shareLoadingFailed: "@es@ Unable to load share options",
            shareFailed: "@es@ Unable to share",
            invalidBasemapQuery: "@es@ Invalid BasemapQuery",
            noBasemap: "@es@ No Basemap Found",
            disableTab: "@es@ Enable at least one tab",
            bufferSliderValue: "@es@ Buffer slider should not be set to zero distance",
            invalidInput: "@es@ Plese enter valid input",
            unableToSort: "@es@ Unable to sort",
            portalUrlNotFound: "@es@ Portal URL cannot be empty"
        }
    }
});
