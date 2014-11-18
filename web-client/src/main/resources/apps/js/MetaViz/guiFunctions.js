var guiFunctions = {};

/**
 * function which ensures via callback, that preloader is shown before tree generation is done
 */
require(["dojo/Deferred"], function(Deferred) {
    guiFunctions.showPreloaderCallback = function() {
        var d = new Deferred();

        if (dojo.byId("preloaderContent") != null) {
            // Show the preloader centered in the viewport		
            var ps = dojo.position('preloaderContent');
            var ws = dojo.window.getBox();
            dojo.style("preloaderContent", "top", (ws.h / 2 - ps.h / 2) + "px");
            dojo.style("preloaderContent", "left", (ws.w / 2 - ps.w / 2) + "px");
            dojo.style("preloaderContent", "visibility", "visible");
            dojo.style("preloader", "background", "rgba(255,255,255, 0.8)");
            dojo.style("preloaderContent", "background", "rgba(255,255,255, 1.0)");
            dojo.style("preloader", "opacity", "1");
            dojo.style("preloader", "display", "block");
            dojo.byId("preloaderText").innerHTML = "Structure is loading.";
        }
        setTimeout(function() {
            d.resolve();
        }, 100);

        return d.promise;
    };
});
 