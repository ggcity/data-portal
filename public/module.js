import "leaflet";
import "leaflet.markercluster";
import {Collapse as $gHGoZ$Collapse, Modal as $gHGoZ$Modal} from "bootstrap";
import {load as $gHGoZ$load} from "js-yaml";
import {Layer as $gHGoZ$Layer} from "leaflet/src/layer/Layer";
import {ImageOverlay as $gHGoZ$ImageOverlay} from "leaflet/src/layer/ImageOverlay";
import {TileLayerWMS as $gHGoZ$TileLayerWMS, tileLayerWMS as $gHGoZ$tileLayerWMS} from "leaflet/src/layer/tile/TileLayer.WMS";
import {EPSG4326 as $gHGoZ$EPSG4326} from "leaflet/src/geo/crs/CRS.EPSG4326";
import {LatLngBounds as $gHGoZ$LatLngBounds} from "leaflet/src/geo/LatLngBounds";
import {setOptions as $gHGoZ$setOptions, getParamString as $gHGoZ$getParamString, extend as $gHGoZ$extend} from "leaflet/src/core/Util";





/*!
 * leaflet.wms.js
 * A collection of Leaflet utilities for working with Web Mapping services.
 * (c) 2014-2016, Houston Engineering, Inc.
 * MIT License
 */ 





var $a41f3dbaa06477cc$export$f29dd90282299ad2 = {};
/*
 * wms.Source
 * The Source object manages a single WMS connection.  Multiple "layers" can be
 * created with the getLayer function, but a single request will be sent for
 * each image update.  Can be used in non-tiled "overlay" mode (default), or
 * tiled mode, via an internal wms.Overlay or wms.TileLayer, respectively.
 */ $a41f3dbaa06477cc$export$f29dd90282299ad2.Source = (0, $gHGoZ$Layer).extend({
    'options': {
        'untiled': true,
        'identify': true
    },
    'initialize': function(url, options) {
        $gHGoZ$setOptions(this, options);
        if (this.options.tiled) this.options.untiled = false;
        this._url = url;
        this._subLayers = {};
        this._overlay = this.createOverlay(this.options.untiled);
    },
    'createOverlay': function(untiled) {
        // Create overlay with all options other than untiled & identify
        var overlayOptions = {};
        for(var opt in this.options)if (opt != 'untiled' && opt != 'identify') overlayOptions[opt] = this.options[opt];
        if (untiled) return $a41f3dbaa06477cc$export$f29dd90282299ad2.overlay(this._url, overlayOptions);
        else return $a41f3dbaa06477cc$export$f29dd90282299ad2.tileLayer(this._url, overlayOptions);
    },
    'onAdd': function() {
        this.refreshOverlay();
    },
    'onRemove': function() {
        if (this._map) this._overlay.removeFrom(this._map);
    },
    'getEvents': function() {
        if (this.options.identify) return {
            'click': this.identify
        };
        else return {};
    },
    'setOpacity': function(opacity) {
        this.options.opacity = opacity;
        if (this._overlay) this._overlay.setOpacity(opacity);
    },
    'bringToBack': function() {
        this.options.isBack = true;
        if (this._overlay) this._overlay.bringToBack();
    },
    'bringToFront': function() {
        this.options.isBack = false;
        if (this._overlay) this._overlay.bringToFront();
    },
    'getLayer': function(name) {
        return $a41f3dbaa06477cc$export$f29dd90282299ad2.layer(this, name);
    },
    'getSubLayers': function() {
        return this._subLayers;
    },
    'addSubLayer': function(name) {
        this._subLayers[name] = true;
        this.refreshOverlay();
    },
    'removeSubLayer': function(name) {
        delete this._subLayers[name];
        this.refreshOverlay();
    },
    /* Efficient way to swap out all sub layers */ 'replaceAllSubLayers': function(newSubLayers) {
        this._subLayers = {};
        for(var i = 0; i < newSubLayers.length; i++)this._subLayers[newSubLayers[i]] = true;
        this.refreshOverlay();
    },
    'refreshOverlay': function() {
        var subLayers = Object.keys(this._subLayers).join(",");
        if (!this._map) return;
        if (!subLayers) this._overlay.remove();
        else {
            this._overlay.setParams({
                'layers': subLayers
            });
            this._overlay.addTo(this._map);
        }
    },
    'identify': function(evt) {
        // Identify map features in response to map clicks. To customize this
        // behavior, create a class extending wms.Source and override one or
        // more of the following hook functions.
        var layers = this.getIdentifyLayers();
        if (!layers.length) return;
        this.getFeatureInfo(evt.containerPoint, evt.latlng, layers, this.showFeatureInfo);
    },
    'getFeatureInfo': function(point, latlng, layers, callback) {
        // Request WMS GetFeatureInfo and call callback with results
        // (split from identify() to faciliate use outside of map events)
        var params = this.getFeatureInfoParams(point, layers), url = this._url + $gHGoZ$getParamString(params, this._url);
        this.showWaiting();
        this.ajax(url, done);
        function done(result) {
            this.hideWaiting();
            var text = this.parseFeatureInfo(result, url);
            callback.call(this, latlng, text);
        }
    },
    'ajax': function(url, callback) {
        $a41f3dbaa06477cc$export$f29dd90282299ad2.ajax.call(this, url, callback);
    },
    'getIdentifyLayers': function() {
        // Hook to determine which layers to identify
        if (this.options.identifyLayers) return this.options.identifyLayers;
        return Object.keys(this._subLayers);
    },
    'getFeatureInfoParams': function(point, layers) {
        // Hook to generate parameters for WMS service GetFeatureInfo request
        var wmsParams, overlay;
        if (this.options.untiled) // Use existing overlay
        wmsParams = this._overlay.wmsParams;
        else {
            // Create overlay instance to leverage updateWmsParams
            overlay = this.createOverlay(true);
            overlay.updateWmsParams(this._map);
            wmsParams = overlay.wmsParams;
            wmsParams.layers = layers.join(',');
        }
        var infoParams = {
            'request': 'GetFeatureInfo',
            'query_layers': layers.join(','),
            'X': Math.round(point.x),
            'Y': Math.round(point.y)
        };
        return $gHGoZ$extend({}, wmsParams, infoParams);
    },
    'parseFeatureInfo': function(result, url) {
        // Hook to handle parsing AJAX response
        if (result == "error") // AJAX failed, possibly due to CORS issues.
        // Try loading content in <iframe>.
        result = "<iframe src='" + url + "' style='border:none'>";
        return result;
    },
    'showFeatureInfo': function(latlng, info) {
        // Hook to handle displaying parsed AJAX response to the user
        if (!this._map) return;
        this._map.openPopup(info, latlng);
    },
    'showWaiting': function() {
        // Hook to customize AJAX wait animation
        if (!this._map) return;
        this._map._container.style.cursor = "progress";
    },
    'hideWaiting': function() {
        // Hook to remove AJAX wait animation
        if (!this._map) return;
        this._map._container.style.cursor = "default";
    }
});
$a41f3dbaa06477cc$export$f29dd90282299ad2.source = function(url, options) {
    return new $a41f3dbaa06477cc$export$f29dd90282299ad2.Source(url, options);
};
/*
 * Layer
 * Leaflet "layer" with all actual rendering handled via an underlying Source
 * object.  Can be called directly with a URL to automatically create or reuse
 * an existing Source.  Note that the auto-source feature doesn't work well in
 * multi-map environments; so for best results, create a Source first and use
 * getLayer() to retrieve wms.Layer instances.
 */ $a41f3dbaa06477cc$export$f29dd90282299ad2.Layer = (0, $gHGoZ$Layer).extend({
    'initialize': function(source, layerName, options) {
        $gHGoZ$setOptions(this, options);
        if (!source.addSubLayer) // Assume source is a URL
        source = $a41f3dbaa06477cc$export$f29dd90282299ad2.getSourceForUrl(source, options);
        this._source = source;
        this._name = layerName;
    },
    'onAdd': function() {
        if (!this._source._map) this._source.addTo(this._map);
        this._source.addSubLayer(this._name);
    },
    'onRemove': function() {
        this._source.removeSubLayer(this._name);
    },
    'setOpacity': function(opacity) {
        this._source.setOpacity(opacity);
    },
    'bringToBack': function() {
        this._source.bringToBack();
    },
    'bringToFront': function() {
        this._source.bringToFront();
    }
});
$a41f3dbaa06477cc$export$f29dd90282299ad2.layer = function(source, options) {
    return new $a41f3dbaa06477cc$export$f29dd90282299ad2.Layer(source, options);
};
// Cache of sources for use with wms.Layer auto-source option
$a41f3dbaa06477cc$export$f29dd90282299ad2.sources = {};
$a41f3dbaa06477cc$export$f29dd90282299ad2.getSourceForUrl = function(url, options) {
    if (!$a41f3dbaa06477cc$export$f29dd90282299ad2.sources[url]) $a41f3dbaa06477cc$export$f29dd90282299ad2.sources[url] = $a41f3dbaa06477cc$export$f29dd90282299ad2.source(url, options);
    return $a41f3dbaa06477cc$export$f29dd90282299ad2.sources[url];
};
// Copy tiled WMS layer from leaflet core, in case we need to subclass it later
$a41f3dbaa06477cc$export$f29dd90282299ad2.TileLayer = (0, $gHGoZ$TileLayerWMS);
$a41f3dbaa06477cc$export$f29dd90282299ad2.tileLayer = (0, $gHGoZ$tileLayerWMS);
/*
 * wms.Overlay:
 * "Single Tile" WMS image overlay that updates with map changes.
 * Portions of wms.Overlay are directly extracted from L.TileLayer.WMS.
 * See Leaflet license.
 */ $a41f3dbaa06477cc$export$f29dd90282299ad2.Overlay = (0, $gHGoZ$Layer).extend({
    'defaultWmsParams': {
        'service': 'WMS',
        'request': 'GetMap',
        'version': '1.1.1',
        'layers': '',
        'styles': '',
        'format': 'image/jpeg',
        'transparent': false
    },
    'options': {
        'crs': null,
        'uppercase': false,
        'attribution': '',
        'opacity': 1,
        'isBack': false,
        'minZoom': 0,
        'maxZoom': 18
    },
    'initialize': function(url, options) {
        this._url = url;
        // Move WMS parameters to params object
        var params = {}, opts = {};
        for(var opt in options)if (opt in this.options) opts[opt] = options[opt];
        else params[opt] = options[opt];
        $gHGoZ$setOptions(this, opts);
        this.wmsParams = $gHGoZ$extend({}, this.defaultWmsParams, params);
    },
    'setParams': function(params) {
        $gHGoZ$extend(this.wmsParams, params);
        this.update();
    },
    'getAttribution': function() {
        return this.options.attribution;
    },
    'onAdd': function() {
        this.update();
    },
    'onRemove': function(map) {
        if (this._currentOverlay) {
            map.removeLayer(this._currentOverlay);
            delete this._currentOverlay;
        }
        if (this._currentUrl) delete this._currentUrl;
    },
    'getEvents': function() {
        return {
            'moveend': this.update
        };
    },
    'update': function() {
        if (!this._map) return;
        // Determine image URL and whether it has changed since last update
        this.updateWmsParams();
        var url = this.getImageUrl();
        if (this._currentUrl == url) return;
        this._currentUrl = url;
        // Keep current image overlay in place until new one loads
        // (inspired by esri.leaflet)
        var bounds = this._map.getBounds();
        var overlay = new (0, $gHGoZ$ImageOverlay)(url, new (0, $gHGoZ$LatLngBounds)(bounds.getNorthEast(), bounds.getSouthWest()), {
            'opacity': 0
        });
        overlay.addTo(this._map);
        overlay.once('load', _swap, this);
        function _swap() {
            if (!this._map) return;
            if (overlay._url != this._currentUrl) {
                this._map.removeLayer(overlay);
                return;
            } else if (this._currentOverlay) this._map.removeLayer(this._currentOverlay);
            this._currentOverlay = overlay;
            overlay.setOpacity(this.options.opacity ? this.options.opacity : 1);
            if (this.options.isBack === true) overlay.bringToBack();
            if (this.options.isBack === false) overlay.bringToFront();
        }
        if (this._map.getZoom() < this.options.minZoom || this._map.getZoom() > this.options.maxZoom) this._map.removeLayer(overlay);
    },
    'setOpacity': function(opacity) {
        this.options.opacity = opacity;
        if (this._currentOverlay) this._currentOverlay.setOpacity(opacity);
    },
    'bringToBack': function() {
        this.options.isBack = true;
        if (this._currentOverlay) this._currentOverlay.bringToBack();
    },
    'bringToFront': function() {
        this.options.isBack = false;
        if (this._currentOverlay) this._currentOverlay.bringToFront();
    },
    // See L.TileLayer.WMS: onAdd() & getTileUrl()
    'updateWmsParams': function(map) {
        if (!map) map = this._map;
        // Compute WMS options
        var bounds = map.getBounds();
        var size = map.getSize();
        var wmsVersion = parseFloat(this.wmsParams.version);
        var crs = this.options.crs || map.options.crs;
        var projectionKey = wmsVersion >= 1.3 ? 'crs' : 'srs';
        var nw = crs.project(bounds.getNorthWest());
        var se = crs.project(bounds.getSouthEast());
        // Assemble WMS parameter string
        var params = {
            'width': size.x,
            'height': size.y
        };
        params[projectionKey] = crs.code;
        params.bbox = (wmsVersion >= 1.3 && crs.code === (0, $gHGoZ$EPSG4326).code ? [
            se.y,
            nw.x,
            nw.y,
            se.x
        ] : [
            nw.x,
            se.y,
            se.x,
            nw.y
        ]).join(',');
        $gHGoZ$extend(this.wmsParams, params);
    },
    'getImageUrl': function() {
        var uppercase = this.options.uppercase || false;
        var pstr = $gHGoZ$getParamString(this.wmsParams, this._url, uppercase);
        return this._url + pstr;
    }
});
$a41f3dbaa06477cc$export$f29dd90282299ad2.overlay = function(url, options) {
    return new $a41f3dbaa06477cc$export$f29dd90282299ad2.Overlay(url, options);
};
// Simple AJAX helper (since we can't assume jQuery etc. are present)
$a41f3dbaa06477cc$export$f29dd90282299ad2.ajax = function(url, callback) {
    var context = this, request = new XMLHttpRequest();
    request.onreadystatechange = change;
    request.open('GET', url);
    request.send();
    function change() {
        if (request.readyState === 4) {
            if (request.status === 200) callback.call(context, request.responseText);
            else callback.call(context, "error");
        }
    }
};


const $c3068f8e37cf671e$var$icon = new URL('https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png');
const $c3068f8e37cf671e$var$iconShadow = new URL('https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png');
// Map Portal Template
let $c3068f8e37cf671e$var$mapTemplate = document.createElement('template');
$c3068f8e37cf671e$var$mapTemplate.innerHTML = /*html*/ `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/css/bootstrap.min.css"
    integrity="sha384-F3w7mX95PdgyTmZZMECAngseQB83DfGTowi0iMjiWaeVhAn4FJkqJByhZMI3AhiU"
    crossorigin="anonymous">
  <link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet"
    integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN"
    crossorigin="anonymous">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
    integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
    crossorigin="">
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" media="screen">
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" media="screen">
  <style>
    #map {
      width: 100vw;
      height: 100%;
    }

    :host {
      font-family: system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Liberation Sans",sans-serif;
      --primary-color: #003d7d;
      --secondary-color: #ff4b5f;
    }

    main.card {
      position: absolute;
      left: 15px;
      top: 15px;
      bottom: 15px;
      width: 300px;
      z-index: 1005;

      background-color: #fff;
      box-shadow: 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12), 0 5px 5px -3px rgba(0, 0, 0, 0.3);

      transition: transform 175ms;
    }

    a {
      color: var(--primary-color, inherit);
    }

    .btn-primary {
      color: #fff;
      background-color: var(--primary-color, inherit);
      border-color: var(--primary-color, inherit);
    }

    header#page-title {
      padding: 10px;
      background-color: var(--primary-color);
    }

    header#page-title h1 {
      color: #fff;
      font-weight: 700;
      font-size: xx-large;
    }

    section#overlays {
      overflow: auto;
      padding-bottom: 5px;
      overflow-y:scroll;
    }

    section#overlays .overlay-item {
      font-size: 1.1rem;
      color: #444;
    }

    section#overlays .overlay-item:hover {
      cursor: pointer;
      background-color: #eee;
    }

    section#overlays .overlay-item.selected {
      background-color: #ddd;
      color: var(--primary-color);

      /* left border and offset text back */
      border-left: 0.25rem solid var(--primary-color);
      padding-left: 1rem;
    }

    ul.overlay-layers>li.list-group-item {
      border: 0;
      border-left: 0.25rem solid var(--primary-color);
      padding-left: 1.75rem;
      background-color: #eee;
      cursor: pointer;
    }

    ul.overlay-layers .overlay-layers-toggle {
      --primary-color: var(--secondary-color);
    }

    button#layers-menu-toggle {
      position: absolute;
      display: none;
      right: 10px;
      bottom: 90px;
      width: 160px;
      height: 90px;
      z-index: 1001;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 2px 1px rgba(0, 0, 0, 0.14), 0 1px 3px 1px rgba(0, 0, 0, 0.12), 0 2px 2px -1px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }

    section#download-disclaimer {
      max-height: 400px;
      overflow: auto;
      text-align: justify;
    }

    .show-mobile {
      display: none;
    }

    @media (max-width: 600px) {
      main.card {
        right: 30px;
        left: 30px;
        top: 30px;
        bottom: 30px;
        width: unset;
        transform: scale(0);
      }

      main.show {
        transform: scale(1);
      }

      .show-mobile {
        display: block;
      }

      button#layers-menu-toggle {
        display: block;
        width: 48px;
        height: 48px;
        border-radius: 5px;
      }
    }

    @media (max-height: 700px) {
      header#page-title h1 {
        font-weight: 600;
        font-size: 1.15rem;
      }
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 40px;
      height: 30px;
      margin-right: 12px;
      padding-right: 40px;
    }

    /* Hide default HTML checkbox */
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    /* The slider */
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: -16px;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      border-radius: 30px;
      -webkit-transition: .4s;
      transition: .4s;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      border-radius: 50%;
      -webkit-transition: .4s;
      transition: .4s;
    }

    input:checked + .slider {
      background-color: var(--primary-color);
    }

    input:focus + .slider {
      box-shadow: 0 0 1px #2196F3;
    }

    input:checked + .slider:before {
      -webkit-transform: translateX(26px);
      -ms-transform: translateX(26px);
      transform: translateX(26px);
    }

    .accordion-button:focus {
      box-shadow: none;
    }

    .accordion-button:not(.collapsed)::after {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23003d7d'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
    }
  </style>

  <main id="layers-menu" class="card">
    <header id="page-title" class="card-img-top d-flex align-items-end">
      <h1 id="map-title" class="h2"></h1>
    </header>

    <!-- Search section -->
    <section id="search-section" class="input-group">
      <input type="text" name="search" id="search" class="form-control rounded-0" placeholder="Search address">
      <span class="input-group-btn rounded-0">
        <button class="btn btn-secondary rounded-0">
          <i class="fa fa-fw fa-search"></i>
        </button>
      </span>
    </section>

    <!-- List of available overlays -->
    <section id="overlays"></section>

    <footer class="card-body">
      <!-- <a href="#" class="btn btn-link">Help</a>
      <a href="#" class="btn btn-link">Tour</a> -->
      <div class="pull-right show-mobile">
        <a href="#" class="btn btn-primary menu-toggle">
          <i class="fa fa-map"></i>
          View Map
        </a>
      </div>
    </footer>
  </main>

  <button id="layers-menu-toggle" class="btn btn-primary menu-toggle"><i class="fa fa-bars"></i></button>

  <div id="map"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/2.10.2/umd/popper.min.js"
    integrity="sha512-nnzkI2u2Dy6HMnzMIkh7CPd1KX445z38XIu4jG1jGw7x5tSL3VBjE44dY4ihMU1ijAQV930SPM12cCFrB18sVw=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.1/dist/js/bootstrap.min.js"
    integrity="sha384-skAcpIdS7UcVUC05LJ9Dxay8AXcDYfBJqt1CJ85S/CFujBsIzCIv+l9liuYLaMQ/"
    crossorigin="anonymous"></script>
`;
// Download Modal Template
let $c3068f8e37cf671e$var$downloadTemplate = document.createElement('template');
$c3068f8e37cf671e$var$downloadTemplate.innerHTML = /*html*/ `
  <div class="modal fade" id="download-modal" tabindex="-1" role="dialog" aria-labelledby="download-modal-label" aria-hidden="true">
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title" id="download-modal-label">
            <span id="layer-name"></span>
          </h3>
          <button type="button" id="modal-close" class="btn-close" data-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <section style="height: 400px; overflow: auto; padding: 10px; background-color: #eee; font-size: 0.85rem;">
            <h5>Download Disclaimer</h5>

            <p>The City of Garden Grove provides the data as a public resource of general information for use "as is." The City
              of Garden Grove provides this information with the understanding that it is not guaranteed to be accurate, correct
              or complete and any conclusions drawn from such information are the sole responsibility of the user. Further,
              the City of Garden Grove makes no warranty, representation or guaranty as to the content, sequence, accuracy,
              timeliness or completeness of any of the spatial or database information provided herein. While every effort
              has been made to ensure the content, sequence, accuracy, timeliness or completeness of materials presented within
              these pages, the City of Garden Grove assumes no responsibility for errors or omissions, and explicitly disclaims
              any representations and warranties, including, without limitation, the implied warranties of merchantability
              and fitness for a particular purpose. The City of Garden Grove shall assume no liability for:</p>
            <p>1.Any errors, omissions, or inaccuracies in the information provided, regardless of how caused; or 2.Any decision
              made or action taken or not taken by viewer in reliance upon any information or data furnished hereunder.</p>
            <p>Availability of the City of Garden Grove GIS is not guaranteed. Applications, servers, and network connections
              may be unavailable at any time for maintenance or unscheduled outages. Outages may be of long duration. Users
              are cautioned to create dependencies on these services for critical needs.</p>
            <p>THE FOREGOING WARRANTY IS EXCLUSIVE AND IN LIEU OF ALL OTHER WARRANTIES OF MERCHANTABILITY, FITNESS FOR PARTICULAR
              PURPOSE AND/OR ANY OTHER TYPE WHETHER EXPRESSED OR IMPLIED. In no event shall The City of Garden Grove become
              liable to users of these data, or any other party, for any loss or direct, indirect, special, incidental or consequential
              damages, including, but not limited to, time, money or goodwill, arising from the use or modification of the
              data.
            </p>
            <p>To assist The City of Garden Grove in the maintenance and/or correction of the data, users should provide the City
              of Garden Grove with information concerning errors or discrepancies found in using the data. Please acknowledge
              the City of Garden Grove as the source when data is used in the preparation of reports, papers, publications,
              maps, or other products.</p>
          </section>
        </div>
        <div class="modal-footer">
          <span id="download-buttons-label">Download as:</span>
        </div>
      </div>
    </div>
  </div>
`;
class $c3068f8e37cf671e$var$GGMapPortal extends HTMLElement {
    constructor(){
        super();
        this.attachShadow({
            mode: 'open'
        });
        this.shadowRoot.appendChild($c3068f8e37cf671e$var$mapTemplate.content.cloneNode(true));
        if (this.hasAttribute('config')) this.config = this.getAttribute('config');
        else console.error('Error: No map configuration specificied.');
        this.state = {
            baseMap: '',
            overlay: 0,
            layers: []
        };
        this.baseMaps = {};
        this.baseMapNames = {};
        this.wmsGroups = {};
        this.geojsonLayers = {};
        this.overlayCollapses = {};
        this._markersGroup = L.featureGroup([]);
        window.onpopstate = (function() {
            let previousBaseMap = this.baseMapNames[this.state.baseMap];
            this._initializeState(location.hash);
            if (previousBaseMap !== this.baseMapNames[this.state.baseMap]) {
                this.baseMaps[previousBaseMap].removeFrom(this.map);
                this.baseMaps[this.baseMapNames[this.state.baseMap]].addTo(this.map);
            }
            if (!this.overlayMaps[this.state.overlay]) {
                this.state.overlay = 0;
                console.warn(`Warning: The overlay requested in the URL does not exist. Defaulting to ${this.overlayMaps[0].name}.`);
                this._pushState();
            }
            if (this.selectedOverlay.machineName !== this.overlayMaps[this.state.overlay].machineName) this.toggleCollapse(this.overlayMaps[this.state.overlay].machineName);
            this.overlaySelect(this.state.overlay);
        }).bind(this);
    }
    connectedCallback() {
        // super.connectedCallback();
        fetch(this.config).then((r)=>r.text()).then(this.initializeMap.bind(this));
    }
    initializeMap(response) {
        let rjson;
        try {
            rjson = (0, $gHGoZ$load)(response);
        } catch (e) {
            console.error('Error: Cannot load config file. Please ensure config.yml exists');
            return;
        }
        this.mapProperties = rjson.mapProperties;
        this.downloadProperties = rjson.downloadProperties;
        this.overlayMaps = rjson.overlayMaps;
        this.initializeSearch(rjson.searchUrl);
        if (this.overlayMaps && this.overlayMaps.length === 1) this.flat = true;
        this.mapTitle = this.mapProperties.title ? this.mapProperties.title : "Map Portal";
        this.shadowRoot.getElementById('map-title').textContent = this.mapTitle;
        document.title = this.mapTitle;
        if (!this.mapProperties.options) console.warn('Warning: No map options given, please provide leaflet map options in the config file under mapProperties.options');
        else if (!this.mapProperties.options.center || !this.mapProperties.options.zoom) console.warn('Warning: Intial center and zoom of map are not set. These options can be input in the config file under mapProperties.options');
        this.map = L.map(this.shadowRoot.getElementById('map'), this.mapProperties.options);
        if (this.mapProperties.bounds) this.map.fitBounds(this.mapProperties.bounds);
        this.map.zoomControl.setPosition('topright');
        if (this.mapProperties.attributionPrefix) this.map.attributionControl.setPrefix(this.mapProperties.attributionPrefix);
        let menuToggle = this.shadowRoot.querySelectorAll('.menu-toggle');
        menuToggle.forEach((t)=>t.onclick = this._toggleLayersMenu.bind(this));
        this._markersGroup.addTo(this.map);
        this._initializeState(decodeURI(location.hash));
        this._initializeBaseMaps(rjson.baseMaps);
        this._initializeOverlays(rjson.wmsDefaultSource);
    }
    initializeSearch(url) {
        if (!url) {
            console.error('Error: No URL given for address search. Please input URL in config file under searchUrl');
            return;
        }
        let searchInput = this.shadowRoot.getElementById('search');
        searchInput.oninput = (function(e) {
            if (!e.target.value) {
                this._markersGroup.clearLayers();
                if (this.map) {
                    if (this.selectedOverlay.initialCenter && this.selectedOverlay.initialZoom) {
                        this.map.flyTo(this.selectedOverlay.initialCenter, this.selectedOverlay.initialZoom);
                        if (this.selectedOverlay.fitBounds) {
                            if (window.innerWidth <= 600) this.map.flyToBounds(this.mapProperties.bounds);
                            else this.map.flyToBounds(this.mapProperties.bounds, {
                                paddingTopLeft: [
                                    250,
                                    0
                                ],
                                paddingBottomRight: [
                                    -50,
                                    0
                                ]
                            });
                        }
                    } else {
                        this.map.flyTo(this.mapProperties.mapOptions.center, this.mapProperties.zoom);
                        if (this.mapProperties.bounds) this.map.fitBounds(this.mapProperties.bounds);
                    }
                }
            }
        }).bind(this);
        jQuery('#search', this.shadowRoot).autocomplete({
            preventBadQueries: false,
            deferRequestBy: 200,
            minChars: 3,
            serviceUrl: url,
            paramName: 'q',
            // params: { limit: 10 },
            transformResult: function(response) {
                let addresses = JSON.parse(response).addresses;
                return {
                    suggestions: addresses.map((d)=>({
                            value: d.address,
                            data: d
                        }))
                };
            },
            onSearchStart: ()=>this.searchMakers = [],
            onSearchComplete: (function(q, s) {
                this.searchMarkers = s.map((obj)=>({
                        coords: [
                            obj.data.latitude,
                            obj.data.longitude
                        ],
                        address: obj.data.address
                    }));
                this._markMap(this.searchMarkers);
            }).bind(this),
            onSelect: (function(obj) {
                this.searchMarkers = [
                    {
                        coords: [
                            obj.data.latitude,
                            obj.data.longitude
                        ],
                        address: obj.data.address
                    }
                ];
                this._markMap(this.searchMarkers);
            }).bind(this)
        });
    }
    _initializeState(hash) {
        if (hash !== '') {
            let initialState = hash.substring(2).split('/');
            if (initialState[0]) this.state.baseMap = initialState[0];
            if (initialState[1] && this.overlayMaps) this.state.overlay = this.overlayMaps.findIndex((m)=>m.machineName === initialState[1]);
            if (this.state.overlay === -1 && !isNaN(parseInt(initialState[1]))) this.state.overlay = parseInt(initialState[1]);
            if (initialState[2]) this.state.layers = initialState[2].split(',');
        }
    }
    _initializeBaseMaps(baseMaps) {
        if (!baseMaps || !baseMaps.length) {
            alert('No basemaps provided.');
            console.error('Error: Please list basemap configuration properties in the config file as baseMaps[]');
            return;
        }
        for(let i = 0; i < baseMaps.length; i++){
            let baseMapConfig = baseMaps[i];
            if (!baseMapConfig.machineName) {
                if (!baseMapConfig.name) baseMapConfig.name = 'Basemap ' + i;
                baseMapConfig.machineName = i;
            }
            this.baseMapNames[baseMapConfig.machineName] = baseMapConfig.name;
            if (!baseMapConfig.source) {
                console.error(`Error: No basemap source provided for ${baseMapConfig.name}, please provide source URL in the config file under baseMaps[].source`);
                continue;
            }
            if (!baseMapConfig.options) console.warn(`Warning: No basemap options given for ${baseMapConfig.name}, please provide leaflet basemap options in the config file under baseMaps[].options`);
            else if (!baseMapConfig.options.maxZoom && this.mapProperties.options) baseMapConfig.options.maxZoom = this.mapProperties.options.maxZoom;
            switch(baseMapConfig.format){
                case 'XYZ':
                    this.baseMaps[baseMapConfig.name] = L.tileLayer(baseMapConfig.source, baseMapConfig.options);
                    break;
                case 'WMS':
                    if (!baseMapConfig.options.format) baseMapConfig.options.format = 'image/png';
                    this.baseMaps[baseMapConfig.name] = L.tileLayer.wms(baseMapConfig.source, baseMapConfig.options);
                    break;
                default:
                    console.error(`Error: Invalid Tile Layer Format for ${baseMapConfig.name}: ${baseMapConfig.format}. Please check baseMaps[].format in config file`);
                    continue;
            }
            this.baseMaps[baseMapConfig.name].on('tileerror', function() {
                console.error(`Error: Unable to load basemap layer ${baseMapConfig.name}, check source and options for baseMaps[] in config file`);
            });
            if (!this.state.baseMap && baseMapConfig.default) this.state.baseMap = baseMapConfig.machineName;
        }
        if (Object.keys(this.baseMaps).length) {
            if (!this.state.baseMap || !this.baseMaps[this.baseMapNames[this.state.baseMap]]) {
                this.state.baseMap = Object.keys(this.baseMapNames).find((key)=>this.baseMapNames[key] === Object.keys(this.baseMaps)[0]);
                console.warn(`Warning: The basemap requested in the URL does not exist. Defaulting to ${this.baseMapNames[this.state.baseMap]}.`);
                this._pushState();
            }
            this.baseMaps[this.baseMapNames[this.state.baseMap]].addTo(this.map);
            L.control.layers(this.baseMaps).addTo(this.map).setPosition('bottomright');
            this.map.on('baselayerchange', (function(e) {
                let newBaseMap = Object.keys(this.baseMapNames).find((key)=>this.baseMapNames[key] === e.name);
                if (this.state.baseMap !== newBaseMap) {
                    this.state.baseMap = newBaseMap;
                    this._pushState();
                }
            }).bind(this));
        }
    }
    _initializeOverlays(wmsDefaultSource) {
        if (!this.overlayMaps || !this.overlayMaps.length) {
            alert('No overlay layers provided.');
            console.error('Error: Please list overlay configuration properties in the config file as overlayMaps[]');
            return;
        }
        if (!wmsDefaultSource) console.warn('Warning: wmsDefaultSource not set in config file. Layers may not display');
        let accordionDiv = document.createElement('div');
        accordionDiv.classList.add('accordion', 'accordion-flush');
        this.shadowRoot.getElementById('overlays').appendChild(accordionDiv);
        // iterate through overlay groups
        for(let i = 0; i < this.overlayMaps.length; i++){
            let overlayConfig = this.overlayMaps[i];
            if (!this.state.overlay && overlayConfig.default) this.state.overlay = i;
            if (!overlayConfig.machineName) this.overlayMaps[i].machineName = i;
            if (!overlayConfig.name) this.overlayMaps[i].name = 'Overlay ' + i;
            if (!overlayConfig.layers || !Object.keys(overlayConfig.layers).length) {
                console.error(`Error: Overlay ${this.overlayMaps[i].name} does not have any layers. Please set them in the config file under overlayMaps[].layers`);
                return;
            }
            let overlayTemplate = document.createElement('template');
            overlayTemplate.innerHTML = /*html*/ `
        <div class='accordion-item'>
          <h2 class='accordion-header' id=${overlayConfig.machineName}>
            <button class='overlay-item accordion-button collapsed' id=${i} type='button' value=${overlayConfig.machineName}>
              ${overlayConfig.name}
            </button>
          </h2>
          <div class='accordion-collapse collapse' id=${overlayConfig.machineName + '-layers'}>
            <ul class='overlay-layers list-group list-group-flush'>
            </ul>
          </div>
        </div>
      `;
            let overlayItem = overlayTemplate.content.firstElementChild.cloneNode(true);
            overlayItem.querySelector('h2').title = overlayConfig.description ? overlayConfig.description : this.overlayMaps[i].name;
            overlayItem.querySelector('button').onclick = this._toggleOverlay.bind(this);
            accordionDiv.appendChild(overlayItem);
            let overlayCollapse = this.shadowRoot.getElementById(overlayConfig.machineName + '-layers');
            this.overlayCollapses[overlayConfig.machineName] = new $gHGoZ$Collapse(overlayCollapse, {
                toggle: false
            });
            let startCollapse = (function(e) {
                let item = this.shadowRoot.getElementById(e.target.id.slice(0, -7));
                item.querySelector('button').disabled = true;
            }).bind(this);
            let postCollapse = (function(e) {
                let item = this.shadowRoot.getElementById(e.target.id.slice(0, -7));
                item.querySelector('button').disabled = false;
            }).bind(this);
            overlayCollapse.addEventListener('show.bs.collapse', startCollapse);
            overlayCollapse.addEventListener('hide.bs.collapse', startCollapse);
            overlayCollapse.addEventListener('shown.bs.collapse', postCollapse);
            overlayCollapse.addEventListener('hidden.bs.collapse', postCollapse);
            let layerList = overlayItem.querySelector('ul');
            let layers = this.overlayMaps[i].layers;
            this.overlayMaps[i].flattenedLayers = [];
            // iterate through layer interaction types (always on, exclusives, optionals)
            for(let type in layers){
                // iterate through all layers
                for(let j = 0; j < layers[type].length; j++){
                    layers[type][j].interaction = type;
                    let layer = layers[type][j];
                    if (!layer.machineName) layers[type][j].machineName = type + i + j;
                    if (!layer.name) layers[type][j].name = `${type} layer ${i}.${j}`;
                    if (type === 'alwaysOn') layers[type][j].visible = true;
                    else {
                        let layerTemplate = document.createElement('template');
                        layerTemplate.innerHTML = /*html*/ `
              <li class='list-group-item d-flex justify-content-start' id=${layer.machineName}>
                <label class='switch'>
                  <input type='checkbox' class='overlay-layers-toggle' disabled>
                  <span class='slider'></span>
                </label>
                <span class='mr-auto'>${layer.name}</span>
                <a href='#' class='ms-auto'>
                  <i class='fa fa-fw fa-download' title=${'Download ' + layer.name}></i>
                </a>
              </li>
            `;
                        let layerItem = layerTemplate.content.firstElementChild.cloneNode(true);
                        layerItem.onclick = (function() {
                            this._toggleLayer(layer.machineName);
                        }).bind(this);
                        layerItem.querySelector('a').onclick = (function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            this._downloadLayer(layer);
                        }).bind(this);
                        layerList.appendChild(layerItem);
                    }
                    if ((layers[type][j].type === 'wms' || layers[type][j].type === undefined) && layers[type][j].source === undefined) {
                        layers[type][j].type = 'wms';
                        layers[type][j].source = wmsDefaultSource;
                    }
                }
                this.overlayMaps[i].flattenedLayers = this.overlayMaps[i].flattenedLayers.concat(layers[type]);
            }
        }
        if (!location.hash) this.overlayMaps[this.state.overlay].flattenedLayers.filter((l)=>l.visible && l.interaction !== 'alwaysOn').forEach((l)=>{
            this.state.layers.push(l.machineName.split('.')[1]);
        });
        if (!this.overlayMaps[this.state.overlay]) {
            this.state.overlay = 0;
            console.warn(`Warning: The overlay requested by the URL does not exist. Defaulting to ${this.overlayMaps[0].name}.`);
            this._pushState();
        }
        this.toggleCollapse(this.overlayMaps[this.state.overlay].machineName);
        this.overlaySelect(this.state.overlay);
    }
    _toggleOverlay(e) {
        let button = e.target;
        let id = button.getAttribute('value');
        if (!this.flat) this.toggleCollapse(id);
        if (!button.classList.contains('collapsed')) {
            let index = button.getAttribute('id');
            if (this.state.overlay !== index || !location.hash) {
                this.state.overlay = index;
                this.state.layers = [];
                this.overlayMaps[index].flattenedLayers.filter((l)=>l.visible && l.interaction !== 'alwaysOn').forEach((l)=>{
                    this.state.layers.push(l.machineName.split('.')[1]);
                });
            }
            this.overlaySelect(this.state.overlay);
            this._pushState();
        } else this.selectedOverlay.collapsed = true;
    }
    _toggleLayer(layerName) {
        let layerIndex = this.selectedOverlay.flattenedLayers.findIndex((l)=>l.machineName === layerName && l.interaction !== 'alwaysOn');
        let layer = this.selectedOverlay.flattenedLayers[layerIndex];
        let shortName = layerName.split('.')[1];
        // First save the current state
        let currVisible = layer.visible;
        if (layer.interaction === 'exclusives' && !currVisible) {
            // Turn all exclusive layers off
            for(let i = 0; i < this.selectedOverlay.flattenedLayers.length; i++)if (this.selectedOverlay.flattenedLayers[i].interaction === 'exclusives') this.selectedOverlay.flattenedLayers[i].visible = false;
            this.state.layers = [];
        }
        if (currVisible) {
            let i = this.state.layers.indexOf(shortName);
            if (i > -1) this.state.layers.splice(i, 1);
        } else this.state.layers.push(shortName);
        // Compute toggle on original state
        this.selectedOverlay.flattenedLayers[layerIndex].visible = !currVisible;
        this._parseLayers();
        this._pushState();
    }
    toggleCollapse(id) {
        let item = this.shadowRoot.getElementById(id);
        let button = item.getElementsByTagName('button')[0];
        button.classList.toggle('collapsed');
        button.classList.toggle('selected');
        this.overlayCollapses[id].toggle();
    }
    overlaySelect(index) {
        if (this.selectedOverlay !== this.overlayMaps[index]) {
            if (this.selectedOverlay && !this.selectedOverlay.collapsed) this.toggleCollapse(this.selectedOverlay.machineName);
            this.selectedOverlay = this.overlayMaps[index];
        }
        this.selectedOverlay.collapsed = false;
        this._parseLayers();
        if (this.selectedOverlay.resetViewOnSelect) this.map.flyTo(this.selectedOverlay.initialCenter, this.selectedOverlay.initialZoom);
        if (this.selectedOverlay.fitBounds) {
            if (window.innerWidth <= 600) this.map.flyToBounds(this.mapProperties.bounds);
            else this.map.flyToBounds(this.mapProperties.bounds, {
                paddingTopLeft: [
                    250,
                    0
                ],
                paddingBottomRight: [
                    -50,
                    0
                ]
            });
        }
    }
    async _parseLayers() {
        let layers = this.selectedOverlay.flattenedLayers;
        let wmsLayers = {};
        this._syncStateLayers();
        layers.filter((l)=>l.visible).forEach(async (l)=>{
            if (l.type === 'wms') {
                // group the sources
                wmsLayers[l.source] = wmsLayers[l.source] || {
                    layers: []
                };
                wmsLayers[l.source].layers.push(l.machineName);
            } else if (l.type === 'geojson' && !this.geojsonLayers[l.machineName]) {
                let response = await fetch(l.source);
                if (!response.ok) console.error(`Error: The source for GeoJSON layer ${l.name} could not be fetched. Status: ${response.status}`);
                let data = await response.json();
                this._createGeoJSONLayer(l, data);
            }
        });
        layers.forEach((l)=>{
            let layerItem = this.shadowRoot.getElementById(l.machineName);
            if (layerItem) {
                let slider = layerItem.getElementsByTagName('input')[0];
                if (l.visible && l.interaction !== 'alwaysOn') {
                    slider.checked = true;
                    if (this.geojsonLayers[l.machineName]) this.geojsonLayers[l.machineName].addTo(this.map);
                } else {
                    slider.checked = false;
                    if (this.geojsonLayers[l.machineName]) this.geojsonLayers[l.machineName].removeFrom(this.map);
                }
            }
        });
        // flattened the grouped WMS sources
        for(let s in wmsLayers){
            if (!this.wmsGroups[s]) {
                this.wmsGroups[s] = (0, $a41f3dbaa06477cc$export$f29dd90282299ad2).source(s, {
                    format: 'image/png',
                    transparent: true,
                    identify: false
                });
                this.wmsGroups[s].addTo(this.map);
            }
            this.wmsGroups[s].replaceAllSubLayers(wmsLayers[s].layers);
        }
        for(let s in this.wmsGroups)if (!(s in wmsLayers)) this.wmsGroups[s].removeFrom(this.map);
    }
    _pushState() {
        let stateOverlay = this.overlayMaps ? this.overlayMaps[this.state.overlay].machineName : '';
        let stateLayers = this.state.layers.join();
        let hash = '#'.concat('/', this.state.baseMap, '/', stateOverlay);
        if (stateLayers) hash = hash.concat('/', stateLayers);
        if (history.pushState) history.pushState(this.state, '', hash);
        else location.hash = hash;
    }
    _syncStateLayers() {
        let visibleLayers = [];
        for(let i = 0; i < this.selectedOverlay.flattenedLayers.length; i++){
            let layer = this.selectedOverlay.flattenedLayers[i];
            let shortName = layer.machineName.split('.')[1];
            if (layer.interaction !== 'alwaysOn') {
                if (this.state.layers.includes(shortName)) {
                    if (layer.interaction === 'exclusives' && this.state.layers.length > 1) {
                        let j = this.state.layers.findIndex((l)=>l === shortName);
                        if (j === 0) {
                            this.state.layers = [
                                shortName
                            ];
                            this.selectedOverlay.flattenedLayers[i].visible = true;
                            console.warn(`Warning: The layer ${shortName} is exclusive. All other layers have been removed.`);
                            this._pushState();
                            return;
                        } else {
                            this.state.layers.splice(j, 1);
                            console.warn(`Warning: The layer ${shortName} is exclusive and has been removed.`);
                            this._pushState();
                        }
                    } else {
                        this.selectedOverlay.flattenedLayers[i].visible = true;
                        visibleLayers.push(shortName);
                    }
                } else this.selectedOverlay.flattenedLayers[i].visible = false;
            }
        }
        if (visibleLayers.length < this.state.layers.length) {
            let notLayers = this.state.layers.filter((l)=>!visibleLayers.includes(l));
            this.state.layers = visibleLayers;
            console.warn(`Warning: The following layer(s) do not exist in current overlay: ${notLayers.join(', ')}.`);
            this._pushState();
        }
    }
    _createGeoJSONLayer(layer, data) {
        let clusterGroup;
        if (layer.cluster) clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: layer.maxClusterRadius ? layer.maxClusterRadius : 80
        });
        let geoJSONOptions = {
            pointToLayer: (function(feature, latlng) {
                let marker = L.circleMarker(latlng, layer.markerStyle);
                if (layer.identify) marker.bindPopup(this._generatePopupContent(feature));
                if (layer.cluster) clusterGroup.addLayer(marker);
                return marker;
            }).bind(this),
            attribution: layer.attribution
        };
        let geoJSONLayer = L.geoJSON(data, geoJSONOptions);
        if (layer.cluster) this.geojsonLayers[layer.machineName] = clusterGroup;
        else this.geojsonLayers[layer.machineName] = geoJSONLayer;
        this.geojsonLayers[layer.machineName].addTo(this.map);
    }
    _generatePopupContent(feature) {
        let rows = '';
        for(let p in feature.properties){
            let fieldName = p.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase().replace('_', ' ');
            });
            rows += `<tr><td>${fieldName}:</td><td><strong>${feature.properties[p]}</strong></td></tr>`;
        }
        return `<table>${rows}</table>`;
    }
    _markMap(markersData) {
        this._markersGroup.clearLayers();
        if (markersData.length === 0) return;
        markersData.forEach((m)=>{
            this._markersGroup.addLayer(L.marker(m.coords, {
                icon: L.icon({
                    iconUrl: $c3068f8e37cf671e$var$icon,
                    shadowUrl: $c3068f8e37cf671e$var$iconShadow,
                    iconSize: [
                        25,
                        41
                    ],
                    iconAnchor: [
                        12,
                        41
                    ],
                    popupAnchor: [
                        1,
                        -34
                    ],
                    tooltipAnchor: [
                        16,
                        -28
                    ],
                    shadowSize: [
                        41,
                        41
                    ]
                })
            }).bindPopup(m.address));
        });
        if (markersData.length === 1) this.map.flyTo(markersData[0].coords);
        else this.map.fitBounds(this._markersGroup.getBounds());
    }
    _toggleLayersMenu() {
        let layersMenu = this.shadowRoot.querySelector('main#layers-menu');
        layersMenu.classList.toggle('show');
    }
    _downloadLayer(layer) {
        let dom = this.shadowRoot;
        dom.appendChild($c3068f8e37cf671e$var$downloadTemplate.content.cloneNode(true));
        let modal = new $gHGoZ$Modal(dom.getElementById('download-modal'));
        dom.getElementById('modal-close').onclick = ()=>modal.hide();
        let downloadURL = this.downloadProperties.source + layer.machineName;
        dom.getElementById('layer-name').textContent = layer.name;
        let downloadLinks = dom.querySelector('.modal-footer');
        if (!this.downloadProperties.options || !this.downloadProperties.options.length) {
            console.error('Error: No download options given. Please specify in the config file under downloadProperties.options');
            return;
        }
        this.downloadProperties.options.forEach((opt)=>{
            let link = document.createElement('template');
            link.innerHTML = /*html*/ `
        <a href=${downloadURL + opt.formatUrl} target='_blank' class='btn btn-secondary'>
          <i class='fa fa-download'></i> ${opt.type}
        </a>
      `;
            downloadLinks.appendChild(link.content.cloneNode(true));
        });
        modal.show();
    }
}
customElements.define('gg-map-portal', $c3068f8e37cf671e$var$GGMapPortal);


