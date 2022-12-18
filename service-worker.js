/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("workbox-v4.3.1/workbox-sw.js");
workbox.setConfig({modulePathPrefix: "workbox-v4.3.1"});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "static/css/2.7a7d2dfe.chunk.css",
    "revision": "b7f9c7a8744cb1bc187c1e66e5c69db1"
  },
  {
    "url": "static/css/main.092e11c7.chunk.css",
    "revision": "dcd589b4ac6745fca3623b63c2e4ec8c"
  },
  {
    "url": "static/css/main.css",
    "revision": "f5e3c5d13cae3a76426ebbdee662912e"
  },
  {
    "url": "static/js/2.b2e12971.chunk.js",
    "revision": "00270357d0b6a534903937feb7bf7192"
  },
  {
    "url": "static/js/main.0cf2ef1e.chunk.js",
    "revision": "e534d3cc1984fac6827cf0e126bb522e"
  },
  {
    "url": "static/js/runtime-main.f8271a27.js",
    "revision": "f416a38abe90f21b1e505a7b0ab7ce4e"
  },
  {
    "url": "static/fonts/glyphicons-halflings-regular.eot",
    "revision": "f4769f9bdb7466be65088239c12046d1"
  },
  {
    "url": "static/fonts/glyphicons-halflings-regular.svg",
    "revision": "89889688147bd7575d6327160d64e760"
  },
  {
    "url": "static/fonts/glyphicons-halflings-regular.ttf",
    "revision": "e18bbf611f2a2e43afc071aa2f4e1512"
  },
  {
    "url": "static/fonts/glyphicons-halflings-regular.woff",
    "revision": "fa2772327f55d8198301fdb8bcfc8158"
  },
  {
    "url": "static/fonts/glyphicons-halflings-regular.woff2",
    "revision": "448c34a56d699c29117adc64c43affeb"
  },
  {
    "url": "manifest.json",
    "revision": "c023bbada029d03e0d711c50369c8f6c"
  },
  {
    "url": "asset-manifest.json",
    "revision": "0bfb4e7bfd2088fa7df2a9ad318c5a86"
  },
  {
    "url": "favicon.png",
    "revision": "600c2b47b83b534273c44f29194ffc6b"
  },
  {
    "url": "icon256.png",
    "revision": "4b4440544d8f9e29f2e9d421ba938e3d"
  },
  {
    "url": "icon512.png",
    "revision": "f15a7c62a0b339cb8a236683ab2544ea"
  },
  {
    "url": "iconios.png",
    "revision": "719c4679579a3d44951b7f03787c459a"
  },
  {
    "url": "maskable_icon.png",
    "revision": "74cf97c3b695624abd5ed0f50f3a28a3"
  },
  {
    "url": "webworker.js",
    "revision": "2a48ae4b3608144de2d1b60a24ee1b01"
  },
  {
    "url": "index.html",
    "revision": "516704972d4334ad15ac266e6544f80d"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerNavigationRoute(workbox.precaching.getCacheKeyForURL("index.html"));
