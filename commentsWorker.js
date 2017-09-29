self.importScripts("/js/comments/CommentsManager.js");
self.importScripts("/js/handlebars-v4.0.10.js");


self.onmessage = function (event) {
    var data = event.data;

    switch (data.command) {
        case "list_comments":
            getComments(data).then(function(renderedCommentsData) {
                var response = {
                    "commentsData": renderedCommentsData
                };
                self.postMessage(response);
            });
            break;
    }
}

function getComments(data)
{
    return new Promise((resolve, reject) => {
        var commentsManager = new CommentsManager(data.commentsId);
        commentsManager.getRenderedArticleComments(data.offset, data.numComments).then(function(commentsData) {
            commentsData.items.forEach(function(item, key) {
                if (item.references.length > 0) {
                    var body = item.body;
                    item.references.forEach(function(reference) {
                        body = body.replace("#"+reference.order, '<a rel="nofollow" class="ancla_referencia">#'+reference.order+'<span class="referencia" style="display: none"><i class="comentario-cerrar"><span>Cerrar</span></i>'+reference.body+'</span></a>');
                    });
                    commentsData.items[key].body = body;
                }
            });

            var template = Handlebars.compile(data.template);
            resolve({"content": template(commentsData), "total": commentsData.total});
        });
    });
}
