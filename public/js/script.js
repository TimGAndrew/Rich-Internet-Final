//STATIC VARIABLES
var ANIMATION_DELAY = 400;
var DATE_FORMAT = "mmmm d, yyyy h:MM TT";

//PROTOTYPES

// Store the object retrieved by all posts.
var allPosts;

// Store all replies for the selected post.
var selectedPostReplies;

$(document).ready(function () {

	$("#deletePrompt").on('show.bs.modal', function(event) {
		var button = $(event.relatedTarget),
			id = button.data('id'),
			object = button.data('object'),
			title;

		if (object == 'post') {
			title = "Really delete this post? (id: " + id + ")";
		}
		else {
			title = "Really delete this reply? (id: " + id + ")";
		}

		$(this).find('.modal-title').text(title);
		$(this).find('#delete-button').data('id', id).data('object', object);
	});

	$('#deletePrompt').on('click', '#delete-button', function () {
		var id = $(this).data('id'),
			object = $(this).data('object');

		if (object == 'post') {
			deletePost(id);
		}
		else if (object == 'reply') {
			deleteReply(id);
		}
	});

	$("#dialogDelete").dialog({
		autoOpen: false,
		show: {
			effect: "blind",
			duration: 500
		},
		buttons: {
			'Delete': function(event, ui)
			{
				$(this).dialog("close");
				$("#dialogDelete").data('onDeleteAction')();
			},
			'Cancel': function(event, ui){
				$(this).dialog("close");
			}
		},
		resizeable: false,
		draggable: false,
		open: function (event, ui)
		{

		},
		close: function (event, ui)
		{

		}
	});

	$('#add-post').click(function (){
		newPostEditor();
	});

	fetchPosts();
});

// Posts methods.

function stagePostClicks()
{
	$('.post').unbind();

	$('.card-header').click(function() {
		if ($(this).parent().find('#post-content').is(":visible") && $(this).find('h5#post-title').attr("contenteditable") == "false")
		{
			$(this).parent().find('#post-content').hide(ANIMATION_DELAY);
			$(this).removeClass('add-border');
		}
		else {
			$(this).addClass('add-border');
		}
	});

	$('.post').click(function (e){

		var postId = $(this).attr("postId");

		if (!$(this).find('#post-content').is(":visible"))
		{
			$(this).find('#post-content').show(ANIMATION_DELAY);
			collapseAll(this);
			fetchReplies(postId, this);
		}
        else if (e.target.id == "edit-post")
		{
			postEditor(this, postId);
			//console.log("edit-post click");
		}
		else if (e.target.id == "delete-post")
		{
			deletePostPrompt(this, postId);
			//console.log("delete-post click");
		}
		else if (e.target.id == "reply-post")
		{
			newReplyEditor(this, postId);
			//console.log("reply-post fired");
		}
//		else if (e.target.id == "reply-id-link")
//		{
//			var replyId = e.target.text;
//			addIDToReply(this, postId, replyId);
//		}
        else if (e.target.id == "post-title")
        {
			//collapseThis(this);
        }
        else
        {
            //console.log(e);
        }
	});
}

function fetchPosts()
{
	$.ajax({
		type: "GET",
		url: "http://127.0.0.1:3000/posts?_sort=id&_order=DESC",
		dataType: "json"
	})
	.done(function (data){
		allPosts = data;
		populatePosts();
	})
	.fail(function (data){
		console.log("AN ERROR OCCURED!");
		console.log(data);
	})
	.always(function (data){
        ready();
	});
}

//Populate the DOM with posts and associated content.
function populatePosts()
{
	$(allPosts).each(function(){
		$('#posts').append(generatePostHTML(this));
	});

	stagePostClicks();
}

function generatePostHTML(postObject)
{
	var date = new Date(postObject.datetime);
	var newHTML = ''
	+ '<div class="post card mb-4" postId="' + postObject.id + '">'
	+ '  <div class="card-header">'
	+ '     <div class="clearfix">'
	+ '         <div id="posttitle" class="float-left" style="width: 60%">'
	+ '             <h5 id="post-title" class="card-title" contenteditable="false">' + postObject.title + '</h5>'
	+ '             <div id="post-title-help" class="form-control-feedback"></div>'
	+ '         </div>'
	+ '			<div id="postdate" class="float-right">'
	+ '         	<h6 class="card-subtitle"><small>' + dateFormat(date, DATE_FORMAT) + '</small></h6>'
	+ '			</div>'
	+ '     </div>'
	+ '  </div>'
	+ '  <div class="card-block" id="post-content" style="display:none">'
	+ '     <div>'
	+ '         <div id="postbody" class="form-group">'
	+ '             <div id="post-body" class="mt-3">'
	+                   postObject.body
	+ '             </div>'
	+ '             <div id="post-body-help" class="form-control-feedback"></div>'
	+ '         </div>'
	+ '         <div id="post-controls" class="clearfix mb-2">'
	+ '             <div class="float-right">'
	+ '					<div class="btn-group">'
	+ '                 	<button type="button" id="reply-post" class="btn btn-link btn-sm"><i class="material-icons" id="reply-post">comment</i></button>'
	+ '             		<button type="button" id="post-more" class="btn btn-link btn-sm dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>'
	+ '						<div class="dropdown-menu">'
	+ '                 		<button id="edit-post" class="dropdown-item">Edit post</button>'
	+ '                 		<button id="delete-post" data-toggle="modal" data-target="#deletePrompt" data-id="' + postObject.id + '" data-object="post" class="dropdown-item">Delete post</button>'
	+ '         			</div>'
	+ '					</div>'
	+ '                 <button id="edit-post-save" class="btn btn-link" style="display: none;"><i class="material-icons" id="edit-post-save">check</i></button>'
	+ '                 <button id="edit-post-cancel" class="btn btn-link" style="display: none;"><i class="material-icons" id="delete-post-cancel">close</i></button>'
	+ '             </div>'
	+ '         </div>'
	+ '         <div id="reply-controls" class="mt-3 clearfix" style="display: none;">'
	+ '             <div id="replybox" class="form-group">'
	+ '                 <label for="reply-box" class="form-control-label">Reply</label>'
	+ '                 <textarea class="form-control post-body" id="reply-box"></textarea>'
	+ '                 <div id="reply-box-help" class="form-control-feedback"></div>'
	+ '             </div>'
	+ '             <div class="form-group float-right">'
	+ '                 <button id="new-reply-save" class="btn btn-link"><i class="material-icons">check</i></button>'
	+ '                 <button id="new-reply-cancel" class="btn btn-link"><i class="material-icons">close</i></button>'
	+ '             </div>'
	+ '         </div>'
	+ '         <div class="replies">'
	+ '         </div>'
	+ '     </div>'
	+ '  </div>'
	+ '</div>'

	return newHTML;
}

function newPostEditor()
{
	var newPostEditArea = $('#new-post-form');
	var newPostTitle = $('#new-title');
	var newPostBody = $('#new-body');

	$(newPostEditArea).show(ANIMATION_DELAY);

	$('#post-new-post').unbind();
	$('#cancel-new-post').unbind();

	$('#post-new-post').click(function(){
		if (newPostValidator(newPostTitle, newPostBody)){
			postPost($(newPostTitle).val(), $(newPostBody).val(), $("#posts"));
			$(newPostEditArea).hide(ANIMATION_DELAY);
			$(newPostTitle).val("");
			$(newPostBody).val("");
		}
	});

	$('#cancel-new-post').click(function(){
		$(newPostEditArea).hide(ANIMATION_DELAY);
		$(newPostTitle).val("");
		$(newPostBody).val("");

		$("#newPostTitle").removeClass('has-danger');
		$("#new-title-help").text('');
		$("#newPostBody").removeClass('has-danger');
		$("#new-body-help").text('');
	});
}

function newPostValidator(newPostTitle, newPostBody)
{
	var validated = true;
	if ($(newPostTitle).val() == ""){
		$("#newPostTitle").addClass('has-danger');
		$("#new-title-help").text('The Title field must contain a value.');
		validated = false;
	}

	if ($(newPostBody).val() == ""){
		$("#newPostBody").addClass('has-danger');
		$("#new-body-help").text('The Body field must contain a value.');
		validated = false;
	}

	if (validated){
		$("#newPostTitle").removeClass('has-danger');
		$("#new-title-help").text('');
		$("#newPostBody").removeClass('has-danger');
		$("#new-body-help").text('');
	}

	return validated;
}

function postPost(title, body, destinationObject)
{
    wait();
	date = new Date();

	var newReply ={
		"title": title,
		"body": body,
		"datetime": date.toISOString(),
	}

	$.ajax({
		type: "POST",
		url: "http://127.0.0.1:3000/posts",
		dataType: "application/json",
		dataType: 'text',
		data: newReply
	})
	.done(function(data){
		console.log(data);
		$(destinationObject).prepend(generatePostHTML(JSON.parse(data)));
        $("[postid='" + JSON.parse(data).id + "'] .card-header").addClass('add-border');
		stagePostClicks();
        collapseAll($("[postid='" + JSON.parse(data).id + "']"));
	})
	.fail(function(data){
		console.log("AN ERROR OCCURED!");
		console.log(data);

	})
	.always(function(data){
        ready();
	});
}

function postEditor(postObject, postId)
{
	//Get DOM elements
    var postMore = $(postObject).find("button#post-more");
	var postEditButton = $(postObject).find("button#edit-post");
	var postDeleteButton = $(postObject).find("button#delete-post");
	var postCommentButton = $(postObject).find("button#reply-post")
	var editPostSaveButton = $(postObject).find("button#edit-post-save");
	var editPostCancelButton = $(postObject).find("button#edit-post-cancel");
	var postTitle = $(postObject).find("#post-title");
	var tempTitle = $(postTitle).html();
	var postBody = $(postObject).find("#post-body");
	var tempBody = $(postBody).html(); //Stores reply body in case of cancel button.

	//Show approprate buttons
    $(postMore).hide();
	$(postEditButton).hide();
	$(postDeleteButton).hide();
	$(postCommentButton).hide();
	$(editPostSaveButton).show();
	$(editPostCancelButton).show();

	//Make body editable.
	$(postTitle).attr("contenteditable", "true").addClass("form-control");
	$(postBody).attr("contenteditable", "true").focus().addClass("form-control");

	//Set action onclick operations
	$(editPostCancelButton).click(function(){
		$(postBody).attr("contenteditable", "false").blur().removeClass("form-control");
		$(postTitle).attr("contenteditable", "false").blur().removeClass("form-control");
		$(postBody).html(tempBody);
		$(postTitle).html(tempTitle);

		//Revert button state.
        $(postMore).show();
		$(postEditButton).show();
		$(postDeleteButton).show();
		$(postCommentButton).show();
		$(editPostSaveButton).hide();
		$(editPostCancelButton).hide();

		//Revert other states
		$(postObject).find("#posttitle").removeClass('has-danger');
		$(postObject).find("#post-title-help").text('');
		$(postObject).find("#postbody").removeClass('has-danger');
		$(postObject).find("#post-body-help").text('');
	});

	$(editPostSaveButton).click(function(){
		if (postEditValidator(postObject, postTitle, postBody)){
			$(postBody).attr("contenteditable", "false").blur().removeClass("form-control");
			$(postTitle).attr("contenteditable", "false").blur().removeClass("form-control");

			//Revert button state.
            $(postMore).show();
			$(postEditButton).show();
			$(postDeleteButton).show();
			$(postCommentButton).show();
			$(editPostSaveButton).hide();
			$(editPostCancelButton).hide();

			editPost(postId, $(postTitle).html(), $(postBody).html());
		}
	});
}

function postEditValidator(postObject, postTitle, postBody)
{
	var validated = true;
	if ($(postTitle).html() == ""){
		$(postObject).find("#posttitle").addClass('has-danger');
		$(postObject).find("#post-title-help").text('The Title field must contain a value.');
		validated = false;
	}

	if ($(postBody).html() == ""){
		$(postObject).find("#postbody").addClass('has-danger');
		$(postObject).find("#post-body-help").text('The Body field must contain a value.');
		validated = false;
	}

	if (validated){
		$(postObject).find("#posttitle").removeClass('has-danger');
		$(postObject).find("#post-title-help").text('');
		$(postObject).find("#postbody").removeClass('has-danger');
		$(postObject).find("#post-body-help").text('');
	}

	return validated;
}

function editPost(postId, title, body)
{
    wait();
	date = new Date();

	var updatedObj = {
		"body": body,
		"title": title,
		"datetime": date.toISOString()
	}

	$.ajax({
		type:"PATCH",
		url: "http://127.0.0.1:3000/posts/" + postId,
		dataType: "application/json",
		dataType: "text",
		data: updatedObj
	})
	.done(function(data){
		console.log("Patch ran");
	})
	.fail(function (data){
		console.log("AN ERROR OCCURED!");
		console.log(data);
	})
	.always(function (data){
        ready();
	});
}

function deletePostPrompt(postObject, postId)
{
	$("#dialogDelete").data('onDeleteAction', function(){
		deletePost(postId);
		$(postObject).remove();
	}).dialog("open");
}

function deletePost(postId)
{
    wait();
	$.ajax({
		type: "DELETE",
		url: "http://127.0.0.1:3000/posts/" + postId,
		dataType: "application/json",
		dataType: "text"
	})
	.done(function(data){
		console.log("DELETE ran");
		//debugger; //Not sure if still needed.
		$(document).find('div[postid="'+postId+'"]').slideUp(ANIMATION_DELAY, function() {
			$(this).remove();
		});
	})
	.fail(function (data){
		console.log("AN ERROR OCCURED!");
		console.log(data);
	})
	.always(function (data){
        ready();
	});
}

// Replies methods.
function stageReplyClicks()
{
	$('.reply').unbind();

	$('.reply').click(function (e){

		var replyId = $(this).attr("replyId");

		if(e.target.id == "edit-reply")
		{
			replyEditor(this, replyId);
		}

		if(e.target.id == "delete-reply")
		{
			deleteReplyPrompt(this, replyId);
		}
	});
    
    $('.replylink').unbind();
    
    $('.replylink').click(function (e){
        var destination = $(this).attr("destination");
        destination = destination.replace('#','');
        goToReply(destination);
    });
    
    $(".reply-id-link").unbind();
    
    $(".reply-id-link").click(function (e){
        var parent = $(this).parent().parent().parent().parent().parent().parent().parent().parent().parent(); //TODO: Is there a better way? $(this).parent('.post') yields no results.
        var postId = $(parent).attr("postid");
        var replyId = "#" + $(this).val();
        addIDToReply(parent, postId, replyId);
    });
}

function fetchReplies(postId, destination)
{
    wait();
	$(destination).find('.replies').html("");

	$.ajax({
		type: "GET",
		url: "http://127.0.0.1:3000/posts/" + postId + "/replies?_sort=id&_order=DESC",
		dataType: "json"
	})
	.done(function (data){

		selectedPostReplies = data;

		$(selectedPostReplies).each(function() {
			$(destination).find('.replies').append(generateReplyHTML(this));
		});

		stageReplyClicks();

	})
	.fail(function (data){
		console.log("AN ERROR OCCURED!");
		console.log(data);
	})
	.always(function (data){
		scrollToTop(destination);
        ready();
	});

}

function generateReplyHTML(replyObject)
{
	var date = new Date(replyObject.datetime);
	var newHTML = ''
	+ ' <div class="card reply" replyId="' + replyObject.id + '" id="' + replyObject.id + '">'
	+ '     <div class="card-block">'
	+ '         <div class="clearfix">'
	+ '             <div class="float-left">'
	+ '             	<h6 class="card-title"><small>' + dateFormat(date, DATE_FORMAT) + '</small></h6>'
	+ '				</div>'
	+ '				<div class="float-right">'
	+ '                 <div class="btn-group">'
	+ '						<button class="reply-id-link btn btn-link btn-sm" value="' + replyObject.id + '">#' + replyObject.id + '</button>'
	+ '             		<button id="reply-more" type="button" class="btn btn-link btn-sm dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>'
	+ '						<div class="dropdown-menu">'
	+ '            				<button id="edit-reply" class="dropdown-item">Edit Reply</button>'
	+ '             			<button id="delete-reply" data-toggle="modal" data-target="#deletePrompt" data-id="' +replyObject.id+'" data-object="reply" class="dropdown-item">Delete Reply</button>'
	+ '         			</div>'
	+ '					</div>'
	+ '             </div>'
	+ '         </div>'
	+ '         <div id="replybody" class="form-group">'
	+ '			    <div id="reply-body">'
	+                   parseReplyTag(replyObject.body)
	+ ' 		    </div>'
	+ '             <div id="reply-body-help" class="form-control-feedback"></div>'
	+ ' 		</div>'
	+ '         <div class="float-right">'

	+ '             <button id="edit-reply-save" class="btn btn-link" style="display: none;"><i class="material-icons" id="edit-reply-save">check</i></button>'
	+ '             <button id="edit-reply-cancel" class="btn btn-link" style="display: none;"><i class="material-icons" id="delete-reply-cancel">close</i></button>'
	+ '         </div>'
	+ '     </div>'
	+ ' </div>'
	return newHTML;
}

function newReplyEditor(postObject, postId)
{
	var newReplyForm = $(postObject).find('#reply-controls');
	var newReplyBody = $(postObject).find('#reply-box');
	var newReplyDestination = $(postObject).find(".replies");
	var newReplySaveButton = $(postObject).find('#new-reply-save');
	var newReplyCancelButton = $(postObject).find('#new-reply-cancel');

	$(newReplyForm).show(ANIMATION_DELAY, function () {
		newReplyBody.focus();
	});

	$(newReplySaveButton).unbind();
	$(newReplyCancelButton).unbind();

	$(newReplySaveButton).click(function(e){
		if(postReplyValidate(postObject, newReplyBody))
		{
			postReply(postId, $(newReplyBody).val(), newReplyDestination);
			$(newReplyForm).hide(ANIMATION_DELAY);
            $(newReplyBody).val("");
		}
	});

	$(newReplyCancelButton).click(function(){
		$(newReplyForm).hide(ANIMATION_DELAY);
		$(postObject).find('#replybox').removeClass("has-danger");
		$(postObject).find('#reply-box-help').text('');
        $(newReplyBody).val("");
	});
}

function postReplyValidate(postObject, replyBody)
{
	if ($(replyBody).val() == "")
	{
		$(postObject).find('#replybox').addClass("has-danger");
		$(postObject).find('#reply-box-help').text("The Reply field must contain a value.");
		return false;
	}
	else
	{
		$(postObject).find('#replybox').removeClass("has-danger");
		$(postObject).find('#reply-box-help').text('');
	}
	return true;
}

function postReply(postId, body, destinationObject)
{
    wait();
    
	date = new Date();

	var newReply ={
		"postId": postId,
		"body": body,
		"datetime": date.toISOString(),
	}

	$.ajax({
		type: "POST",
		url: "http://127.0.0.1:3000/replies",
		dataType: "application/json",
		dataType: 'text',
		data: newReply
	})
	.done(function(data){
		console.log(data);
		$(destinationObject).prepend(generateReplyHTML(JSON.parse(data)));
		stageReplyClicks();
	})
	.fail(function(data){
		console.log("AN ERROR OCCURED!");
		console.log(data);

	})
	.always(function(data){
        ready();
	});
}

function replyEditor(replyObject, replyId)
{
	//Get DOM elements
    var replyMore = $(replyObject).find("button#reply-more");
	var replyEditButton = $(replyObject).find("button#edit-reply");
	var replyDeleteButton = $(replyObject).find("button#delete-reply");
	var editReplySaveButton = $(replyObject).find("button#edit-reply-save");
	var editReplyCancelButton = $(replyObject).find("button#edit-reply-cancel");
	var replyBody = $(replyObject).find("#reply-body");
	var tempBody = $(replyBody).html(); //Stores reply body in case of cancel button.
    
    replyBody.find("a.replylink").contents().unwrap();//Strips link tag when editing.

	//Show approprate buttons
    $(replyMore).hide();
	$(replyEditButton).hide();
	$(replyDeleteButton).hide();
	$(editReplySaveButton).show();
	$(editReplyCancelButton).show();

	//Make body editable.
	$(replyBody).attr("contenteditable", "true").focus().addClass('form-control');

    
    //Unstage onclicks
    $(editReplyCancelButton).unbind();
    $(editReplySaveButton).unbind();
    
	//Set action onclick operations
	$(editReplyCancelButton).click(function(){
		$(replyBody).attr("contenteditable", "false").blur().removeClass('form-control');
		$(replyBody).html(tempBody);

		//Revert button state.
        $(replyMore).show();
		$(replyEditButton).show();
		$(replyDeleteButton).show();
		$(editReplySaveButton).hide();
		$(editReplyCancelButton).hide();

		$(replyObject).find('#replybody').removeClass("has-danger");
		$(replyObject).find('#reply-body-help').text('').removeClass("has-danger");
        
        stageReplyClicks();
	});

	$(editReplySaveButton).click(function(e){        
		if (replyEditValidate(replyObject, replyBody)){
			$(replyBody).attr("contenteditable", "false").blur().removeClass('form-control');

			//Revert button state.
            $(replyMore).show();
			$(replyEditButton).show();
			$(replyDeleteButton).show();
			$(editReplySaveButton).hide();
			$(editReplyCancelButton).hide();

            var newBody = $(replyBody).html();
			editReply(replyId, newBody);            
            $(replyBody).html(parseReplyTag(newBody));
                        
            stageReplyClicks();
		}
	});
}

function replyEditValidate(replyObject, replyBody)
{
	if ($(replyBody).html() == "")
	{
		$(replyObject).find('#replybody').addClass("has-danger");
		$(replyObject).find('#reply-body-help').text("The Reply field must contain a value.").addClass("has-danger");
		return false;
	}
	else
	{
		$(replyObject).find('#replybody').removeClass("has-danger");
		$(replyObject).find('#reply-body-help').text('').removeClass("has-danger");
	}
	return true;
}

function editReply(replyId, body)
{
    wait();
	date = new Date();

	var updatedObj = {
		"body": body,
		"datetime": date.toISOString()
	}

	$.ajax({
		type:"PATCH",
		url: "http://127.0.0.1:3000/replies/" + replyId,
		dataType: "application/json",
		dataType: "text",
		data: updatedObj
	})
	.done(function(data){
		console.log("Patch ran");
	})
	.fail(function (data){
		console.log("AN ERROR OCCURED!");
		console.log(data);
	})
	.always(function (data){
        ready();
	});
}

function deleteReplyPrompt(replyObject, replyId)
{
	$("#dialogDelete").data('onDeleteAction', function(){
		deleteReply(replyId);
		$(replyObject).remove();
	}).dialog("open");
}

function deleteReply(replyId)
{
    wait();
	$.ajax({
		type: "DELETE",
		url: "http://127.0.0.1:3000/replies/" + replyId,
		dataType: "application/json",
		dataType: "text"
	})
	.done(function(data){
		console.log("DELETE ran");
		$(document).find('div[replyid="'+replyId+'"]').slideUp(ANIMATION_DELAY, function() {
			$(this).remove();
		});
	})
	.fail(function (data){
		console.log("AN ERROR OCCURED!");
		console.log(data);
	})
	.always(function (data){
        ready();
	});
}

function collapseAll(excludeObject)
{
	var exclude = $(excludeObject).find("#post-content"),
		excludedHeader = $(excludeObject).find('.card-header');

	$(".post #post-content").not(exclude).hide(ANIMATION_DELAY);
	$('.post .card-header').not(excludedHeader).removeClass('add-border');
    $(exclude).show(ANIMATION_DELAY);
}

function collapseThis(postObject)
{
    $(postObject).find("#post-content").hide(ANIMATION_DELAY);
}

function scrollToTop(selectedObject)
{
	setTimeout(function () {
		$('html, body').animate({
			scrollTop: $(selectedObject).offset().top
		}, ANIMATION_DELAY);
	}, ANIMATION_DELAY);
}

function addIDToReply(postObject, postId, replyId)
{
	var newReplyForm = $(postObject).find('#reply-controls');
    
    if (!newReplyForm.is(':visible')) {
		newReplyEditor(postObject, postId);
	}

    var replyBox = newReplyForm.find("#reply-box");
	var current = $(replyBox).val();
    $(replyBox).val(current + replyId + ' ');
    scrollToTop($(replyBox).parent());
}

function parseReplyTag(postBody)
{
	return postBody.replace(/(\#[0-9]+)/g, '<a class="replylink" href="$1" destination="$1">$1</a>')
	.replace(/\r?\n/g, '<br />');
}

function goToReply(reply)
{
    
    var parentPost = -1;
    var replyId = -1;
    $.ajax({
		type: "GET",
		url: "http://127.0.0.1:3000/replies/" + reply,
		dataType: "json"
	})
	.done(function (data){
        parentPost = data.postId;
        replyId = data.id;
	})
	.fail(function (data){
		console.log("AN ERROR OCCURED!");
		console.log(data);
	})
	.always(function (data){
		if (parentPost >= 0)
            {
                var selectedPost = $("[postid='" + parentPost + "']");
                var selectedReply;
                collapseAll(selectedPost);
                fetchReplies(parentPost, selectedPost);
                
                setTimeout(function () {
                    selectedReply = $("[replyid='" + replyId + "']");
                    $('html, body').animate({
                        scrollTop: $(selectedReply).offset().top
                    }, ANIMATION_DELAY);
                }, ANIMATION_DELAY+ANIMATION_DELAY+ANIMATION_DELAY);
            }
	});
}

function ready()
{
    $('#loader').hide(ANIMATION_DELAY);
}

function wait()
{
    $('#loader').show(ANIMATION_DELAY);
}
