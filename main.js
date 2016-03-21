function parseParams (search) {
	search = search.replace(/^\?/,'');
	var params = {};
	if (search) {
		search = search.replace(/\+/g,' ').replace(/\//g,'\n').split("&");
		for (var i = 0; i < search.length; ++ i) {
			var pair = search[i].split("=");
			params[decodeURIComponent(pair[0])] = decodeURIComponent(pair.slice(1).join("="));
		}
	}
	return params;
}

function makeParams (params) {
	var buf = [];
	for (var name in params) {
		buf.push(encodeURIComponent(name)+'='+encodeURIComponent(params[name]));
	}
	return buf.sort().join('&').replace(/%20/g,'+').replace(/%0A/gi,'/');
}

function updateStyle() {
	var size = Number(document.getElementById("font_size").value);
	var unit = document.getElementById("font_size_unit").value;
	var family = document.getElementById("font_family").value;
	var editor = document.getElementById("editor");
	editor.style.fontSize = size+unit;
	editor.style.fontFamily = '"'+family+'", monospace';
}

var last_cursor = null;
function init() {
	var editor = document.getElementById("editor");
	updateStyle();

	var params = parseParams(location.search);

	if (params.readonly === 'true') {
		editor.contentEditable = 'false';
		document.body.className = 'readonly';
	}

	if (params.size) {
		var match = /^\s*(\d+(?:\.\d*)?)(\w+)?\s*$/.exec(params.size);
		var size = Number(match[1]);
		var unit = match[2]||'px';
		document.getElementById("font_size").value = size;
		document.getElementById("font_size_unit").value = unit;
		editor.style.fontSize = size+unit;
	}

	if (params.family) {
		document.getElementById("font_family").value = params.family;
		editor.style.fontFamily = '"'+params.family+'", monospace';
	}

	if (params.tabs) {
		editor.innerHTML = '';
		editor.appendChild(document.createTextNode(params.tabs));
	}

	if (window !== parent) {
		var link = document.createElement("a");
		link.className = "embed-link";
		link.target = "_top";
		link.href = shareUrl();

		var img = new Image();
		img.src = "app/ocarina_tabs/icon16.png";
		img.alt = "";
		link.appendChild(img);
		link.appendChild(document.createTextNode(" "+document.title));
		document.body.appendChild(link);
	}

	if (window.chrome && window.chrome.app && !window.chrome.app.isInstalled) {
//		document.getElementById("install_app").style.display = "";
	}

	editor.addEventListener("paste", function (event) {
		event.preventDefault();

		var text = event.clipboardData.getData("text/plain");
		document.execCommand('insertText', false, text);
	}, false);

	editor.addEventListener("drop", function (event) {
		event.preventDefault();

		var text = event.dataTransfer.getData("text/plain");
		document.execCommand('insertText', false, text);
	}, false);

	editor.addEventListener("blur", function (event) {
		last_cursor = getSelectionRange();
	}, true);
	
	editor.addEventListener("focus", function (event) {
		last_cursor = null;
	}, true);

	var full_notes = document.getElementById("full_notes");
	var other_notes = document.getElementById("other_notes");

	var full_keys = ["A","C","D","F","H","I","K","M","O","P","R","T","U"];
	var full_labels = ["A","B","C","D","E","F","G","A²","B²","C²","D²","E²","F²"];

	var other_keys = ["B","E","G","J","L","N","Q","S"," ","-","\n"];
	var other_labels = ["A#","C#","D#","F#","G#","A#²","C#²","D#²","\u00a0","–","\u21B5"];

	addButtons(full_notes, full_keys, full_labels);
	addButtons(other_notes, other_keys, other_labels);

	editor.focus();

	window.addEventListener("click", function (event) {
		var menu = document.querySelector("#save-as-dropdown .dropdown-menu");
		var arrow = document.querySelector("#save-as-dropdown .dropdown-button-arrow");

		if (event.target !== menu && !menu.contains(event.target) &&
			event.target !== arrow && !arrow.contains(event.target)) {
			menu.style.display = 'none';
		}
		
	}, false);
}

function addButtons (parent, keys, labels) {
	for (var i = 0; i < keys.length; ++ i) {
		var key = keys[i];
		var label = labels[i];
		var button = document.createElement("button");
		button.className = "btn";
		button.type = "button";
		button.title = key;
		button.appendChild(document.createTextNode(label));
		button.addEventListener("click", makeInserter(key), false);
		parent.appendChild(button);
		parent.appendChild(document.createTextNode(' '));
	}
}

function makeInserter (key) {
	var editor = document.getElementById("editor");

	return function (event) {
		var cursor = last_cursor;
		if (cursor && document.activeElement !== editor) {
			editor.focus();
			setSelectionRange(cursor);
		}

		if (document.activeElement !== editor) {
			editor.focus();
			setCursorToEnd(editor);
		}

		document.execCommand('insertText', false, key);
	};
}

function getSelectionRange () {
	if (window.getSelection) {
		var sel = window.getSelection();
		if (sel.getRangeAt && sel.rangeCount) {
			return sel.getRangeAt(0);
		}
	}
	else if (document.selection && document.selection.createRange) {
		return document.selection.createRange();
	}
	return null;
}

function setSelectionRange (range) {
	if (range) {
		if (window.getSelection) {
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
		}
		else if (document.selection && range.select) {
			range.select();
		}
	}
}

function formValues () {
	var size = Number(document.getElementById("font_size").value);
	var unit = document.getElementById("font_size_unit").value;
	var family = document.getElementById("font_family").value;
	var editor = document.getElementById("editor");
	return {
		tabs: getPlainText(editor),
		size: size+unit,
		family: family
	};
}

function shareUrl () {
	return location.href.replace(/[#\?].*/,'').replace(/^http:/,'https:') + '?' + makeParams(formValues());
}

function shareLink () {
	prompt("Share-Link:", shareUrl());
}

var HTML_CHARS = {
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'&': '&amp;'
};

function escapeHtml (s) {
	return s.replace(/[<>"&]/g, function (ch) {
		return HTML_CHARS[ch];
	});
}

function shareEmbed () {
	prompt("Embed-Code:", '<iframe src="'+escapeHtml(shareUrl())+
		'" style="width:800px;height:800px;border:1px solid lightgray;border-radius:5px;"></iframe>');
}

function getPlainText (element) {
	var buf = [];
	_getPlainText(element, buf);
	return buf.join("");
}

function _getPlainText (element, buf) {
	for (var el = element.firstChild; el; el = el.nextSibling) {
		if (el.nodeType === 1) {
			if (buf.length > 0 && buf[buf.length - 1] !== "\n") {
				buf.push("\n");
			}

			if (el.nodeName !== "STYLE" && el.nodeName !== "SCRIPT") {
				if (el.nodeName === "BR") {
					buf.push("\n");
				}
				else {
					_getPlainText(el, buf);
					if (buf.length > 0 && buf[buf.length - 1] !== "\n" && el.nextSibling) {
						var display = getComputedStyle(el, null).getPropertyValue("display");
						if (display !== "inline" && display !== "inline-block") {
							buf.push("\n");
						}
					}
				}
			}
		}
		else if (el.nodeType === 3) {
			buf.push(el.textContent);
		}
	}
}

function saveUrlAs (url, filename) {
	var link = document.createElement("a");

	link.setAttribute("download", filename||"");
	link.href = url;
	link.style.visibility = 'hidden';
	link.style.position = 'absolute';
	link.style.right = '0';
	link.style.bottom = '0';
	document.body.appendChild(link);

	link.click();

	document.body.removeChild(link);
}

function saveCanvasImage (canvas, filename, type) {
	if (canvas.toBlob) {
		canvas.toBlob(function (blob) {
			var url = URL.createObjectURL(blob);
			saveUrlAs(url, filename);
			setTimeout(function () {
				URL.revokeObjectURL(url);
			}, 0);
		}, type);
	}
	else {
		var url = canvas.toDataURL(type);
		saveUrlAs(url, filename);
	}
}

function saveAsImage () {
	var size = Number(document.getElementById("font_size").value);
	var unit = document.getElementById("font_size_unit").value;
	var family = document.getElementById("font_family").value;
	var editor = document.getElementById("editor");
	var lines = getPlainText(editor).split("\n");
	var canvas = document.createElement("canvas");
	canvas.width  = Math.max(editor.offsetWidth, editor.scrollWidth||0);
	canvas.height = Math.max(editor.offsetHeight, editor.scrollHeight||0);

	var ctx = canvas.getContext("2d");
	var line_width = 0;
	var font = size+unit+" '"+family+"', monospace";
	ctx.font = font;
	ctx.textBaseline = "top";

	for (var i = 0; i < lines.length; ++ i) {
		var metrics = ctx.measureText(lines[i]);
		if (metrics.width > line_width) {
			line_width = metrics.width;
		}
	}

	var measureEl = document.createElement("div");
	var style = getComputedStyle(editor, null);

	measureEl.style.font = style.getPropertyValue("font");
	measureEl.style.lineHeight = style.getPropertyValue("line-height");
	measureEl.style.whiteSpace = "nowrap";
	measureEl.style.visibility = "hidden";
	measureEl.style.position = "absolute";
	measureEl.style.right = "0";
	measureEl.style.bottom = "0";
	measureEl.appendChild(document.createTextNode("A- "));
	document.body.appendChild(measureEl);
	var line_height = measureEl.offsetHeight;
	document.body.removeChild(measureEl);

	canvas.width  = line_width + 40;
	canvas.height = line_height * lines.length + 40;

	ctx = canvas.getContext("2d");
	ctx.font = font;
	ctx.textBaseline = "top";

	ctx.fillStyle = '#FFFFFF';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = '#000000';

	var y = 20;
	for (var i = 0; i < lines.length; ++ i) {
		var line = lines[i];
		ctx.fillText(line, 20, y);
		y += line_height;
	}

	saveCanvasImage(canvas, "12_hole_ocarina_tabs.png", "image/png");
	saveAsFile = saveAsImage;
}

function saveAsTextFile () {
	var editor = document.getElementById("editor");
	var text = getPlainText(editor);
	var blob = new Blob([text], {type : 'text/plain;charset=UTF-8'});

	var url = URL.createObjectURL(blob);
	saveUrlAs(url, "12_hole_ocarina_tabs.txt");
	setTimeout(function () {
		URL.revokeObjectURL(url);
	}, 0);

	saveAsFile = saveAsTextFile;
}

var saveAsFile = saveAsImage;

function openTextFile (input) {
	var editor = document.getElementById("editor");

	var file = input.files[input.files.length - 1];
	var reader = new FileReader();
	reader.onload = function () {
		var text = reader.result;
		editor.focus();
		document.execCommand('selectAll', false, null);
		document.execCommand('insertText', false, text);
	};
	reader.onerror = function () {
		alert(this.error);
	}
	reader.readAsText(file);

	// clear input
	var new_input = document.createElement("input");
	new_input.type = "file";
	new_input.addEventListener("change", function (event) {
		openTextFile(this);
	}, false);
	input.parentNode.replaceChild(input, new_input);
}

function toggleMenu (id) {
	var menu = document.querySelector("#"+id+" .dropdown-menu");
	if (menu.style.display === 'block') {
		menu.style.display = 'none';
	}
	else {
		menu.style.display = 'block';
	}
}

function hideMenu (id) {
	var menu = document.querySelector("#"+id+" .dropdown-menu");
	menu.style.display = 'none';
}

// Derived from: http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity
var VOID_NODES = {
	AREA: true,
	BASE: true,
	BR: true,
	COL: true,
	EMBED: true,
	HR: true,
	IMG: true,
	INPUT: true,
	KEYGEN: true,
	LINK: true,
	MENUITEM: true,
	META: true,
	PARAM: true,
	SOURCE: true,
	TRACK: true,
	WBR: true,
	BASEFONT: true,
	BGSOUND: true,
	FRAME: true,
	ISINDEX: true
};

function canContainText (node) {
	return node.nodeType === 1 && VOID_NODES[node.nodeName] !== true;
}

function getLastChildElement (el) {
	var lc = el.lastChild;
	while (lc && lc.nodeType !== 1) {
		if (lc.previousSibling)
			lc = lc.previousSibling;
		else
			break;
	}
	return lc;
}

function setCursorToEnd (element) {
	for (;;) {
		var lc = getLastChildElement(element);

		if (!lc || !canContainText(lc))
			break;

		element = lc;
	}

	var range, selection;
	if (document.createRange) { // Firefox, Chrome, Opera, Safari, IE 9+
		range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
	else if (document.selection) { // IE 8 and lower
		range = document.body.createTextRange();
		range.moveToElementText(element);
		range.collapse(false);
		range.select();
	}
}

function installApp () {
	if (window.chrome) {
		window.location = "https://panzi.github.io/ocarina_tabs/app/ocarina_tabs.crx";
	}
}

function undoEdit () {
	document.execCommand("undo", false, null);
}

function redoEdit () {
	document.execCommand("redo", false, null);
}
