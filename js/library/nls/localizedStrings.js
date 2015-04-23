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
        showNullValue: "N/A",
        buttons: {
            okButtonText: "OK",
            link: "Link",
            email: "Email",  // Shown next to icon for sharing the current map extents via email; works with shareViaEmail tooltip
            facebook: "Facebook",  // Shown next to icon for sharing the current map extents via a Facebook post; works with shareViaFacebook tooltip
            twitter: "Twitter",  // Shown next to icon for sharing the current map extents via a Twitter tweet; works with shareViaTwitter tooltip
            embedding: "Embedded URL"
        },
        tooltips: {
            search: "Search",
            reports: "Site Selector",
            locate: "Locate",
            share: "Share",
            help: "Help",
            clearEntry: "Clear",
            previous: "Previous",
            next: "Next"
        },
        titles: {

            informationPanelTitle: "Information for current map view",
            searchBuildingText: "Search buildings near an address",
            hideText: "Hide more options",
            showText: "Show more options",
            sliderDisplayText: "Show results within ",
            communityText: "Search communities by city, county or region",
            searchCommunityText: "Search communities in",
            searchBusinessText: "Search business near an address",
            serachSiteText: "Search sites near an address",
            countStatus: "of",
            webpageDisplayText: "Copy/Paste HTML into your web page",
            textDownload: "Download",
            result: "Back To Result",
            sortBy: " Sort by",
            select: "Select",
            toText: "to",
            fromText: "from"
        },
        errorMessages: {
            invalidSearch: "No results found",
            downloadError: "Unable to complete operation",
            geometryIntersectError: "The searched area is outside the area of interest and will not be analyzed.",
            falseConfigParams: "Required configuration key values are either null or not exactly matching with layer attributes. This message may appear multiple times",
            invalidLocation: "Current location not found",
            invalidProjection: "Unable to plot current location on the map",
            widgetNotLoaded: "Unable to load widgets.",
            shareLoadingFailed: "Unable to load share options",
            shareFailed: "Unable to share",
            invalidBasemapQuery: "Invalid BasemapQuery",
            noBasemap: "No Basemap Found",
            disableTab: "Enable at least one tab",
            bufferSliderValue: "Buffer slider should not be set to zero distance",
            invalidInput: "Plese enter valid input",
            unableToSort: "Unable to sort",
            portalUrlNotFound: "Portal URL cannot be empty"
        }
    },
    es: true,
    fr: true,
    it: true
});
