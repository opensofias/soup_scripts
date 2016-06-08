/*
	never safe for work: a soup script
	
	this filters all content not marked as "not safe for work" and which in turn have a good chance to contain nudity or sexual activities. 
	
	it uses endlessFilter.js and is a slight modification of its example script:
	https://github.com/edave64/souplements/blob/master/endlessFilter.js
	https://github.com/edave64/souplements/blob/master/endlessFilterExample.js
*/

(function () {
    if (Ajax.Request._EndlessFilter) return;
    
    var oldRequest = Ajax.Request;

    function getLoadAboveURL() {
        var url = $("endless_top_post").href;
        return url.match(/[&?]newer=1/) ? url : url + (url.indexOf("?") >= 0 ? "&" : "?") + "newer=1"
    }

    function getLoadBelowURL() {
        return SOUP.Endless.next_url.replace(/&?newer=1&?/g, "");
    }

    Ajax.Request = function (path, options) {
        var aboveURL = getLoadAboveURL();
        var belowURL = getLoadBelowURL();

        if (path !== aboveURL && path !== belowURL) {
            return oldRequest.apply(this, arguments);
        }

        var oldSuccess = options.onSuccess;
        options.onSuccess = function (response) {
            var text = response.responseText,
                pipePosition = text.indexOf("|"),
                nextPath = text.substring(0, pipePosition),
                content = text.substring(pipePosition + 1),
                parser = new DOMParser(),
                xmlDoc = parser.parseFromString(content, "text/html"),
                root = xmlDoc.body;

            SOUP.Events.trigger("processBatch", xmlDoc);

            response.responseText = nextPath + "|" + root.innerHTML;

            return oldSuccess.apply(this, arguments);
        };

        return oldRequest.apply(this, arguments);
    };
    Ajax.Request._EndlessFilter = true;
    Ajax.Request.Events = oldRequest.Events;
    Ajax.Request.prototype = oldRequest.prototype;

    /**
     * Removes all posts that aren't "nsfw" from a document
	 * adapted from an 
     */
    function removeNonNsfw(doc) {
        var posts = doc.querySelectorAll(".post:not(.f_post_nsfw)");

        for (var i = 0; i < posts.length; ++i) {
            var post = posts[i];
            var content = post.getElementsByClassName("content")[0];
            if (content) {
                content.innerHTML = "";
                post.style.display = "none";
            }
        }
    }

    // Remove all currently displayed sfw-posts
    removeNonNsfw(document);

    // Remove all future sfw-posts
    SOUP.Events.on("processBatch", function (doc) {
        removeNonNsfw(doc);
    });
}());