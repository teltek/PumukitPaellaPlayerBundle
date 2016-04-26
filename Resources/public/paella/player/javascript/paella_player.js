/*** File: src/00_base.js ***/
/*  
	Paella HTML 5 Multistream Player
	Copyright (C) 2013  Universitat Politècnica de València

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
var GlobalParams = {
	video:{zIndex:1},
	background:{zIndex:0}
};


var paella = {};
paella.player = null;

paella.events = {
	play:"paella:play",
	pause:"paella:pause",
	next:"paella:next",
	previous:"paella:previous",
	seeking:"paella:seeking",
	seeked:"paella:seeked",
	timeupdate:"paella:timeupdate",
	timeUpdate:"paella:timeupdate",
	seekTo:"paella:setseek",
	endVideo:"paella:endvideo",
	seekToFrame:"paella:seektotime",	// deprecated, use seekToTime instead
	seekToTime:"paella:seektotime",
	setTrim:"paella:settrim",
	showEditor:"paella:showeditor",
	hideEditor:"paella:hideeditor",
	setPlaybackRate:"paella:setplaybackrate",
	setVolume:'paella:setVolume',
	setComposition:'paella:setComposition',
	loadStarted:'paella:loadStarted',
	loadComplete:'paella:loadComplete',
	loadPlugins:'paella:loadPlugins',
	error:'paella:error',
	setProfile:'paella:setprofile',
	documentChanged:'paella:documentChanged',
	didSaveChanges:'paella:didsavechanges',
	controlBarWillHide:'paella:controlbarwillhide',
	controlBarDidHide:'paella:controlbardidhide',
	controlBarDidShow:'paella:controlbardidshow',
	///beforeUnload:'paella:beforeUnload',		This event has been removed because it not work properly in any browser
	hidePopUp:'paella:hidePopUp',
	showPopUp:'paella:showPopUp',
	//userTracking:'paella:userTracking',		Event replaced by the new paella.userTracking service
	enterFullscreen:'paella:enterFullscreen',
	exitFullscreen:'paella:exitFullscreen',
	resize:'paella:resize',		// params: { width:paellaPlayerContainer width, height:paellaPlayerContainer height }
	
	singleVideoReady:'paella:singleVideoReady',
	singleVideoUnloaded:'paella:singleVideoUnloaded',
	videoReady:'paella:videoReady',
	videoUnloaded:'paella:videoUnloaded',
	
	controlBarLoaded:'paella:controlBarLoaded',	
	
	flashVideoEvent:'paella:flashVideoEvent',
	
	captionAdded: 'paella:caption:add', // Event triggered when new caption is available.
	captionsEnabled: 'paella:caption:enabled',  // Event triguered when a caption es enabled.
	captionsDisabled: 'paella:caption:disabled',  // Event triguered when a caption es disabled.
	

	trigger:function(event,params) { $(document).trigger(event,params); },
	bind:function(event,callback) { $(document).bind(event,function(event,params) { callback(event,params);}); },
	
	setupExternalListener:function() {
		window.addEventListener("message", function(event) {
			paella.events.trigger(event.data.event,event.data.params);
		}, false);
	}
};

paella.events.setupExternalListener();

/*** File: src/01_utils.js ***/

// Paella Mouse Manager
///////////////////////////////////////////////////////
Class ("paella.MouseManager", {
	targetObject:null,

	initialize:function() {
		var thisClass = this;
		paella.events.bind('mouseup',function(event) { thisClass.up(event); });
		paella.events.bind('mousemove',function(event) { thisClass.move(event); });
		paella.events.bind('mouseover',function(event) { thisClass.over(event); });
	},

	down:function(targetObject,event) {
		this.targetObject = targetObject;
		if (this.targetObject && this.targetObject.down) {
			this.targetObject.down(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	},

	up:function(event) {
		if (this.targetObject && this.targetObject.up) {
			this.targetObject.up(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		this.targetObject = null;
		return false;
	},

	out:function(event) {
		if (this.targetObject && this.targetObject.out) {
			this.targetObject.out(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	},

	move:function(event) {
		if (this.targetObject && this.targetObject.move) {
			this.targetObject.move(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	},

	over:function(event) {
		if (this.targetObject && this.targetObject.over) {
			this.targetObject.over(event,event.pageX,event.pageY);
			event.cancelBubble = true;
		}
		return false;
	}
});


// paella.utils
///////////////////////////////////////////////////////
paella.utils = {	
	mouseManager: new paella.MouseManager(),
	
	folders: {
		get: function(folder) {
			if (paella.player && paella.player.config && paella.player.config.folders && paella.player.config.folders[folder]) {
				return paella.player.config.folders[folder];	
			}
			return undefined;			
		},
		
		profiles: function() {
			return paella.utils.folders.get("profiles") || "config/profiles";			
		},
		
		resources: function() {
			return paella.utils.folders.get("resources") || "resources";			
		},
		
		skins: function() {
			return paella.utils.folders.get("skins") || paella.utils.folders.get("resources") + "/style";			
		}
	},
	
	styleSheet: {
		removeById:function(id) {
			var outStyleSheet = $(document.head).find('#' + id)[0];
			if (outStyleSheet) {
				document.head.removeChild(outStyleSheet);
			}
		},
		
		remove:function(fileName) {
			var links = document.head.getElementsByTagName('link');
			for (var i =0; i<links.length; ++i) {
				if (links[i].href) {
					document.head.removeChild(links[i]);
					break;
				}
			}
		},
		
		add:function(fileName,id) {
			var link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = fileName;
			link.type = 'text/css';
			link.media = 'screen';
			link.charset = 'utf-8';
			if (id) link.id = id;
			document.head.appendChild(link);
		},
		
		swap:function(outFile,inFile) {
			this.remove(outFile);
			this.add(inFile);
		}
	},
	
	skin: {
		set:function(skinName) {
			var skinId = 'paellaSkin';
			paella.utils.styleSheet.removeById(skinId);
			paella.utils.styleSheet.add(paella.utils.folders.skins() + '/style_' + skinName + '.css');
			base.cookies.set("skin",skinName);
		},
		
		restore:function(defaultSkin) {
			var storedSkin = base.cookies.get("skin");
			if (storedSkin && storedSkin!="") {
				this.set(storedSkin);
			}
			else {
				this.set(defaultSkin);
			}
		}
	},

	timeParse:{
		timeToSeconds:function(timeString) {
			var hours = 0;
			var minutes = 0;
			var seconds =0;
			if (/([0-9]+)h/i.test(timeString)) {
				hours = parseInt(RegExp.$1) * 60 * 60;
			}
			if (/([0-9]+)m/i.test(timeString)) {
				minutes = parseInt(RegExp.$1) * 60;
			}
			if (/([0-9]+)s/i.test(timeString)) {
				seconds = parseInt(RegExp.$1);
			}
			return hours + minutes + seconds;
		},
	
		secondsToTime:function(seconds) {
			var hrs = ~~ (seconds / 3600);
			if (hrs<10) hrs = '0' + hrs;
			var mins = ~~ ((seconds % 3600) / 60);
			if (mins<10) mins = '0' + mins;
			var secs = Math.floor(seconds % 60);
			if (secs<10) secs = '0' + secs;
			return hrs + ':' + mins + ':' + secs;
		},
		secondsToText:function(secAgo) {
			// Seconds
			if (secAgo <= 1) {
				return base.dictionary.translate("1 second ago");
			}
			if (secAgo < 60) {
				return base.dictionary.translate("{0} seconds ago").replace(/\{0\}/g, secAgo);
			}
			// Minutes
			var minAgo = Math.round(secAgo/60);
			if (minAgo <= 1) {
				return base.dictionary.translate("1 minute ago");
			}
			if (minAgo < 60) {
				return base.dictionary.translate("{0} minutes ago").replace(/\{0\}/g, minAgo);
			}
			//Hours
			var hourAgo = Math.round(secAgo/(60*60));
			if (hourAgo <= 1) {
				return base.dictionary.translate("1 hour ago");
			}
			if (hourAgo < 24) {
				return base.dictionary.translate("{0} hours ago").replace(/\{0\}/g, hourAgo);
			}
			//Days
			var daysAgo = Math.round(secAgo/(60*60*24));
			if (daysAgo <= 1) {
				return base.dictionary.translate("1 day ago");
			}
			if (daysAgo < 24) {
				return base.dictionary.translate("{0} days ago").replace(/\{0\}/g, daysAgo);
			}
			//Months
			var monthsAgo = Math.round(secAgo/(60*60*24*30));
			if (monthsAgo <= 1) {
				return base.dictionary.translate("1 month ago");
			}
			if (monthsAgo < 12) {
				return base.dictionary.translate("{0} months ago").replace(/\{0\}/g, monthsAgo);
			}
			//Years
			var yearsAgo = Math.round(secAgo/(60*60*24*365));
			if (yearsAgo <= 1) {
				return base.dictionary.translate("1 year ago");
			}
			return base.dictionary.translate("{0} years ago").replace(/\{0\}/g, yearsAgo);
		},
		matterhornTextDateToDate: function(mhdate) {
			var d = new Date();
			d.setFullYear(parseInt(mhdate.substring(0, 4), 10));
			d.setMonth(parseInt(mhdate.substring(5, 7), 10) - 1);
			d.setDate(parseInt(mhdate.substring(8, 10), 10));
			d.setHours(parseInt(mhdate.substring(11, 13), 10));
			d.setMinutes(parseInt(mhdate.substring(14, 16), 10));
			d.setSeconds(parseInt(mhdate.substring(17, 19), 10));

			return d;
		}
	}	
};




Class ("paella.DataDelegate", {
	// onSuccess => function(response,readStatus)
	read:function(context,params,onSuccess) {
		// TODO: read key with context
		if (typeof(onSuccess)=='function') {
			onSuccess({},true);
		}
	},

	// onSuccess => function(response,writeStatus)
	write:function(context,params,value,onSuccess) {
		// TODO: write key with context
		if(typeof(onSuccess)=='function') {
			onSuccess({},true);
		}
	},

	remove:function(context,params,onSuccess) {
		// TODO: write key with context
		if(typeof(onSuccess)=='function') {
			onSuccess({},true);
		}
	}
});

paella.dataDelegates = {};

Class ("paella.dataDelegates.CookieDataDelegate", paella.DataDelegate, {
	initialize:function() {
	},

	serializeKey:function(context,params) {
		if (typeof(params)=='object') params = JSON.stringify(params);
		return context + '|' + params;
	},

	read:function(context,params,onSuccess) {
		var key = this.serializeKey(context,params);
		var value = base.cookies.get(key);
		try {
			value = unescape(value);
			value = JSON.parse(value);
		}
		catch (e) {}
		if (typeof(onSuccess)=='function') {
			onSuccess(value,true);
		}
	},

	write:function(context,params,value,onSuccess) {
		var key = this.serializeKey(context,params);
		if (typeof(value)=='object') value = JSON.stringify(value);
		value = escape(value);
		base.cookies.set(key,value);
		if(typeof(onSuccess)=='function') {
			onSuccess({},true);
		}
	},

	remove:function(context,params,onSuccess) {
		var key = this.serializeKey(context,params);
		if (typeof(value)=='object') value = JSON.stringify(value);
		base.cookies.set(key,'');
		if(typeof(onSuccess)=='function') {
			onSuccess({},true);
		}

	}
});

paella.dataDelegates.DefaultDataDelegate = paella.dataDelegates.CookieDataDelegate;


Class ("paella.Data", {
	enabled:false,
	dataDelegates:{},

	initialize:function(config) {
		this.enabled = config.data.enabled;
		for (var key in config.data.dataDelegates) {
			try {
				var delegateName = config.data.dataDelegates[key];
				var DelegateClass = paella.dataDelegates[delegateName];
				var delegateInstance = new DelegateClass();
				this.dataDelegates[key] = delegateInstance;
			}
			catch (e) {
				base.log.debug("Warning: delegate not found - " + delegateName);
			}
		}
		if (!this.dataDelegates["default"]) {
			this.dataDelegates["default"] = new paella.dataDelegates.DefaultDataDelegate();
		}
	},

	read:function(context,key,onSuccess) {
		var del = this.getDelegate(context);
		del.read(context,key,onSuccess);
	},

	write:function(context,key,params,onSuccess) {
		var del = this.getDelegate(context);
		del.write(context,key,params,onSuccess);
	},

	remove:function(context,key,onSuccess) {
		var del = this.getDelegate(context);
		del.remove(context,key,onSuccess);
	},

	getDelegate:function(context) {
		if (this.dataDelegates[context]) return this.dataDelegates[context];
		else return this.dataDelegates["default"];
	}
});

// Will be initialized inmediately after loading config.json, in PaellaPlayer.onLoadConfig()
paella.data = null;

Class ("paella.MessageBox", {
	modalContainerClassName:'modalMessageContainer',
	frameClassName:'frameContainer',
	messageClassName:'messageContainer',
	errorClassName:'errorContainer',
	currentMessageBox:null,
	messageContainer:null,
	onClose:null,

	initialize:function() {
		var thisClass = this;
		$(window).resize(function(event) { thisClass.adjustTop(); });
	},

	showFrame:function(src,params) {
		var closeButton = true;
		var width = "80%";
		var height = "80%";
		var onClose = null;
		if (params) {
			closeButton = params.closeButton;
			width = params.width;
			height = params.height;
			onClose = params.onClose;
		}

		this.doShowFrame(src,closeButton,width,height,onClose);
	},

	doShowFrame:function(src,closeButton,width,height,onClose) {
		this.onClose = onClose;

		if (this.currentMessageBox) {
			this.close();
		}

		if (!width) { width = '80%'; }

		if (!height) { height = '80%'; }

		var modalContainer = document.createElement('div');
		modalContainer.className = this.modalContainerClassName;
		modalContainer.style.position = 'fixed';
		modalContainer.style.top = '0px';
		modalContainer.style.left = '0px';
		modalContainer.style.right = '0px';
		modalContainer.style.bottom = '0px';
		modalContainer.style.zIndex = 999999;

		var messageContainer = document.createElement('div');
		messageContainer.className = this.frameClassName;
		messageContainer.style.width = width;
		messageContainer.style.height = height;
		messageContainer.style.position = 'relative';
		modalContainer.appendChild(messageContainer);

		var iframeContainer = document.createElement('iframe');
		iframeContainer.src = src;
		iframeContainer.setAttribute("frameborder", "0");
		iframeContainer.style.width = "100%";
		iframeContainer.style.height = "100%";
		messageContainer.appendChild(iframeContainer);

		$('body')[0].appendChild(modalContainer);

		this.currentMessageBox = modalContainer;
		this.messageContainer = messageContainer;
		var thisClass = this;
		this.adjustTop();

		if (closeButton) {
			this.createCloseButton();
		}
	},

	showElement:function(domElement,params) {
		var closeButton = true;
		var width = "60%";
		var height = "40%";
		var onClose = null;
		var className = this.messageClassName;
		if (params) {
			className = params.className;
			closeButton = params.closeButton;
			width = params.width;
			height = params.height;
			onClose = params.onClose;
		}

		this.doShowElement(domElement,closeButton,width,height,className,onClose);
	},

	showMessage:function(message,params) {
		var closeButton = true;
		var width = "60%";
		var height = "40%";
		var onClose = null;
		var className = this.messageClassName;
		if (params) {
			className = params.className;
			closeButton = params.closeButton;
			width = params.width;
			height = params.height;
			onClose = params.onClose;
		}

		this.doShowMessage(message,closeButton,width,height,className,onClose);
	},

	doShowElement:function(domElement,closeButton,width,height,className,onClose) {
		this.onClose = onClose;

		if (this.currentMessageBox) {
			this.close();
		}
		if (!className) className = this.messageClassName;

		if (!width) { width = '80%'; }

		if (!height) { height = '30%'; }

		var modalContainer = document.createElement('div');
		modalContainer.className = this.modalContainerClassName;
		modalContainer.style.position = 'fixed';
		modalContainer.style.top = '0px';
		modalContainer.style.left = '0px';
		modalContainer.style.right = '0px';
		modalContainer.style.bottom = '0px';
		modalContainer.style.zIndex = 999999;

		var messageContainer = document.createElement('div');
		messageContainer.className = className;
		messageContainer.style.width = width;
		messageContainer.style.height = height;
		messageContainer.style.position = 'relative';
		messageContainer.appendChild(domElement);
		modalContainer.appendChild(messageContainer);

		$('body')[0].appendChild(modalContainer);

		this.currentMessageBox = modalContainer;
		this.messageContainer = messageContainer;
		var thisClass = this;
		this.adjustTop();

		if (closeButton) {
			this.createCloseButton();
		}
	},

	doShowMessage:function(message,closeButton,width,height,className,onClose) {
		this.onClose = onClose;

		if (this.currentMessageBox) {
			this.close();
		}
		if (!className) className = this.messageClassName;

		if (!width) { width = '80%'; }

		if (!height) { height = '30%'; }

		var modalContainer = document.createElement('div');
		modalContainer.className = this.modalContainerClassName;
		modalContainer.style.position = 'fixed';
		modalContainer.style.top = '0px';
		modalContainer.style.left = '0px';
		modalContainer.style.right = '0px';
		modalContainer.style.bottom = '0px';
		modalContainer.style.zIndex = 999999;

		var messageContainer = document.createElement('div');
		messageContainer.className = className;
		messageContainer.style.width = width;
		messageContainer.style.height = height;
		messageContainer.style.position = 'relative';
		messageContainer.innerHTML = message;
		modalContainer.appendChild(messageContainer);

		$('body')[0].appendChild(modalContainer);

		this.currentMessageBox = modalContainer;
		this.messageContainer = messageContainer;
		var thisClass = this;
		this.adjustTop();

		if (closeButton) {
			this.createCloseButton();
		}
	},

	showError:function(message,params) {
		var closeButton = false;
		var width = "60%";
		var height = "20%";
		var onClose = null;
		if (params) {
			closeButton = params.closeButton;
			width = params.width;
			height = params.height;
			onClose = params.onClose;
		}

		this.doShowError(message,closeButton,width,height,onClose);
	},

	doShowError:function(message,closeButton,width,height,onClose) {
		this.doShowMessage(message,closeButton,width,height,this.errorClassName,onClose);
	},

	createCloseButton:function() {
		if (this.messageContainer) {
			var thisClass = this;
			var closeButton = document.createElement('div');
			this.messageContainer.appendChild(closeButton);
			closeButton.className = 'paella_messageContainer_closeButton';
			$(closeButton).click(function(event) { thisClass.onCloseButtonClick(); });
		}
	},

	adjustTop:function() {
		if (this.currentMessageBox) {

			var msgHeight = $(this.messageContainer).outerHeight();
			var containerHeight = $(this.currentMessageBox).height();

			var top = containerHeight/2 - msgHeight/2;
			this.messageContainer.style.marginTop = top + 'px';
		}
	},
	
	close:function() {
		if (this.currentMessageBox && this.currentMessageBox.parentNode) {
			var msgBox = this.currentMessageBox;
			var parent = msgBox.parentNode;
			$(msgBox).animate({opacity:0.0},300,function() {
				parent.removeChild(msgBox);
			});
			if (this.onClose) {
				this.onClose();
			}
		}
	},

	onCloseButtonClick:function() {
		this.close();
	}
});

paella.messageBox = new paella.MessageBox();

paella.AntiXSS = {
	htmlEscape: function (str) {
		return String(str)
    		.replace(/&/g, '&amp;')
    		.replace(/"/g, '&quot;')
    		.replace(/'/g, '&#39;')
    		.replace(/</g, '&lt;')
    		.replace(/>/g, '&gt;');
    	},

    htmlUnescape: function (value){
		return String(value)
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&');
	}
};

/*** File: src/02_nodes.js ***/

Class ("paella.Node", {
	identifier:'',
	nodeList:null,

	initialize:function(id) {
		this.nodeList = {};
		this.identifier = id;
	},

	addTo:function(parentNode) {
		parentNode.addNode(this);
	},

	addNode:function(childNode) {
		this.nodeList[childNode.identifier] = childNode;
		return childNode;
	},

	getNode:function(id) {
		return this.nodeList[id];
	},
	
	removeNode:function(childNode) {
		if (this.nodeList[childNode.identifier]) {
			delete this.nodeList[childNode.identifier];
			return true;
		}
		return false;
	}
});

Class ("paella.DomNode", paella.Node,{
	domElement:null,

	initialize:function(elementType,id,style) {
		this.parent(id);
		this.domElement = document.createElement(elementType);
		this.domElement.id = id;
		if (style) $(this.domElement).css(style);
	},

	addNode:function(childNode) {
		var returnValue = this.parent(childNode);
		this.domElement.appendChild(childNode.domElement);
		return returnValue;
	},

	onresize:function() {
	},
	
	removeNode:function(childNode) {
		if (this.parent(childNode)) {
			this.domElement.removeChild(childNode.domElement);
		}
	}
});

Class ("paella.Button", paella.DomNode,{
	isToggle:false,

	initialize:function(id,className,action,isToggle) {
		this.isToggle = isToggle;
		var style = {};
		this.parent('div',id,style);
		this.domElement.className = className;
		if (isToggle) {
			var thisClass = this;
			$(this.domElement).click(function(event) {
				thisClass.toggleIcon();
			});
		}
		$(this.domElement).click('click',action);
	},

	isToggled:function() {
		if (this.isToggle) {
			var element = this.domElement;
			return /([a-zA-Z0-9_]+)_active/.test(element.className);
		}
		else {
			return false;
		}
	},

	toggle:function() {
		this.toggleIcon();
	},

	toggleIcon:function() {
		var element = this.domElement;
		if (/([a-zA-Z0-9_]+)_active/.test(element.className)) {
			element.className = RegExp.$1;
		}
		else {
			element.className = element.className + '_active';
		}

	},

	show:function() {
		$(this.domElement).show();
	},

	hide:function() {
		$(this.domElement).hide();
	},

	visible:function() {
		return this.domElement.visible();
	}
});

/*** File: src/03_video_nodes.js ***/

paella.Profiles = {
	profileList: null,
	
	getDefaultProfile: function() {
		if (paella.player && paella.player.config && paella.player.config.defaultProfile) {
				return paella.player.config.defaultProfile;
		}
		return undefined;		
	},
	
	loadProfile:function(profileName,onSuccessFunction) {
	
		var defaultProfile  = this.getDefaultProfile();		
		this.loadProfileList(function(data){		
			var profileData;
			if(data[profileName] ){
			    // Successful mapping
			    profileData = data[profileName];
			} else if (data[defaultProfile]) {
			    // Fallback to default profile
			    profileData = data[defaultProfile];
			    base.cookies.set("lastProfile", defaultProfile);
			} else {
			    // Unable to find or map defaultProfile in profiles.json
			    base.log.debug("Error loading the default profile. Check your Paella Player configuration");
			    return false;
			}
			onSuccessFunction(profileData);
		});
	},

	loadProfileList:function(onSuccessFunction) {
		var thisClass = this;
		if (this.profileList == null) {
			var params = { url: paella.utils.folders.profiles() + "/profiles.json" };
	
			base.ajax.get(params,function(data,mimetype,code) {
					if (typeof(data)=="string") {
						data = JSON.parse(data);
					}
					thisClass.profileList = data;
					onSuccessFunction(thisClass.profileList);
				},
				function(data,mimetype,code) {
					base.log.debug("Error loading video profiles. Check your Paella Player configuration");
				}
			);
		}
		else {
			onSuccessFunction(thisClass.profileList);
		}
	}
};

Class ("paella.RelativeVideoSize", {
	w:1280,h:720,

	proportionalHeight:function(newWidth) {
		return Math.floor(this.h * newWidth / this.w);
	},

	proportionalWidth:function(newHeight) {
		return Math.floor(this.w * newHeight / this.h);
	},

	percentVSize:function(pxSize) {
		return pxSize * 100 / this.h;
	},

	percentWSize:function(pxSize) {
		return pxSize * 100 / this.w;
	},

	aspectRatio:function() {
		return this.w/this.h;
	}
});

Class ("paella.VideoElementBase", paella.DomNode,{
	ready:false,
	_metadata:null,
	_rect:null,
	_autoplay:false,

	initialize:function(id,containerType,left,top,width,height) {
		var thisClass = this;
		this._rect = { left:left, top:top, width:width, height:height };
		var relativeSize = new paella.RelativeVideoSize();
		var percentTop = relativeSize.percentVSize(top) + '%';
		var percentLeft = relativeSize.percentWSize(left) + '%';
		var percentWidth = relativeSize.percentWSize(width) + '%';
		var percentHeight = relativeSize.percentVSize(height) + '%';
		var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute',zIndex:GlobalParams.video.zIndex};
		this.parent(containerType,id,style);
	},
	
	callReadyEvent:function() {
		paella.events.trigger(paella.events.singleVideoReady, { sender:this });
	},
	
	callUnloadEvent:function() {
		paella.events.trigger(paella.events.singleVideoUnloaded, { sender:this });
	},

	isReady:function() {
		return this.ready;
	},

	setAutoplay:function(autoplay) {
		this._autoplay = autoplay;
	},

	play:function() {
		base.log.debug("TODO: implement play() function in your VideoElementBase subclass");
	},

	pause:function() {
		base.log.debug("TODO: implement pause() function in your VideoElementBase subclass");
	},

	isPaused:function() {
		base.log.debug("TODO: implement isPaused() function in your VideoElementBase subclass");
		return false;
	},

	duration:function() {
		base.log.debug("TODO: implement duration() function in your VideoElementBase subclass");
		return -1;
	},

	setCurrentTime:function(time) {
		base.log.debug("TODO: implement setCurrentTime() function in your VideoElementBase subclass");
	},

	currentTime:function() {
		base.log.debug("TODO: implement currentTime() function in your VideoElementBase subclass");
		return 0;
	},

	setVolume:function(volume) {
		base.log.debug("TODO: implement setVolume() function in your VideoElementBase subclass");
		return false;
	},

	volume:function() {
		base.log.debug("TODO: implement volume() function in your VideoElementBase subclass");
		return -1;
	},

	setPlaybackRate:function(rate) {
		base.log.debug("TODO: implement setPlaybackRate() function in your VideoElementBase subclass");
	},

	addSource:function(sourceData) {
		base.log.debug("TODO: implement addSource() function in your VideoElementBase subclass");
	},
	
	setPosterFrame:function(url) {
		base.log.debug("TODO: implement setPosterFrame() function");
	},
	
	unload:function() {
		this.callUnloadEvent();
	},
	
	setClassName:function(className) {
		this.domElement.className = className;
	},

	setMetadata:function(data) {
		this._metadata = data;
	},

	getDimensions:function() {
		if (this._metadata && this._metadata.res) {
			return { width: this._metadata.res.w, height: this._metadata.res.h };
		}
		else {
			return { width: this.domElement.videoWidth, height: this.domElement.videoHeight };
		}
	},

	setRect:function(rect,animate) {
		this._rect = JSON.parse(JSON.stringify(rect));
		var relativeSize = new paella.RelativeVideoSize();
		var percentTop = relativeSize.percentVSize(rect.top) + '%';
		var percentLeft = relativeSize.percentWSize(rect.left) + '%';
		var percentWidth = relativeSize.percentWSize(rect.width) + '%';
		var percentHeight = relativeSize.percentVSize(rect.height) + '%';
		var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute'};
		if (animate) {
			this.disableClassName();
			var thisClass = this;
			
			$(this.domElement).animate(style,400,function(){
				thisClass.enableClassName();
				paella.events.trigger(paella.events.setComposition, { video:thisClass });
			});
			this.enableClassNameAfter(400);
		}
		else {
			$(this.domElement).css(style);
			paella.events.trigger(paella.events.setComposition, { video:this });
		}
	},
	
	getRect:function() {
		return this._rect;
	},

	disableClassName:function() {
		this.classNameBackup = this.domElement.className;
		this.domElement.className = "";
	},

	enableClassName:function() {
		this.domElement.className = this.classNameBackup;
	},

	enableClassNameAfter:function(millis) {
		setTimeout("$('#" + this.domElement.id + "')[0].className = '" + this.classNameBackup + "'",millis);
	},

	setVisible:function(visible,animate) {
		if (visible=="true" && animate) {
			$(this.domElement).show();
			$(this.domElement).animate({opacity:1.0},300);
		}
		else if (visible=="true" && !animate) {
			$(this.domElement).show();
		}
		else if (visible=="false" && animate) {
			$(this.domElement).animate({opacity:0.0},300);
		}
		else if (visible=="false" && !animate) {
			$(this.domElement).hide();
		}
	},

	setLayer:function(layer) {
		this.domElement.style.zIndex = layer;
	},

	freeze:function(){

	},
	unFreeze:function(){

	}

});


//function paella_flash_video_ready(streamId) {
//	var videoPlayer = paella_flash_VideoContainers[streamId];
//	videoPlayer._isReady = true;
//}

var paella_flash_VideoContainers = {};

Class ("paella.FlashVideo", paella.VideoElementBase,{
	classNameBackup:'',
	flashVideo:null,
	paused:true,
	streamingMode:true,
	flashId:'',
	_isReady:false,
	_duration:0,

	initialize:function(id,left,top,width,height) {
		var This = this;
		this.parent(id,'div',left,top,width,height);
		this.flashId = id + 'Movie';
		paella_flash_VideoContainers[this.flashId] = this;
		
		paella.events.bind(paella.events.flashVideoEvent,function(event,params) {
			if (This.flashId==params.source) {
				This.eventReceived(params.eventName,params.values);
			}
		});
	},

	isReady:function() {
		return this._isReady;
	},
	
	eventReceived:function(eventName,params) {
//		if (eventName=="progress") {
//		}
		
		params = params.split(",");
		var processedParams = {};
		for (var i=0; i<params.length; ++i) {
			var splitted = params[i].split(":");
			var key = splitted[0];
			var value = splitted[1];
			if (value=="NaN") {
				value = NaN;
			}
			else if (/^true$/i.test(value)) {
				value = true;
			}
			else if (/^false$/i.test(value)) {
				value = false;
			}
			else if (!isNaN(parseFloat(value))) {
				value = parseFloat(value);
			}
			processedParams[key] = value;
		}
		this.processEvent(eventName,processedParams);
	},

	setAutoplay:function(autoplay) {
		this._autoplay = autoplay;

	},
	
	processEvent:function(eventName,params) {
		if (eventName!="loadedmetadata" && eventName!="pause" && !this._isReady) {
			this._isReady = true;
			this._duration = params.duration;
			this.callReadyEvent();
		}
		if (eventName=="progress") {
			try { this.flashVideo.setVolume(this._volume); }
			catch(e) {}
			base.log.debug("Flash video event: " + eventName + ", progress: " + this.flashVideo.currentProgress());
		}
		else if (eventName=="ended") {
			base.log.debug("Flash video event: " + eventName);
			paella.events.trigger(paella.events.pause);
			paella.player.controls.showControls();
		}
		else {
			base.log.debug("Flash video event: " + eventName);
		}
		if (this._isLiveStream && this._posterFrameElement) {
			$(this._posterFrameElement).hide();
		}
	},
	
	setPosterFrame:function(url) {
		if (this._posterFrame===undefined) {
			this._posterFrame = url;
			var posterFrame = document.createElement('img');
			posterFrame.src = url;
			posterFrame.className = "videoPosterFrameImage";
			posterFrame.alt = "poster frame";
			this.domElement.appendChild(posterFrame);
			this._posterFrameElement = posterFrame;
		}
	},

	// Adobe Flash utils
	addParameter:function(swf,name,value) {
		var param = document.createElement('param');
		param.setAttribute("name",name);
		param.setAttribute("value",value);
		swf.appendChild(param);
	},

	createSwf:function(url,params) {
		var ieobject = document.createElement('object');
		ieobject.setAttribute('id',this.flashId + 'IE');
		ieobject.setAttribute('classid', 'clsid:d27cdb6e-ae6d-11cf-96b8-444553540000');
		ieobject.setAttribute('codebase', '"http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=5,0,0,0"');
		ieobject.setAttribute("width","100%");
		ieobject.setAttribute("height","100%");
		ieobject.setAttribute("playerId",this.flashId);
		this.addParameter(ieobject,"movie",url);
		this.addParameter(ieobject,"quality","high");
		this.addParameter(ieobject,"bgcolor","#efefef");
		this.addParameter(ieobject,"play","true");
		this.addParameter(ieobject,"loop","true");
		this.addParameter(ieobject,"wmode","window");
		this.addParameter(ieobject,"scale","default");
		this.addParameter(ieobject,"menu","true");
		this.addParameter(ieobject,"devicefont","false");
		this.addParameter(ieobject,"salign","");
		this.addParameter(ieobject,"allowScriptAccess","sameDomain");

		var object = document.createElement('object');
		object.setAttribute('id',this.flashId);
		object.setAttribute("type","application/x-shockwave-flash");
		object.setAttribute("data",url);
		object.setAttribute("width","100%");
		object.setAttribute("height","100%");
		object.setAttribute("playerId",this.flashId);
		this.addParameter(object,"movie",url);
		this.addParameter(object,"quality","high");
		this.addParameter(object,"bgcolor","#efefef");
		this.addParameter(object,"play","true");
		this.addParameter(object,"loop","true");
		this.addParameter(object,"wmode","window");
		this.addParameter(object,"scale","default");
		this.addParameter(object,"menu","true");
		this.addParameter(object,"devicefont","false");
		this.addParameter(object,"salign","");
		this.addParameter(object,"allowScriptAccess","sameDomain");
		ieobject.appendChild(object);

		var flashVars = "playerId=" +  this.playerId;
		var separator = "&";
		for (var key in params) {
			flashVars += separator + key + "=" + encodeURIComponent(params[key]);
		}
		this.addParameter(ieobject,"flashvars",flashVars);
		this.addParameter(object,"flashvars",flashVars);

		var link = document.createElement('a');
		link.setAttribute("href", "http://www.adobe.com/go/getflash");
		link.innerHTML = '<img src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Obtener Adobe Flash Player" />';
		object.appendChild(link);

		return ieobject;
	},

	play:function() {
		if (this.flashVideo) {
			try {
				this.flashVideo.play();
				this.paused = false;
				if (this._posterFrameElement) {
					$(this._posterFrameElement).hide();
				}
				return true;
			}
			catch(e) {
			}
		}
		return false;
	},

	pause:function() {
		if (this.flashVideo) {
			try {
				this.flashVideo.pause();
				this.paused = true;
				return true;
			}
			catch(e) {
			}
		}
		return false;
	},

	isPaused:function() {
		return this.paused;
	},

	duration:function() {
		return this._duration;
	},

	setCurrentTime:function(time) {
		if (this.flashVideo) {
			try {
				this.flashVideo.seekToTime(time);
			}
			catch(e) {
			}
		}
	},

	currentTime:function() {
		if (this.flashVideo) {
			try {
				return this.flashVideo.getCurrentTime();
			}
			catch (e) {
				return 0;
			}
		}
		return -1;
	},

	setDefaultVolume:function(vol) {
		this._defaultVolume = vol;
		this._volume = vol;
	},
	
	setVolume:function(volume) {
		if (this.flashVideo) {
			this._volume = volume;
			var thisClass = this;
			try {
				this.flashVideo.setVolume(volume);
				return true;
			}
			catch(e) {
				new Timer(function(timer) {
					try {
						thisClass.flashVideo.setVolume(volume);
						timer.repeat = false;
					}
					catch(e2) {
						base.log.debug('Fail to set volume on ' + thisClass.identifier);
						timer.repeat = true;
					}
				},100);
			}
		}
		return false;
	},

	volume:function() {
		var volume = 0;
		if (this.flashVideo) {
			try {
				volume = this.flashVideo.getVolume();
			}
			catch (e) {
				
			}
		}
		return volume;
	},

	setPlaybackRate:function(rate) {
	},

	createSwfObject:function(swfFile,flashVars) {
		var id = this.identifier;
		var parameters = { wmode:'transparent' };

		var domElement = document.createElement('div');
		this.domElement.appendChild(domElement);
		domElement.id = id + "Movie";

		if (swfobject.hasFlashPlayerVersion("9.0.0")) {
			swfobject.embedSWF(swfFile,domElement.id,"100%","100%","9.0.0","",flashVars,parameters, null, function callbackFn(e){
				if (e.success == false){
					var message = document.createElement('div');

					var header = document.createElement('h3');
					header.innerHTML = base.dictionary.translate("Flash player problem");
					var text = document.createElement('div');
					text.innerHTML = base.dictionary.translate("A problem occurred trying to load flash player.") + "<br>" +
						base.dictionary.translate("Please go to {0} and install it.")
						.replace("{0}", "<a style='color: #800000; text-decoration: underline;' href='http://www.adobe.com/go/getflash'>http://www.adobe.com/go/getflash</a>") + '<br>' +

						base.dictionary.translate("If the problem presist, contant us.");

					var link = document.createElement('a');
					link.setAttribute("href", "http://www.adobe.com/go/getflash");
					link.innerHTML = '<img style="margin:5px;" src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Obtener Adobe Flash Player" />';

					message.appendChild(header);
					message.appendChild(text);
					message.appendChild(link);

					paella.messageBox.showError(message.innerHTML);
				}
			});
		}
		else {
			var message = document.createElement('div');

			var header = document.createElement('h3');
			header.innerHTML = base.dictionary.translate("Flash player 9 nedded");

			var text = document.createElement('div');

			text.innerHTML = base.dictionary.translate("You need at least Flash player 9 installed.") + "<br>" +
				base.dictionary.translate("Please go to {0} and install it.")
				.replace("{0}", "<a style='color: #800000; text-decoration: underline;' href='http://www.adobe.com/go/getflash'>http://www.adobe.com/go/getflash</a>");

			var link = document.createElement('a');
			link.setAttribute("href", "http://www.adobe.com/go/getflash");
			link.innerHTML = '<img style="margin:5px;" src="http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif" alt="Obtener Adobe Flash Player" />';

			message.appendChild(header);
			message.appendChild(text);
			message.appendChild(link);

			paella.messageBox.showError(message.innerHTML);
		}

		var flashObj = $('#' + domElement.id)[0];
		return flashObj;
	},

	addSourceProgresiveDownload:function(sourceData){
		var parameters = {};
		if (this._autoplay) {
			parameters.autoplay = this._autoplay;
		}
		if (base.parameters.get('debug')=="true") {
			parameters.debugMode = true;
		}
		if (sourceData.type=='video/mp4') {
			if (!/rtmp:\/\//.test(sourceData.src)) {
				parameters.url = sourceData.src;
				parameters.playerId = this.flashId;
				parameters.isLiveStream = false;
				this.flashVideo = this.createSwfObject("player.swf",parameters);
			}
		}
		else if (sourceData.type=='video/x-flv') {
			parameters.url = sourceData.src;
			parameters.playerId = this.flashId;
			parameters.isLiveStream = false;
			this.flashVideo = this.createSwfObject("player.swf",parameters);
		}
	},

	addSourceStreaming:function(sourceData) {
		var subscription = false;
		if (!sourceData || !sourceData.src) {
			base.log.debug("Invalid source data: expecting src");
			return;
		}
		if (typeof(sourceData.src)=="string") {
			base.log.debug("Invalid RTMP source format, expecting an object with the format: { server:'rtmp://server', stream:'video-stream' }");
			return;
		}
		if (!sourceData.src.server || !sourceData.src.stream) {
			base.log.debug("Invalid RTMP source configuration: expecting { server:'rtmp://server', stream:'video-stream' }");
			return;
		}

		if (sourceData.src.requiresSubscription===undefined &&
			paella.player.config.player.rtmpSettings
		) {
			subscription = paella.player.config.player.rtmpSettings.requiresSubscription || false;
		}
		else if (sourceData.src.requiresSubscription) {
			subscription = sourceData.src.requiresSubscription;
		}
		var parameters = {};
		var swfName = 'player_streaming.swf';
		if (this._autoplay) {
        	parameters.autoplay = this._autoplay;
       	}
		if (base.parameters.get('debug')=="true") {
			parameters.debugMode = true;
		}

		parameters.playerId = this.flashId;
		parameters.isLiveStream = sourceData.isLiveStream!==undefined ? sourceData.isLiveStream:false;
		this._isLiveStream = sourceData.isLiveStream!==undefined ? sourceData.isLiveStream:false;
		parameters.server = sourceData.src.server;
		parameters.stream = sourceData.src.stream;
		parameters.subscribe = subscription;
		if (paella.player.config.player.rtmpSettings && paella.player.config.player.rtmpSettings.bufferTime!==undefined) {
			parameters.bufferTime = paella.player.config.player.rtmpSettings.bufferTime;
		}
		this.flashVideo = this.createSwfObject(swfName,parameters);
	},

	addSource:function(sourceData) {
		if (this.streamingMode) {
			this.addSourceStreaming(sourceData);
		}
		else{
			this.addSourceProgresiveDownload(sourceData);
		}
	},
	
	unload:function() {
		if (this.flashVideo) {
			this.domElement.innerHTML = "";
			this.flashVideo = null;
			this._isReady = false;
		}
		this.parent();
	},
	
	getDimensions:function() {
		var dim = {width:640, height:480};
		if (this._metadata && this._metadata.res) {
			dim.width = this._metadata.res.w;
			dim.height = this._metadata.res.h;
		}
		else {
			try {
				dim.width = this.flashVideo.getWidth();
				dim.height = this.flashVideo.getHeight();
			}
			catch (e) {
				base.log.debug("Warning: flash video is not loaded");
			}
		}
		return dim;
	}
});

Class ("paella.Html5Video", paella.VideoElementBase,{
	classNameBackup:'',
	ready:false,
	
	_initialCurrentTime:0,
	_posterFrame:null,
	_canvasPile:null,

	initialize:function(id,left,top,width,height) {
		this.parent(id,'video',left,top,width,height);
		var thisClass = this;
		$(this.domElement).bind('progress',function(event) {
			thisClass.onVideoProgress(event);
		});
		$(this.domElement).bind('loadstart',function(event) {
			thisClass.onVideoProgress(event);
		});
		$(this.domElement).bind('loadedmetadata',function(event) {
			thisClass.onVideoProgress(event);
		});
		
		$(this.domElement).bind('canplay',function(event) {
			thisClass.onVideoProgress(event);
		});
		if(thisClass._canvasPile == null){ thisClass._canvasPile = []; }
	},
	
	onVideoProgress:function(event) {
		if (!this.ready && this.domElement.readyState==4) {
			this.ready = true;
			if (this._initialCurrentTime!=0) {
				this.domElement.currentTime = this._initialCurrentTime;
				delete this._initialCurrentTime;
			}
			this.callReadyEvent();
		}
	},

	isReady:function() {
		return this.ready;
	},
	
	setPosterFrame:function(url) {
		this._posterFrame = url;
		if (this.domElement) {
			this.domElement.setAttribute("poster",url);
		}
	},

	setAutoplay:function(auto) {
		this._autoplay = auto;
		if (auto) {
			this.domElement.setAttribute("autoplay",auto);
		}
	},

	play:function() {
		if (this.domElement && this.domElement.play) {
			this.domElement.play();
			if (this._initialCurrentTime && this.domElement.readyState==4) {
				this.domElement.currentTime = this._initialCurrentTime;
				delete this._initialCurrentTime;
			}
		}
	},

	pause:function() {
		if (this.domElement && this.domElement.pause) {
			this.domElement.pause();
		}
	},

	isPaused:function() {
		return this.domElement.paused;
	},

	duration:function() {
		if (this.domElement && this.domElement.duration) {
			return this.domElement.duration;
		}
	},

	setCurrentTime:function(time) {
		if (!this.ready) {
			this._initialCurrentTime = time;
		}

		if (this.domElement && this.domElement.currentTime) {
			this.domElement.currentTime = time;
		}
		else if (this.domElement) {
			this._initialCurrentTime = time;
		}
	},

	currentTime:function() {
		if (this.domElement && this.domElement.currentTime) {
			return this.domElement.currentTime;
		}
		return 0;
	},

	setDefaultVolume:function(vol) {
		this.setVolume(vol);
	},
	
	setVolume:function(volume) {
		if (volume==0) {
			this.domElement.setAttribute("muted",true);
		}
		else {
			this.domElement.removeAttribute("muted");
		}
		this.domElement.volume = volume;
		return true;
	},

	volume:function() {
		if (this.domElement.muted) return 0;
		return this.domElement.volume;
	},

	setPlaybackRate:function(rate) {
		this.domElement.playbackRate = rate;
	},

	addSource:function(sourceData) {
		var source = document.createElement('source');
		var separator = sourceData.src.indexOf('?') == -1 ? '?' : '&';
		source.src = sourceData.src + separator + 'caches=' + Math.random();
		source.type = sourceData.type;
		this.domElement.appendChild(source);
	},

	unFreeze:function(){
		var self = this;
		var c = document.getElementById(this.domElement.className + "canvas");
		$(c).remove();
	},
	
	freeze:function(){
		var self = this;
		var canvas = document.createElement("canvas");
		var pos = this._rect;
		canvas.id = this.domElement.className + "canvas";
		canvas.width = $(this.domElement).width();
		canvas.height = $(this.domElement).height();
		canvas.style.position = "absolute";
		canvas.style.width = canvas.width + "px";
		canvas.style.height = canvas.height + "px";
		canvas.style.top = $(this.domElement).position().top + "px";
		canvas.style.left = $(this.domElement).position().left + "px";
		canvas.style.zIndex = 2;

		var ctx = canvas.getContext("2d");
		ctx.drawImage(this.domElement, 0, 0, Math.ceil(canvas.width/16)*16, Math.ceil(canvas.height/16)*16);//Draw image
		this.domElement.parentElement.appendChild(canvas);
		self._canvasPile.push(canvas);
	},

	unload:function() {
		//START_CANVAS
		var self = this;							
		//self.drawCanvas(this._rect);	

		//END_CANVAS
		this.ready = false;
		var sources = $(this.domElement).find('source');
		for (var i=0; i<sources.length; ++i) {
			this.domElement.removeChild(sources[i]);
			sources[i].src = "";
		}
		this.domElement.src = '';
		this.domElement.load();
		this.parent();
	},

	getDimensions:function() {
		if (this._metadata && this._metadata.res) {
			return { width: this._metadata.res.w, height: this._metadata.res.h };
		}
		else {
			return { width: this.domElement.videoWidth, height: this.domElement.videoHeight };
		}
	},

	disableClassName:function() {
		this.classNameBackup = this.domElement.className;
		this.domElement.className = "";
	},

	enableClassName:function() {
		this.domElement.className = this.classNameBackup;
	},

	enableClassNameAfter:function(millis) {
		setTimeout("$('#" + this.domElement.id + "')[0].className = '" + this.classNameBackup + "'",millis);
	},

	setVisible:function(visible,animate) {
		if (visible=="true" && animate) {
			$(this.domElement).show();
			$(this.domElement).animate({opacity:1.0},300);
		}
		else if (visible=="true" && !animate) {
			$(this.domElement).show();
		}
		else if (visible=="false" && animate) {
			$(this.domElement).animate({opacity:0.0},300);
		}
		else if (visible=="false" && !animate) {
			$(this.domElement).hide();
		}
	},

	setLayer:function(layer) {
		this.domElement.style.zIndex = layer;
	}
});

Class ("paella.SlideshowVideo", paella.VideoElementBase,{
	ready:false,
	img:null,
	_frames:null,
	_duration:0,
	_currentTime:0,
	_playTime:0,
	_lastFrame:-1,

	updateTimer:null,

	initialize:function(id,left,top,width,height) {
		this.parent(id,'div',left,top,width,height);
		this.img = document.createElement('img');
		this.img.style.width = '100%';
		this.img.style.height = '100%';
		this.domElement.appendChild(this.img);

		var thisClass = this;
		thisClass.ready = false;
	},

	isReady:function() {
		return this.ready;
	},

	checkFrame:function() {
		var src = null;
		var alt = "";
		var lastFrame = -1;

		for (var i=0;i<this._frames.length;++i) {
			var frameData = this._frames[i];
			if (this._currentTime<frameData.time) break;
			src = frameData.image;
			alt = "frame_" + frameData.time;
			lastFrame = frameData.time;
		}

		if (this._lastFrame!=lastFrame) {
			this.img.src = src;
			this.img.alt = alt;
			this._lastFrame = lastFrame;
		}
	},

	play:function() {
		if (!this.updateTimer) {
			this._playTime = new Date().getTime();
			this.updateTimer = new Timer(function(timer,params){
				var time = new Date().getTime();
				var elapsed = Math.round((time - params.player._playTime) / 1000);
				params.player._currentTime += elapsed;
				params.player._playTime = time;
				params.player.checkFrame();
				if (params.player_currentTime>=params.player._duration) params.player.pause();
			},1000,{player:this});
			this.updateTimer.repeat = true;
		}
	},

	pause:function() {
		if (this.updateTimer) {
			this.updateTimer.cancel();
			this.updateTimer = null;
		}
	},

	isPaused:function() {
		return this.updateTimer==null;
	},

	duration:function() {
		return _duration;
	},

	setCurrentTime:function(time) {
		if (this._duration>=time) {
			this._currentTime = time;
			this.checkFrame();
		}
		//console.log("XXX");
	},

	currentTime:function() {
		return this._currentTime;
	},

	setVolume:function(volume) {
		return false;
	},

	setDefaultVolume:function(vol) {
	},
	
	volume:function() {
		return -1;
	},

	setPlaybackRate:function(rate) {
	},

	// sourceData = {frames:{frame_1:'frame_1.jpg',frame_1:'frame_1.jpg',...frame_n:'frame_n.jpg'},duration:183}
	addSource:function(sourceData) {
		this._duration = sourceData.duration;
		this._currentTime = 0;
		this.loadFrames(sourceData.frames,sourceData.duration);
		var frameZero = new Image();
		var thisClass = this;
		frameZero.onload = function(event) {
			thisClass.ready = true;
			thisClass.checkFrame();
		};
		frameZero.src = this._frames[0].image;
	},
	
	unload:function() {
		this.domElement.innerHTML = "";
		this.parent();
	},

	loadFrames:function(frames,duration) {
		this._frames = [];
		for (var i=0;i<=duration;++i) {
			var frame = frames['frame_' + i];
			if (frame) this._frames.push({time:i,image:frame});
		}
	}
});

/*** File: src/04_video_container.js ***/
Class ("paella.BackgroundContainer", paella.DomNode,{
	initialize:function(id,image) {
		this.parent('img',id,{position:'relative',top:'0px',left:'0px',right:'0px',bottom:'0px',zIndex:GlobalParams.background.zIndex});
		this.domElement.setAttribute('src',image);
		this.domElement.setAttribute('alt','');
		this.domElement.setAttribute('width','100%');
		this.domElement.setAttribute('height','100%');
	},

	setImage:function(image) {
		this.domElement.setAttribute('src',image);
	}
});

Class ("paella.VideoOverlay", paella.DomNode,{
	size:{w:1280,h:720},

	initialize:function() {
		var style = {position:'absolute',left:'0px',right:'0px',top:'0px',bottom:'0px',overflow:'hidden',zIndex:10};
		this.parent('div','overlayContainer',style);
		this.domElement.setAttribute("role", "main");
	},

	enableBackgroundMode:function() {
		this.domElement.className = 'overlayContainer background';
	},

	disableBackgroundMode:function() {
		this.domElement.className = 'overlayContainer';
	},

	clear:function() {
		this.domElement.innerHTML = "";
	},

	getMasterRect:function() {
		return paella.player.videoContainer.getMasterVideoRect();
	},

	getSlaveRect:function() {
		return paella.player.videoContainer.getSlaveVideoRect();
	},

	addText:function(text,rect,isDebug) {
		var textElem = document.createElement('div0');
		textElem.innerHTML = text;
		textElem.className = "videoOverlayText";
		if (isDebug) textElem.style.backgroundColor = "red";
		return this.addElement(textElem,rect);
	},

	addElement:function(element,rect) {
		this.domElement.appendChild(element);
		element.style.position = 'absolute';
		element.style.left = this.getHSize(rect.left) + '%';
		element.style.top = this.getVSize(rect.top) + '%';
		element.style.width = this.getHSize(rect.width) + '%';
		element.style.height = this.getVSize(rect.height) + '%';
		return element;
	},

	removeElement:function(element) {
		if (element) {
			try {
				this.domElement.removeChild(element);
			}
			catch (e) {
				
			}
		}
	},

	getVSize:function(px) {
		return px*100/this.size.h;
	},

	getHSize:function(px) {
		return px*100/this.size.w;
	}
});

Class ("paella.VideoContainerBase", paella.DomNode,{
	trimming:{enabled:false,start:0,end:0},
	timeupdateEventTimer:null,
	timeupdateInterval:250,
	masterVideoData:null,
	slaveVideoData:null,
	currentMasterVideoData:null,
	currentSlaveVideoData:null,
	_force:false,

	initialize:function(id) {
		var self = this;
		var style = {position:'absolute',left:'0px',right:'0px',top:'0px',bottom:'0px',overflow:'hidden'};
		this.parent('div',id,style);
		$(this.domElement).click(function(evt) {
			if (self.firstClick && base.userAgent.browser.IsMobileVersion) return;
			if (paella.player.videoContainer.paused()) {
				paella.player.play();
			}
			else {
				paella.player.pause();
			}
			self.firstClick = true;
		});
		this.domElement.addEventListener("touchstart",function(event) {
			if (paella.player.controls) {
				paella.player.controls.restartHideTimer();
			}
		});
	},

	triggerTimeupdate:function() {
		var thisClass = this;
		if (!this.paused() || thisClass._force) {
			paella.events.trigger(paella.events.timeupdate,{videoContainer:thisClass, currentTime:thisClass.currentTime() });
			thisClass._force = false;
		}
	},

	startTimeupdate:function() {
		var thisClass = this;
		this.timeupdateEventTimer = new Timer(function(timer) {
			thisClass.triggerTimeupdate();
		},this.timeupdateInterval);
		this.timeupdateEventTimer.repeat = true;
	},

	stopTimeupdate:function() {
		if (this.timeupdateEventTimer) {
			this.timeupdateEventTimer.repeat = false;
		}
		this.timeupdateEventTimer = null;
	},

	play:function() {
		paella.events.trigger(paella.events.play);
		this.startTimeupdate();
	},

	pause:function() {
		paella.events.trigger(paella.events.pause);
		this.stopTimeupdate();
	},

	seekTo:function(newPositionPercent) {
		var thisClass = this;
		this.setCurrentPercent(newPositionPercent);
		thisClass._force = true;
		this.triggerTimeupdate();
		paella.events.trigger(paella.events.seekTo,{ newPositionPercent:newPositionPercent });

	},

	seekToTime:function(time) {
		var thisClass = this;
		this.setCurrentTime(time);
		thisClass._force = true;
		this.triggerTimeupdate();
	},

	setPlaybackRate:function(params) {
	},

	setVolume:function(params) {
	},

	volume:function() {
		return 1;
	},

	trimStart:function() {
		return 0;
	},

	trimEnd:function() {
		return this.duration();
	},

	trimEnabled:function() {
		return false;
	},

	enableTrimming:function() {
		this.trimming.enabled = true;
		paella.events.trigger(paella.events.setTrim,{trimEnabled:this.trimming.enabled,trimStart:this.trimming.start,trimEnd:this.trimming.end});
	},

	disableTrimming:function() {
		this.trimming.enabled = false;
		paella.events.trigger(paella.events.setTrim,{trimEnabled:this.trimming.enabled,trimStart:this.trimming.start,trimEnd:this.trimming.end});
	},

	setTrimming:function(start,end) {
		this.trimming.start = start;
		this.trimming.end = end;
		if (this.currentTime()<this.trimming.start) {
			this.setCurrentTime(this.trimming.start);
		}
		if (this.currentTime()>this.trimming.end) {
			this.setCurrentTime(this.trimming.end);
		}
		paella.events.trigger(paella.events.setTrim,{trimEnabled:this.trimming.enabled,trimStart:this.trimming.start,trimEnd:this.trimming.end});
	},

	setTrimmingStart:function(start) {
		this.setTrimming(start,this.trimming.end);
	},

	setTrimmingEnd:function(end) {
		this.setTrimming(this.trimming.start,end);
	},

	setCurrentPercent:function(percent) {
		var start = this.trimStart();
		var end = this.trimEnd();
		var duration = end - start;
		var trimedPosition = percent * duration / 100;
		var realPosition = parseFloat(trimedPosition) + parseFloat(start);
		this.setCurrentTime(realPosition);
	},

	setCurrentTime:function(time) {
		base.log.debug("VideoContainerBase.setCurrentTime(" +  time + ")");
	},

	currentTime:function() {
		base.log.debug("VideoContainerBase.currentTime()");
		return 0;
	},

	duration:function() {
		base.log.debug("VideoContainerBase.duration()");
		return 0;
	},

	paused:function() {
		base.log.debug("VideoContainerBase.paused()");
		return true;
	},

	setupVideo:function(onSuccess) {
		base.log.debug("VideoContainerBase.setupVide()");
	},

	isReady:function() {
		base.log.debug("VideoContainerBase.isReady()");
		return true;
	},

	onresize:function() { this.parent(onresize);
	}
});

Class ("paella.ProfileFrameStrategy",{
	valid:function() {
		return true;
	},

	adaptFrame:function(videoDimensions,frameRect) {
		return frameRect;
	}
});

Class ("paella.LimitedSizeProfileFrameStrategy", paella.ProfileFrameStrategy, {
	adaptFrame:function(videoDimensions,frameRect) {
		if (videoDimensions.width<frameRect.width || videoDimensions.height<frameRect.height) {
			var frameRectCopy = JSON.parse(JSON.stringify(frameRect));
			frameRectCopy.width = videoDimensions.width;
			frameRectCopy.height = videoDimensions.height;
			var diff = { w:frameRect.width - videoDimensions.width,
						 h:frameRect.height - videoDimensions.height };
			frameRectCopy.top = frameRectCopy.top + diff.h/2;
			frameRectCopy.left = frameRectCopy.left + diff.w/2;
			return frameRectCopy;
		}
		return frameRect;
	}
});

Class ("paella.VideoQualityStrategy", {
	getStream:function(source,stream,userSelection) {
		if (source.length>0) {
			return source[0];
		}
		else {
			return source;
		}
	}
});

Class ("paella.BestFitVideoQualityStrategy",paella.VideoQualityStrategy,{
	getStream:function(source,stream,userSelection) {
		if (source.length>0) {
			var selected = source[0];
			var win_w = $(window).width();
			var win_h = $(window).height();
			var win_res = (win_w * win_h);
			var selected_res = parseInt(selected.res.w) * parseInt(selected.res.h);
			var selected_diff = Math.abs(win_res - selected_res);

			for (var i=0; i<source.length; ++i) {
				var res = source[i].res;
				if (res) {
					if (userSelection != undefined) {
						res = res.w + "x" + res.h;
						if (res==userSelection) {
							 selected = source[i];
							break;
						}
					}
					else{
						var m_res = parseInt(source[i].res.w) * parseInt(source[i].res.h);
						var m_diff = Math.abs(win_res - m_res);

						if (m_diff < selected_diff){
							selected_diff = m_diff;
							selected = source[i];
						}


					}
				}
			}
			return selected;
		}
		else {
			return source;
		}
	}
});

Class ("paella.VideoContainer", paella.VideoContainerBase,{
	containerId:'',
	video1Id:'',
	video2Id:'',
	backgroundId:'',
	container:null,
	profileFrameStrategy:null,

	videoClasses:{
		master:"video masterVideo",
		slave:"video slaveVideo"
	},

	//fitHorizontal:false,
	isHidden:false,
	maxSyncDelay:0.5,
	logos:null,
	isMasterReady:false,
	isSlaveReady:false,
	isMonostream:false,
	sourceData:null,
	overlayContainer:null,
	videoSyncTimeMillis:5000,
	currentMasterVideoRect:{},
	currentSlaveVideoRect:{},

	_masterQuality:null,
	_slaveQuality:null,
	
	_firstLoad:false,
	_playOnLoad:false,
	_seekToOnLoad:0,
	
	_defaultMasterVolume:1,
	_defaultSlaveVolume:1,
	
	_showPosterFrame:true,

	initialize:function(id) {
		this.parent(id);
		var thisClass = this;
		this.sourceData = [];
		this.containerId = id + '_container';
		this.video1Id = id + '_1';
		this.video2Id = id + '_2';
		this.backgroundId = id + '_bkg';
		this.logos = [];
		this._videoQualityStrategy = new paella.VideoQualityStrategy();

		this.container = new paella.DomNode('div',this.containerId,{position:'relative',display:'block',marginLeft:'auto',marginRight:'auto',width:'1024px',height:'567px'});
		this.container.domElement.setAttribute('role','main');
		this.addNode(this.container);

		this.overlayContainer = new paella.VideoOverlay(this.domElement);
		this.container.addNode(this.overlayContainer);

		var overlayLoader = document.createElement("div");
		overlayLoader.className = "videoLoaderOverlay";
		this.overlayContainer.addElement(overlayLoader,{left:0,top:0,width:1280,height:720});
		//this.overlayContainer.addText("Loading",{left:0,top:0,width:1280,height:720},true);
		paella.events.bind(paella.events.loadComplete,function() { thisClass.overlayContainer.removeElement(overlayLoader); });

		this.container.addNode(new paella.BackgroundContainer(this.backgroundId, paella.utils.folders.profiles() + '/resources/default_background_paella.jpg'));

		paella.events.bind(paella.events.timeupdate,function(event) { thisClass.checkVideoTrimming(); } );
		
		paella.events.bind(paella.events.singleVideoReady, function(evt,params) {
			thisClass.onVideoLoaded(params.sender);
		});
		
		paella.events.bind(paella.events.singleVideoUnloaded, function(evt,params) {
			thisClass.onVideoUnloaded(params.sender);
		});

		var timer = new base.Timer(function(timer) {
			thisClass.syncVideos();
		},thisClass.videoSyncTimeMillis);
		timer.repeat = true;

		var config = paella.player.config;
		try {
			var StrategyClass = config.player.profileFrameStrategy;
			var ClassObject = Class.fromString(StrategyClass);
			var strategy = new ClassObject();
			if (dynamic_cast("paella.ProfileFrameStrategy", strategy)) {
				this.setProfileFrameStrategy(strategy);
			}
		}
		catch (e) {

		}
	},
	
	setVideoQualityStrategy:function(strategy) {
		this._videoQualityStrategy = strategy;
	},

	setProfileFrameStrategy:function(strategy) {
		this.profileFrameStrategy = strategy;
	},

	getMasterVideoRect:function() {
		return this.currentMasterVideoRect;
	},

	getSlaveVideoRect:function() {
		return this.currentSlaveVideoRect;
	},

	createVideoPlayers:function() {
		var masterVideo = new paella.FlashVideo(this.video1Id,850,140,360,550);
		masterVideo.setClassName(this.video1ClassName);
		this.container.addNode(masterVideo);

		var slaveVideo = new paella.FlashVideo(this.video2Id,10,40,800,600);
		slaveVideo.setClassName(this.video2ClassName);
		this.container.addNode(slaveVideo);
	},

	setHidden:function(hidden) {
		this.isHidden = hidden;
	},

	hideVideo:function() {
		this.setHidden(true);
	},

	publishVideo:function() {
		this.setHidden(false);
	},

	syncVideos:function() {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (!this.isMonostream && masterVideo && slaveVideo && masterVideo.currentTime && slaveVideo.currentTime) {
			var diff = Math.abs(masterVideo.currentTime() - slaveVideo.currentTime());

			if (diff>this.maxSyncDelay) {
				base.log.debug("Sync videos performed, diff=" + diff);
				slaveVideo.setCurrentTime(masterVideo.currentTime());
			}
		}
	},

	checkVideoTrimming:function() {
		var current = this.currentTime();
		var end = this.duration();
		var start = 0;
		if (this.trimming.enabled) {
			end = this.trimming.end;
			start = parseFloat(this.trimming.start);
		}
		if (current>=Math.floor(end) && !this.paused()) {
			var thisClass = this;
			this.pause();
//			paella.events.trigger(paella.events.endVideo,{videoContainer:thisClass});
		}
		else if (current<start) {
			this.setCurrentTime(start + 1);
		}
	},

	play:function() {
		if (!this._firstLoad) {
			this._firstLoad = true;
		}
		else {
			this._playOnLoad = true;
		}
		if (this.trimming.enabled && this.currentTime() >= Math.floor(this.trimming.end)) {
			this.setCurrentTime(this.trimming.start);
                }

		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
	        if (masterVideo) {
			masterVideo.play();
		}
		if (slaveVideo) {
			slaveVideo.play();
		}
		this.parent();
	},

	pause:function() {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) masterVideo.pause();
		if (slaveVideo) slaveVideo.pause();
		this.parent();
	},

	next:function() {
		if (this.trimming.end!==0) {
			this.setCurrentTime(this.trimming.end);
		}
		else {
			this.setCurrentTime(this.duration(true));
		}
		this.parent();
	},

	previous:function() {
		this.setCurrentTime(this.trimming.start);
		this.parent();
	},

	setCurrentTime:function(time) {
		if (time<=0) time = 1; 
		if (this.trimming.enabled) {
			if (time<this.trimming.start) time = this.trimming.start;
			if (time>this.trimming.end) time = this.trimming.end;
		}
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) masterVideo.setCurrentTime(time);
		if (slaveVideo) slaveVideo.setCurrentTime(time);
		this.parent();
	},

	currentTime:function() {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) return masterVideo.currentTime();
		else if (slaveVideo) return slaveVideo.currentTime();
		else return 0;
	},

	setPlaybackRate:function(rate) {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		if (masterVideo) {
			masterVideo.setPlaybackRate(rate);
		}
		if (slaveVideo) {
			slaveVideo.setPlaybackRate(rate);
		}
		this.parent();
	},

	setVolume:function(params) {
		var masterVideo = this.masterVideo();
		var slaveVideo = this.slaveVideo();
		var masterVolume = masterVideo && masterVideo.volume();
		var slaveVolume = slaveVideo && slaveVideo.volume();
		if (typeof(params)=='object') {
			masterVolume = params.master!==undefined ? params.master:masterVolume;
			slaveVolume = params.slave!==undefined ? params.slave:slaveVolume;
		}
		else {
			masterVolume = params;
			slaveVolume = 0;
		}

		if (masterVideo) {
			masterVideo.setVolume(masterVolume);
		}
		if (slaveVideo) {
			slaveVideo.setVolume(slaveVolume);
		}

		paella.events.trigger(paella.events.setVolume,{ master:masterVolume, slave:slaveVolume });

		this.parent();
	},

	volume:function(video) {
		if (!video && this.masterVideo()) {
			return this.masterVideo().volume();
		}
		else if (video=="master" && this.masterVideo()) {
			return this.masterVideo().volume();
		}
		else if (video=="slave" && this.slaveVideo()) {
			return this.slaveVideo().volume();
		}
		else {
			return 0;
		}
	},
	
	setDefaultMasterVolume:function(vol) {
		this._defaultMasterVolume = vol;
	},
	
	setDefaultSlaveVolume:function(vol) {
		this._defaultSlaveVolume = vol;
	},

	masterVideo:function() {
		return this.container.getNode(this.video1Id);
	},

	slaveVideo:function() {
		return this.container.getNode(this.video2Id);
	},

	duration:function(ignoreTrimming) {
		if (this.trimming.enabled && !ignoreTrimming) {
			return this.trimming.end - this.trimming.start;
		}
		else {
			if (!this.videoDuration) {
				this.videoDuration = this.masterVideo().duration();
			}
			return this.videoDuration;
		}
	},

	paused:function() {
		return this.masterVideo() ? this.masterVideo().isPaused():true;
	},

	trimEnabled:function() {
		return this.trimming.enabled;
	},

	trimStart:function() {
		if (this.trimming.enabled) {
			return this.trimming.start;
		}
		else {
			return 0;
		}
	},

	trimEnd:function() {
		if (this.trimming.enabled) {
			return this.trimming.end;
		}
		else {
			return this.duration();
		}
	},

	setMasterQuality:function(quality) {
		this._masterQuality = quality;
	},
	
	setSlaveQuality:function(quality) {
		this._slaveQuality = quality;		
	},

	setStartTime:function(time) {
//		this._startTime = time;
		this.seekToTime(time);
	},

	reloadVideos:function(masterQuality,slaveQuality) {	
		var isPaused = paella.player.videoContainer.paused();			
		this._showPosterFrame = false;
		var memorizedCurrentTime = this.currentTime();
		var masterVideo = this.masterVideo();
		//if(masterVideo) masterVideo.freeze();
		var slaveVideo = this.slaveVideo();
		//if(slaveVideo) slaveVideo.freeze();
		var masterVolume = masterVideo.volume();
		var slaveVolume = slaveVideo && slaveVideo.volume();
		 		
		this.setMasterQuality(masterQuality);
		this.setSlaveQuality(slaveQuality);
		
		var currentMastr = this.currentMasterVideoData;
		var currentSlave = this.currentSlaveVideoData;
		
		var newMasterSrc = this._videoSourceData.master ? this.selectSource(this._videoSourceData.master.data,this._videoSourceData.master.type.name):null;
		var newSlaveSrc = this._videoSourceData.slave ? this.selectSource(this._videoSourceData.slave.data,this._videoSourceData.slave.type.name):null;
		if (newMasterSrc) {
			newMasterSrc = this.getVideoQuality(newMasterSrc,'master');
		}
		if (newSlaveSrc) {
			newSlaveSrc = this.getVideoQuality(newSlaveSrc,'slave');
		}
		
		if (currentMastr.res.w!=newMasterSrc.res.w || currentMastr.res.h!=newMasterSrc.res.h ||
			currentMastr.res.w!=newMasterSrc.res.w || currentMastr.res.h!=newMasterSrc.res.h) {
			if (masterVideo) masterVideo.unload();
			if (slaveVideo) slaveVideo.unload();
			this._seekToOnLoad = memorizedCurrentTime;
			this.setSources(this._videoSourceData.master,this._videoSourceData.slave);
			masterVideo = this.masterVideo();
			slaveVideo = this.slaveVideo();			
			if (masterVideo) masterVideo.setVolume(masterVolume);
			if (slaveVideo) slaveVideo.setVolume(slaveVolume);
			this.seekToTime(this._seekToOnLoad);
			this._playOnLoad = false;
			if (!isPaused) {
				$(document).trigger(paella.events.play);
				this._playOnLoad = true;
			}
/*			if (masterVideo) {
				$(masterVideo.domElement).bind('timeupdate', function(evt) {
					masterVideo.unFreeze();
				});
			}
			if (slaveVideo) {
				$(slaveVideo.domElement).bind('timeupdate', function(evt) {
					slaveVideo.unFreeze();
				});
			}
			*/
		}
	},

	/**
	  *	master: { data, type }
	  * slave: { data, type } | null
	  */
	setSources:function(master,slave) {
		var masterRect = {x:850,y:140,w:360,h:550};
		var slaveRect = {x:10,y:40,w:800,h:600};
		
		this._unloadVideos();

		if (!master || !master.data || !master.type || !master.type.name) {
			throw new Error("Error in video configuration. Master video data not found");
		}

		this._setSource(master.data, this.video1Id, master.type, 'master', masterRect);
		this._videoSourceData = {
			master:master
		};
		if (slave && slave.data  && slave.type) {
			this._setSource(slave.data, this.video2Id, slave.type, 'slave', slaveRect);
			this._videoSourceData.slave = slave;
		}
		else {
			this.setMonoStreamMode(true);
		}
	},
	
	setAutoplay:function() {
		this._autoplay = true;
		if (this.masterVideo()) {
			this.masterVideo().setAutoplay(true);
		}
		if (this.slaveVideo()) {
			this.slaveVideo().setAutoplay(true);
		}
	},
	
	onVideoLoaded:function(sender) {
		if ((this.isMonostream && this.masterVideo() && this.masterVideo().isReady()) ||
			(this.masterVideo() && this.masterVideo().isReady() &&
			 this.slaveVideo() && this.slaveVideo().isReady())) {
			
			if (this._playOnLoad) {
				paella.player.play();
			}

			if (this._seekToOnLoad) {
				paella.player.videoContainer.seekToTime(this._seekToOnLoad);
			}
			paella.events.trigger(paella.events.videoReady, { videoContainer: this });
		}
	},
	
	onVideoUnloaded:function(sender) {
		if (this.isMonostream) {
			paella.events.trigger(paella.events.videoUnloaded);
		}
		else if (this.masterVideo() && !this.masterVideo().isReady() &&
				this.slaveVideo() && !this.slaveVideo().isReady()){
			paella.events.trigger(paella.events.videoUnloaded);
		}
	},
	
	_unloadVideos:function() {
		var master = this.masterVideo();
		var slave = this.slaveVideo();
		if (master) {
			this.container.removeNode(master);
		}
		if (slave) {
			this.container.removeNode(slave);
		}
		this.isMasterReady = false;
		this.isSlaveReady = false;
		this.masterVideoData = null;
		this.slaveVideoData = null;
		this.sourceData = [];
	},

	_setSource:function(data,videoNodeId,type,target,rect) {
		var videoNode = null;
		switch (type.name) {
			case 'html':
				videoNode = new paella.Html5Video(videoNodeId,rect.x,rect.y,rect.w,rect.h);
				break;
			case 'flash':
				videoNode = new paella.FlashVideo(videoNodeId,rect.x,rect.y,rect.w,rect.h);
				videoNode.streamingMode = false;
				break;
			case 'streaming':
				if (this.supportHLS() && data.sources.hls) {
					videoNode = new paella.Html5Video(videoNodeId,rect.x,rect.y,rect.w,rect.h);
				}
				else {
					videoNode = new paella.FlashVideo(videoNodeId, rect.x, rect.y, rect.w, rect.h);
				}
				videoNode.streamingMode = true;
				break;
			case 'image':
				videoNode = new paella.SlideshowVideo(videoNodeId,rect.x,rect.y,rect.w,rect.h);
				break;
		}
		if (this._autoplay) {
			videoNode.setAutoplay(true);
		}
		if (target=='master') {
			videoNode.setDefaultVolume(this._defaultMasterVolume);
			this.masterVideoData = data;
		}
		else {
			videoNode.setDefaultVolume(this._defaultSlaveVolume);
			this.slaveVideoData = data;
		}
		if (this._showPosterFrame && data.preview) {
			videoNode.setPosterFrame(data.preview);
		}
		videoNode.setClassName(this.videoClasses[target]);
		this.container.addNode(videoNode);
		this.sourceData.push(data);
		this.setupVideo(videoNode,data,type.name,target);
		
		return true;
	},
	
	selectSource:function(videoData,type) {
		var mp4Source = videoData.sources.mp4;
		var oggSource = videoData.sources.ogg;
		var webmSource = videoData.sources.webm;
		var flvSource = videoData.sources.flv;
		var rtmpSource = videoData.sources.rtmp;
		var hlsSource = videoData.sources.hls;
		var imageSource = videoData.sources.image;

		var selectedSource = null;

		if (type=="html") {
			if (mp4Source) {
				selectedSource = mp4Source;
			}
			if (oggSource) {
				selectedSource = oggSource;
			}
			if (webmSource) {
				selectedSource = webmSource;
			}
		}
		else if (flvSource && type=="flash") {
			selectedSource = flvSource;
		}
		else if (mp4Source && type=="flash") {
			selectedSource = mp4Source;
		}
		else if (rtmpSource && !this.supportHLS() && type=="streaming"){
			selectedSource = rtmpSource;
		}
		else if (hlsSource && this.supportHLS() && type=="streaming") {
			selectedSource = hlsSource;
		}
		else if (imageSource && type=="image") {
			selectedSource = imageSource;
		}
		
		return selectedSource;
	},

	supportHLS:function() {
		return base.userAgent.system.iOS;
	},

	setMonoStreamMode:function() {
		this.isMonostream = true;
		this.isSlaveReady = true;
	},

	getVideoQuality:function(source,stream) {
		var userSelection = null;
		if (stream=="master") {
			userSelection = this._masterQuality;
		}
		else if (stream=="slave") {
			userSelection = this._slaveQuality;
		}
		return this._videoQualityStrategy.getStream(source,stream,userSelection);
	},

	setupVideo:function(videoNode,videoData,type,stream) {
		if (videoNode && videoData) {
			var selectedSource = this.selectSource(videoData,type);

			selectedSource = this.getVideoQuality(selectedSource, stream);
			if (stream=='master') this.currentMasterVideoData = selectedSource;
			else if (stream=='slave') this.currentSlaveVideoData = selectedSource;
			videoNode.addSource(selectedSource);
			videoNode.setMetadata(selectedSource);
			
			paella.userTracking.log("paella:VideoContainer:setupVideo:" + stream, selectedSource);
		}
	},

	numberOfStreams:function() {
		return this.sourceData.length;
	},

	getMonostreamMasterProfile:function() {
		return {
			content:"presenter",
			visible:true,
			layer:1,
			rect:[
				{aspectRatio:"16/9",left:0,top:0,width:1280,height:720},
				{aspectRatio:"4/3",left:160,top:0,width:960,height:720},
			]
		};
	},

	getMonostreamSlaveProfile:function() {
		return {
			content:"slides",
			visible:false,
			layer:0,
			rect:[
				{aspectRatio:"16/9",left:0,top:0,width:0,height:0},
				{aspectRatio:"4/3",left:0,top:0,width:0,height:0},
			]
		};
	},

	setProfile:function(profileName,onSuccess,animate) {
		var thisClass = this;
		var Animate = base.userAgent.browser.Explorer ? false:animate;
		paella.Profiles.loadProfile(profileName,function(profileData) {
			if (thisClass.numberOfStreams()==1) {
				profileData.masterVideo = thisClass.getMonostreamMasterProfile();
				profileData.slaveVideo = thisClass.getMonostreamSlaveProfile();
			}
			thisClass.applyProfileWithJson(profileData,Animate);
			onSuccess(profileName);
			base.cookies.set("lastProfile",profileName);
		});
	},

	isReady:function() {
		return this.isMasterReady && this.isSlaveReady;
	},

	hideAllLogos:function() {
		for (var i=0;i<this.logos.length;++i) {
			var logoId = this.logos[i];
			var logo = this.container.getNode(logoId);
			$(logo.domElement).hide();
		}
	},

	showLogos:function(logos) {
		if (logos == undefined) return;
		var relativeSize = new paella.RelativeVideoSize();
		for (var i=0; i<logos.length;++i) {
			var logo = logos[i];
			var logoId = logo.content;
			var logoNode = this.container.getNode(logoId);
			var rect = logo.rect;
			if (!logoNode) {
				style = {};
				logoNode = this.container.addNode(new paella.DomNode('img',logoId,style));
				logoNode.domElement.setAttribute('src', paella.utils.folders.profiles() + '/resources/' + logoId);
				logoNode.domElement.setAttribute('src', paella.utils.folders.profiles() + '/resources/' + logoId);
			}
			else {
				$(logoNode.domElement).show();
			}
			var percentTop = relativeSize.percentVSize(rect.top) + '%';
			var percentLeft = relativeSize.percentWSize(rect.left) + '%';
			var percentWidth = relativeSize.percentWSize(rect.width) + '%';
			var percentHeight = relativeSize.percentVSize(rect.height) + '%';
			var style = {top:percentTop,left:percentLeft,width:percentWidth,height:percentHeight,position:'absolute',zIndex:logo.zIndex};
			$(logoNode.domElement).css(style);
		}
	},

	applyProfileWithJson:function(profileData,animate) {
		if (animate==undefined) animate = true;
		var video1 = this.container.getNode(this.video1Id);
		var video2 = this.container.getNode(this.video2Id);
		if (!video1) return;	// The video is not loaded

		var background = this.container.getNode(this.backgroundId);

		var rectMaster = profileData.masterVideo.rect[0];
		var rectSlave = profileData.slaveVideo.rect[0];
		var masterDimensions = video1.getDimensions();
		var slaveDimensions = {width:360,height:240};
		if (video2) slaveDimensions = video2.getDimensions();
		var masterAspectRatio = (masterDimensions.height==0) ? 1.3333:masterDimensions.width / masterDimensions.height;
		var slaveAspectRatio = (slaveDimensions.height==0) ? 1.3333:slaveDimensions.width / slaveDimensions.height;
		var profileMasterAspectRatio = 1.333;
		var profileSlaveAspectRatio = 1.333;

		var minMasterDiff = 10;
		for (var i = 0; i<profileData.masterVideo.rect.length;++i) {
			var profileMaster = profileData.masterVideo.rect[i];
			if (/([0-9]+)\/([0-9]+)/.test(profileMaster.aspectRatio)) {
				profileMasterAspectRatio = Number(RegExp.$1) / Number(RegExp.$2);
			}
			var masterDiff = Math.abs(profileMasterAspectRatio - masterAspectRatio);
			if (minMasterDiff>masterDiff) {
				minMasterDiff = masterDiff;
				rectMaster = profileMaster;
			}
			//base.log.debug(profileMasterAspectRatio + ' - ' + masterAspectRatio + ' = ' + masterDiff);
		}

		var minSlaveDiff = 10;
		for (i = 0; i<profileData.slaveVideo.rect.length;++i) {
			var profileSlave = profileData.slaveVideo.rect[i];
			if (/([0-9]+)\/([0-9]+)/.test(profileSlave.aspectRatio)) {
				profileSlaveAspectRatio = Number(RegExp.$1) / Number(RegExp.$2);
			}
			var slaveDiff = Math.abs(profileSlaveAspectRatio - slaveAspectRatio);
			if (minSlaveDiff>slaveDiff) {
				minSlaveDiff = slaveDiff;
				rectSlave = profileSlave;
			}
		}

		// Logos
		// Hide previous logos
		this.hideAllLogos();

		// Create or show new logos
		this.showLogos(profileData.logos);

		if (dynamic_cast("paella.ProfileFrameStrategy",this.profileFrameStrategy)) {
			var containerSize = { width:$(this.domElement).width(), height:$(this.domElement).height() };
			var scaleFactor = rectMaster.width / containerSize.width;
			var scaledMaster = { width:masterDimensions.width*scaleFactor, height:masterDimensions.height*scaleFactor };
			rectMaster.left = Number(rectMaster.left);
			rectMaster.top = Number(rectMaster.top);
			rectMaster.width = Number(rectMaster.width);
			rectMaster.height = Number(rectMaster.height);
			rectMaster = this.profileFrameStrategy.adaptFrame(scaledMaster,rectMaster);
			if (video2) {
				var scaledSlave = { width:slaveDimensions.width * scaleFactor, height:slaveDimensions.height * scaleFactor };
				rectSlave.left = Number(rectSlave.left);
				rectSlave.top = Number(rectSlave.top);
				rectSlave.width = Number(rectSlave.width);
				rectSlave.height = Number(rectSlave.height);
				rectSlave = this.profileFrameStrategy.adaptFrame(scaledSlave,rectSlave);
			}
		}

		video1.setRect(rectMaster,animate);
		this.currentMasterVideoRect = rectMaster;
		video1.setVisible(profileData.masterVideo.visible,animate);
		this.currentMasterVideoRect.visible = /true/i.test(profileData.masterVideo.visible) ? true:false;
		this.currentMasterVideoRect.layer = parseInt(profileData.masterVideo.layer);
		if (video2) {
			video2.setRect(rectSlave,animate);
			this.currentSlaveVideoRect = rectSlave;
			this.currentSlaveVideoRect.visible = /true/i.test(profileData.slaveVideo.visible) ? true:false;
			this.currentSlaveVideoRect.layer = parseInt(profileData.slaveVideo.layer);
			video2.setVisible(profileData.slaveVideo.visible,animate);
			video2.setLayer(profileData.slaveVideo.layer);
		}
		video1.setLayer(profileData.masterVideo.layer);
		background.setImage(paella.utils.folders.profiles() + '/resources/' + profileData.background.content);
	},

	resizePortrail:function() {
		var width = (paella.player.isFullScreen() == true) ? $(window).width() : $(this.domElement).width();
		var relativeSize = new paella.RelativeVideoSize();
		var height = relativeSize.proportionalHeight(width);
		this.container.domElement.style.width = width + 'px';
		this.container.domElement.style.height = height + 'px';

		var containerHeight = (paella.player.isFullScreen() == true) ? $(window).height() : $(this.domElement).height();
		var newTop = containerHeight / 2 - height / 2;
		this.container.domElement.style.top = newTop + "px";
	},

	resizeLandscape:function() {
		var height = (paella.player.isFullScreen() == true) ? $(window).height() : $(this.domElement).height();
		var relativeSize = new paella.RelativeVideoSize();
		var width = relativeSize.proportionalWidth(height);
		this.container.domElement.style.width = width + 'px';
		this.container.domElement.style.height = height + 'px';
		this.container.domElement.style.top = '0px';
	},

	onresize:function() {
		this.parent();
		var relativeSize = new paella.RelativeVideoSize();
		var aspectRatio = relativeSize.aspectRatio();
		var width = (paella.player.isFullScreen() == true) ? $(window).width() : $(this.domElement).width();
		var height = (paella.player.isFullScreen() == true) ? $(window).height() : $(this.domElement).height();
		var containerAspectRatio = width/height;

		if (containerAspectRatio>aspectRatio) {
			this.resizeLandscape();
		}
		else {
			this.resizePortrail();
		}
	}
});

/*** File: src/05_plugin_base.js ***/

Class ("paella.PluginManager", {
	targets:null,
	pluginList: [],
	eventDrivenPlugins: [],
	enabledPlugins: [],


//	checkPluginVisibility

	setupPlugin: function(plugin) {
		plugin.setup();
		this.enabledPlugins.push(plugin);
		if (dynamic_cast("paella.UIPlugin", plugin)) {
			plugin.checkVisibility();
		}	
	},


	checkPluginsVisibility: function() {	
		this.enabledPlugins.forEach(function(plugin) {		
			if (dynamic_cast("paella.UIPlugin", plugin)) {
				plugin.checkVisibility();
			}								
		});	
	},

	initialize:function() {
		this.targets = {};
		var thisClass = this;
		paella.events.bind(paella.events.loadPlugins,function(event) {
			thisClass.loadPlugins("paella.DeferredLoadPlugin");
		});
	},

	setTarget:function(pluginType,target) {
		if (target.addPlugin) {
			this.targets[pluginType] = target;
		}
	},

	getTarget:function(pluginType) {
		// PluginManager can handle event-driven events:
		if (pluginType=="eventDriven") {
			return this;
		}
		else {
			var target = this.targets[pluginType];
			return target;
		}
	},

	registerPlugin:function(plugin) {
		// Registra los plugins en una lista y los ordena
		this.importLibraries(plugin);
		this.pluginList.push(plugin);
		this.pluginList.sort(function(a,b) {
			return a.getIndex() - b.getIndex();
		});
	},

	importLibraries:function(plugin) {
		plugin.getDependencies().forEach(function(lib) {
			var script = document.createElement('script');
			script.type = "text/javascript";
			script.src = 'javascript/' + lib + '.js';
			document.head.appendChild(script);
		});
	},
	
	// callback => function(plugin,pluginConfig)
	loadPlugins:function(pluginBaseClass) {
		if (pluginBaseClass != undefined) {
			var This = this;
			this.foreach(function(plugin,config) {
				if (dynamic_cast(pluginBaseClass, plugin) != null) {
					if (config.enabled) {
						base.log.debug("Load plugin (" + pluginBaseClass + "): " + plugin.getName());
						plugin.config = config;							
						plugin.load(This);
					}				
				}
			});
		}
	},	
	
	foreach:function(callback) {
		var enablePluginsByDefault = false;
		var pluginsConfig = {};
		try {
			enablePluginsByDefault = paella.player.config.plugins.enablePluginsByDefault;
		}
		catch(e){}
		try {
			pluginsConfig = paella.player.config.plugins.list;
		}
		catch(e){}
				
		this.pluginList.forEach(function(plugin){			
			var name = plugin.getName();
			var config = pluginsConfig[name];
			if (!config) {
				config = {enabled: enablePluginsByDefault};
			}
			callback(plugin, config);
		});
	},

	addPlugin:function(plugin) {
		var thisClass = this;
		plugin.checkEnabled(function(isEnabled) {
			if (plugin.type=="eventDriven" && isEnabled) {
				paella.pluginManager.setupPlugin(plugin);
				thisClass.eventDrivenPlugins.push(plugin);
				var events = plugin.getEvents();
				var eventBind = function(event,params) {
					plugin.onEvent(event.type,params);
				};

				for (var i=0; i<events.length;++i) {
					var eventName = events[i];
					paella.events.bind(eventName, eventBind);
				}
			}
		});
	},

	getPlugin:function(name) {
		for (var i=0;i<this.pluginList.length;++i) {
			if (this.pluginList[i].getName()==name) return this.pluginList[i];
		}
		return null;
	}
});

paella.pluginManager = new paella.PluginManager();

Class ("paella.Plugin", {
	type:'',

	initialize:function() {
		var thisClass = this;
		paella.pluginManager.registerPlugin(this);
	},

	getDependencies:function() {
		return [];
	},

	load:function(pluginManager) {
		var target = pluginManager.getTarget(this.type);
		if (target && target.addPlugin) {
			target.addPlugin(this);
		}
	},

	getRootNode:function(id) {
		return null;
	},

	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	setup:function() {

	},

	getIndex:function() {
		return 0;
	},

	getName:function() {
		return "";
	}
});



Class ("paella.FastLoadPlugin", paella.Plugin, {});
Class ("paella.EarlyLoadPlugin", paella.Plugin, {});
Class ("paella.DeferredLoadPlugin", paella.Plugin, {});



Class ("paella.PopUpContainer", paella.DomNode,{
	containers:null,
	currentContainerId:-1,

	initialize:function(id,className) {
		var This = this;
		var style = {};
		this.parent('div',id,style);
		this.domElement.className = className;

		this.containers = {};
	},

	hideContainer:function(identifier,button) {
		var container = this.containers[identifier];
		if (container && this.currentContainerId==identifier) {
			container.identifier = identifier;
			paella.events.trigger(paella.events.hidePopUp,{container:container});
			container.plugin.willHideContent();
			$(container.element).hide();
			container.button.className = container.button.className.replace(' selected','');
			$(this.domElement).css({width:'0px'});
			this.currentContainerId = -1;
			container.plugin.didHideContent();
		}
	},

	showContainer:function(identifier, button) {
		var thisClass = this;
		var width = 0;
		
		function hideContainer(container) {
			paella.events.trigger(paella.events.hidePopUp,{container:container});
			container.plugin.willHideContent();
			$(container.element).hide();
			$(thisClass.domElement).css({width:'0px'});
			container.button.className = container.button.className.replace(' selected','');
			thisClass.currentContainerId = -1;
			container.plugin.didHideContent();			
		}
		function showContainer(container) {
			paella.events.trigger(paella.events.showPopUp,{container:container});
			container.plugin.willShowContent();
			container.button.className = container.button.className + ' selected';
			$(container.element).show();
			width = $(container.element).width();			
			if (container.plugin.getAlignment() == 'right') {
				var right = $(button.parentElement).width() - $(button).position().left - $(button).width();
				$(thisClass.domElement).css({width:width + 'px', right:right + 'px', left:''});				
			}
			else {
				var left = $(button).position().left;
				$(thisClass.domElement).css({width:width + 'px', left:left + 'px', right:''});						
			}			
			thisClass.currentContainerId = identifier;
			container.plugin.didShowContent();			
		}
		
		var container = this.containers[identifier];
		if (container && this.currentContainerId!=identifier && this.currentContainerId!=-1) {
			var prevContainer = this.containers[this.currentContainerId];
			hideContainer(prevContainer);
			showContainer(container);
		}
		else if (container && this.currentContainerId==identifier) {
			hideContainer(container);
		}
		else if (container) {
			showContainer(container);
		}
	},

	registerContainer:function(identifier,domElement,button,plugin) {
		var containerInfo = {
			identifier:identifier,
			button:button,
			element:domElement,
			plugin:plugin
		};
		this.containers[identifier] = containerInfo;
		// this.domElement.appendChild(domElement);
		$(domElement).hide();
		button.popUpIdentifier = identifier;
		button.sourcePlugin = plugin;
		$(button).click(function(event) {
			if (!this.plugin.isPopUpOpen()) {
				paella.player.controls.playbackControl().showPopUp(this.popUpIdentifier,this);
			}
			else {
				paella.player.controls.playbackControl().hidePopUp(this.popUpIdentifier,this);
			}
		});
		$(button).keyup(function(event) {
			if ( (event.keyCode == 13) && (!this.plugin.isPopUpOpen()) ){
				paella.player.controls.playbackControl().showPopUp(this.popUpIdentifier,this);
			}
			else if ( (event.keyCode == 27)){
				paella.player.controls.playbackControl().hidePopUp(this.popUpIdentifier,this);
			}
		});
		plugin.containerManager = this;
	}
});

Class ("paella.TimelineContainer", paella.PopUpContainer,{
	hideContainer:function(identifier,button) {
		var container = this.containers[identifier];
		if (container && this.currentContainerId==identifier) {
			paella.events.trigger(paella.events.hidePopUp,{container:container});
			container.plugin.willHideContent();
			$(container.element).hide();
			container.button.className = container.button.className.replace(' selected','');
			this.currentContainerId = -1;
			$(this.domElement).css({height:'0px'});
			container.plugin.didHideContent();
		}
	},

	showContainer:function(identifier,button) {
		var height =0;
		var container = this.containers[identifier];
		if (container && this.currentContainerId!=identifier && this.currentContainerId!=-1) {
			var prevContainer = this.containers[this.currentContainerId];
			prevContainer.button.className = prevContainer.button.className.replace(' selected','');
			container.button.className = container.button.className + ' selected';
			paella.events.trigger(paella.events.hidePopUp,{container:prevContainer});
			prevContainer.plugin.willHideContent();
			$(prevContainer.element).hide();
			prevContainer.plugin.didHideContent();
			paella.events.trigger(paella.events.showPopUp,{container:container});
			container.plugin.willShowContent();
			$(container.element).show();
			this.currentContainerId = identifier;
			height = $(container.element).height();
			$(this.domElement).css({height:height + 'px'});
			container.plugin.didShowContent();
		}
		else if (container && this.currentContainerId==identifier) {
			paella.events.trigger(paella.events.hidePopUp,{container:container});
			container.plugin.willHideContent();
			$(container.element).hide();
			container.button.className = container.button.className.replace(' selected','');
			$(this.domElement).css({height:'0px'});
			this.currentContainerId = -1;
			container.plugin.didHideContent();
		}
		else if (container) {
			paella.events.trigger(paella.events.showPopUp,{container:container});
			container.plugin.willShowContent();
			container.button.className = container.button.className + ' selected';
			$(container.element).show();
			this.currentContainerId = identifier;
			height = $(container.element).height();
			$(this.domElement).css({height:height + 'px'});
			container.plugin.didShowContent();
		}
	}
});


	
Class ("paella.UIPlugin", paella.DeferredLoadPlugin, {
	ui: null,
	
	checkVisibility: function() {
		var modes = this.config.visibleOn || [	paella.PaellaPlayer.mode.standard, 
												paella.PaellaPlayer.mode.fullscreen, 
												paella.PaellaPlayer.mode.embed ];
		
		var visible = false;
		modes.forEach(function(m){
			if (m == paella.player.getPlayerMode()) {
				visible = true;
			}
		});
		
		if (visible){
			this.showUI();
		}
		else {
			this.hideUI();
		}
	},
	
	hideUI:function() {
		this.ui.setAttribute('aria-hidden', 'true');
		$(this.ui).hide();
	},
	
	showUI:function() {
		var thisClass = this;
		paella.pluginManager.enabledPlugins.forEach(function(p) {
			if (p == thisClass) {
				thisClass.ui.setAttribute('aria-hidden', 'false');
				$(thisClass.ui).show();				
			}
		});	
	},
});


Class ("paella.ButtonPlugin", paella.UIPlugin,{
	type:'button',
	subclass:'',
	container:null,
	containerManager:null,

	getAlignment:function() {
		return 'left';	// or right
	},

	// Returns the button subclass.
	getSubclass:function() {
		return "myButtonPlugin";
	},

	addSubclass:function($subclass) {
		$(this.container).addClass($subclass);
	},
	
	removeSubclass:function($subclass) {
		$(this.container).removeClass($subclass);
	},

	action:function(button) {
		// Implement this if you want to do something when the user push the plugin button
	},

	getName:function() {
		return "ButtonPlugin";
	},

	getMinWindowSize:function() {
		return 0;
	},

	buildContent:function(domElement) {
		// Override if your plugin
	},

	willShowContent:function() {
		base.log.debug(this.getName() + " willDisplayContent");
	},

	didShowContent:function() {
		base.log.debug(this.getName() + " didDisplayContent");
	},

	willHideContent:function() {
		base.log.debug(this.getName() + " willHideContent");
	},

	didHideContent:function() {
		base.log.debug(this.getName() + " didHideContent");
	},

	getButtonType:function() {
		//return paella.ButtonPlugin.type.popUpButton;
		//return paella.ButtonPlugin.type.timeLineButton;
		return paella.ButtonPlugin.type.actionButton;
	},
	
	getText:function() {
		return "";
	},
	
	setText:function(text) {
		this.container.innerHTML = text;
	},

	hideButton:function() {
		this.hideUI();
	//	this.button.setAttribute('aria-hidden', 'false');
	//	$(this.button).hide();
	},

	showButton:function() {
		this.showUI();
	//	this.button.setAttribute('aria-hidden', 'true');
	//	$(this.button).show();
	},

	// Utility functions: do not override
	changeSubclass:function(newSubclass) {
		this.subclass = newSubclass;
		this.container.className = this.getClassName();
	},

	getClassName:function() {
		return paella.ButtonPlugin.kClassName + ' ' + this.getAlignment() + ' ' + this.subclass;
	},

	getContainerClassName:function() {
		if (this.getButtonType()==paella.ButtonPlugin.type.timeLineButton) {
			return paella.ButtonPlugin.kTimeLineClassName + ' ' + this.getSubclass();
		}
		else if (this.getButtonType()==paella.ButtonPlugin.type.popUpButton) {
			return paella.ButtonPlugin.kPopUpClassName + ' ' + this.getSubclass();
		}
	},

	setToolTip:function(message) {
		this.button.setAttribute("title", message);
		this.button.setAttribute("aria-label", message);
	},

	getDefaultToolTip: function() {
		return "";
	},

	isPopUpOpen:function() {
		return (this.button.popUpIdentifier == this.containerManager.currentContainerId);
	}
});

paella.ButtonPlugin.alignment = {
	left:'left',
	right:'right'
};
paella.ButtonPlugin.kClassName = 'buttonPlugin';
paella.ButtonPlugin.kPopUpClassName = 'buttonPluginPopUp';
paella.ButtonPlugin.kTimeLineClassName = 'buttonTimeLine';
paella.ButtonPlugin.type = {
	actionButton:1,
	popUpButton:2,
	timeLineButton:3
};


paella.ButtonPlugin.buildPluginButton = function(plugin,id) {
	plugin.subclass = plugin.getSubclass();
	var elem = document.createElement('div');
	elem.className = plugin.getClassName();
	elem.id = id;
	elem.innerHTML = plugin.getText();
	elem.setAttribute("tabindex", 1000+plugin.getIndex());
	elem.setAttribute("alt", "");
	elem.setAttribute("role", "button");
	elem.plugin = plugin;
	plugin.button = elem;
	plugin.container = elem;
	plugin.ui = elem;
	plugin.setToolTip(plugin.getDefaultToolTip());
	
		
	function onAction(self) {
		paella.userTracking.log("paella:button:action", self.plugin.getName());
		self.plugin.action(self);
	}
	
	$(elem).click(function(event) {
		onAction(this);
	});
	$(elem).keyup(function(event) {
		if (event.keyCode == 13) {
			onAction(this);
		}
	});
	return elem;
};

paella.ButtonPlugin.buildPluginPopUp = function(parent,plugin,id) {
	plugin.subclass = plugin.getSubclass();
	var elem = document.createElement('div');
	parent.appendChild(elem);
	elem.className = plugin.getContainerClassName();
	elem.id = id;
	elem.plugin = plugin;
	plugin.buildContent(elem);
	return elem;
};

Class ("paella.VideoOverlayButtonPlugin", paella.ButtonPlugin,{
	type:'videoOverlayButton',

	// Returns the button subclass.
	getSubclass:function() {
		return "myVideoOverlayButtonPlugin";
	},

	action:function(button) {
		// Implement this if you want to do something when the user push the plugin button
	},

	getName:function() {
		return "VideoOverlayButtonPlugin";
	}
});


Class ("paella.EventDrivenPlugin", paella.EarlyLoadPlugin,{
	type:'eventDriven',

	initialize:function() {
		this.parent();
		var events = this.getEvents();
		for (var i = 0; i<events.length;++i) {
			var event = events[i];
			if (event==paella.events.loadStarted) {
				this.onEvent(paella.events.loadStarted);
			}
		}
	},

	getEvents:function() {
		return [];
	},

	onEvent:function(eventType,params) {
	},

	getName:function() {
		return "EventDrivenPlugin";
	}
});

/*** File: src/06_1_captions.js ***/
(function(){


var captionParserManager = new (Class ({
	_formats: {},
	
	addPlugin: function(plugin) {
		var self = this;
		var ext = plugin.ext;
		
		if ( ((Array.isArray && Array.isArray(ext)) || (ext instanceof Array)) == false) {
			ext = [ext]; 
		}
		if (ext.length == 0) {
			base.log.debug("No extension provided by the plugin " + plugin.getName());
		}
		else {
			base.log.debug("New captionParser added: " + plugin.getName());		
			ext.forEach(function(f){
				self._formats[f] = plugin;
			});
		}
	},
	initialize: function() {
		paella.pluginManager.setTarget('captionParser', this);	
	}
}))();


var SearchCallback = Class (base.AsyncLoaderCallback, {
	initialize: function(caption, text) {
		this.name = "captionSearchCallback";
		this.caption = caption;
		this.text = text;
	},

	load: function(onSuccess, onError) {
		var self = this;
		this.caption.search(this.text, function(err, result) {
			if (err) {
				onError();
			}
			else {
				self.result = result;
				onSuccess();
			}
		});
	}
});

paella.captions = {
	parsers: {},
	_captions: {},
	_activeCaption: undefined,
		
	addCaptions: function(captions) {
		var cid = captions._captionsProvider + ':' + captions._id;		
		this._captions[cid] = captions;
		paella.events.trigger(paella.events.captionAdded, cid);
	},	
		
	getAvailableLangs: function() {
		var ret = [];
		var self = this;
		Object.keys(this._captions).forEach(function(k){
			var c = self._captions[k];
			ret.push({
				id: k,
				lang: c._lang
			});
		});
		return ret;
	},
	
	getCaptions: function(cid) {	
		if (cid && this._captions[cid]) {
			return this._captions[cid];
		}
		return undefined;
	},	
	
	getActiveCaptions: function(cid) {
		return this._activeCaption;
	},
	
	setActiveCaptions: function(cid) {
		this._activeCaption = this.getCaptions(cid);
		
		if (this._activeCaption != undefined) {				
			paella.events.trigger(paella.events.captionsEnabled, cid);
		}
		else {
			paella.events.trigger(paella.events.captionsDisabled);			
		}
		
		return this._activeCaption;
	},
		
	getCaptionAtTime: function(cid, time) {
		var c = this.getCaptions(cid);		
		if (c != undefined) {
			return c.getCaptionAtTime(time);
		}
		return undefined;			
	},
	
	search: function(text, next) {
		var self = this;
		var asyncLoader = new base.AsyncLoader();
		
		this.getAvailableLangs().forEach(function(l) {			
			asyncLoader.addCallback(new SearchCallback(self.getCaptions(l.id), text));
		});
		
		asyncLoader.load(function() {
				var res = [];
				Object.keys(asyncLoader.callbackArray).forEach(function(k) {
					res = res.concat(asyncLoader.getCallback(k).result);
				});
				if (next) next(false, res);
			},
			function() {
				if (next) next(true);
			}
		);		
	}
};


Class ("paella.captions.Caption", {
	initialize: function(id, format, url, lang, next) {
		this._id = id;
		this._format = format;
		this._url = url;
		this._captions = undefined;
		this._index = lunr(function () {
			this.ref('id');
			this.field('content', {boost: 10});
		});
		
		if (typeof(lang) == "string") { lang = {code: lang, txt: lang}; }
		this._lang = lang;
		this._captionsProvider = "downloadCaptionsProvider";
		
		this.reloadCaptions(next);
	},
	
	canEdit: function(next) {
		// next(err, canEdit)
		next(false, false);
	},
	
	goToEdit: function() {	
	
	},	
	
	reloadCaptions: function(next) {
		var self = this;
	
	
		jQuery.ajax({
			url: self._url,
			cache:false,
			type: 'get',
			dataType: "text",
		})
		.done(function(dataRaw){
			var parser = captionParserManager._formats[self._format];			
			if (parser == undefined) {
				base.log.debug("Error adding captions: Format not supported!");
				if (next) { next(true); }
			}
			else {
				parser.parse(dataRaw, self._lang.code, function(err, c) {
					if (!err) {
						self._captions = c;
						
						self._captions.forEach(function(cap){
							self._index.add({
								id: cap.id,
								content: cap.content,
							});				
						});							
					}
					if (next) { next(err); }						
				});
			}			
		})
		.fail(function(error){
			base.log.debug("Error loading captions: " + self._url);
				if (next) { next(true); }
		});
	},
	
	getCaptions: function() {
		return this._captions;	
	},
	
	getCaptionAtTime: function(time) {
		if (this._captions != undefined) {
			for (var i=0; i<this._captions.length; ++i) {			
				l_cap = this._captions[i];
				if ((l_cap.begin <= time) && (l_cap.end >= time)) {
					return l_cap;
				}
			}
		}
		return undefined;		
	},
	
	getCaptionById: function(id) {
		if (this._captions != undefined) {
			for (var i=0; i<this._captions.length; ++i) {			
				l_cap = this._captions[i];
				if (l_cap.id == id) {
					return l_cap;
				}
			}
		}
		return undefined;
	},
	
	search: function(txt, next) {
		var self = this;	
		if (this._index == undefined) {
			if (next) {
				next(true, "Error. No captions found.");
			}
		}
		else {
			var results = [];
			this._index.search(txt).forEach(function(s){
				var c = self.getCaptionById(s.ref);
				
				results.push({time: c.begin, content: c.content, score: s.score});
			});		
			if (next) {
				next(false, results);
			}
		}
	}	
});




Class ("paella.CaptionParserPlugIn", paella.FastLoadPlugin, {
	type:'captionParser',
	getIndex: function() {return -1;},
	
	ext: [],
	parse: function(content, lang, next) {
		throw new Error('paella.CaptionParserPlugIn#parse must be overridden by subclass');
	}
});



}());
/*** File: src/06_2_search_service.js ***/
(function(){


var searchServiceManager = new (Class ({
	_plugins: [],
	
	addPlugin: function(plugin) {
		this._plugins.push(plugin);
	},
	initialize: function() {
		paella.pluginManager.setTarget('SearchServicePlugIn', this);	
	}
}))();


var SearchCallback = Class (base.AsyncLoaderCallback, {
	initialize: function(plugin, text) {
		this.name = "searchCallback";
		this.plugin = plugin;
		this.text = text;
	},

	load: function(onSuccess, onError) {
		var self = this;
		this.plugin.search(this.text, function(err, result) {
			if (err) {
				onError();
			}
			else {
				self.result = result;
				onSuccess();
			}
		});
	}
});


paella.searchService = {
	
	search: function(text, next) {
		var asyncLoader = new base.AsyncLoader();
		
		paella.userTracking.log("paella:searchService:search", text);
		
		searchServiceManager._plugins.forEach(function(p) {
			asyncLoader.addCallback(new SearchCallback(p, text));
		});
		
		asyncLoader.load(function() {
				var res = [];
				Object.keys(asyncLoader.callbackArray).forEach(function(k) {
					res = res.concat(asyncLoader.getCallback(k).result);
				});
				if (next) next(false, res);
			},
			function() {
				if (next) next(true);
			}
		);	
	}
};



Class ("paella.SearchServicePlugIn", paella.FastLoadPlugin, {
	type:'SearchServicePlugIn',
	getIndex: function() {return -1;},
	
	search: function(text, next) {
		throw new Error('paella.SearchServicePlugIn#search must be overridden by subclass');
	}
});


}());
/*** File: src/06_3_user_tracking.js ***/
(function(){


var userTrackingManager = new (Class ({
	_plugins: [],
	
	addPlugin: function(plugin) {
		var self = this;
		plugin.checkEnabled(function(isEnabled) {
			if (isEnabled) {
				plugin.setup();
				self._plugins.push(plugin);				
			}
		});	
	},
	initialize: function() {
		paella.pluginManager.setTarget('userTrackingSaverPlugIn', this);	
	}
}))();


paella.userTracking = {};

Class ("paella.userTracking.SaverPlugIn", paella.FastLoadPlugin, {
	type:'userTrackingSaverPlugIn',
	getIndex: function() {return -1;},	
	checkEnabled:function(onSuccess) { onSuccess(true); },
	
	log: function(event, params) {
		throw new Error('paella.userTracking.SaverPlugIn#log must be overridden by subclass');
	}
});


var evsentsToLog = {};

paella.userTracking.log = function(event, params) {
	if (evsentsToLog[event] != undefined) {
		evsentsToLog[event].cancel();		
	}
	evsentsToLog[event] = new base.Timer(function(timer) {
		userTrackingManager._plugins.forEach(function(p) {
			p.log(event, params);
		});
		delete evsentsToLog[event];
	}, 500);
};



//////////////////////////////////////////////////////////
// Log automatic events
//////////////////////////////////////////////////////////
// Log simple events
[paella.events.play, paella.events.pause, paella.events.endVideo, 
paella.events.showEditor, paella.events.hideEditor, 
paella.events.enterFullscreen, paella.events.exitFullscreen, paella.events.loadComplete].forEach(function(event){
	paella.events.bind(event, function(ev, params) {
		paella.userTracking.log(event);
	});
});

// Log show/hide PopUp
[paella.events.showPopUp, paella.events.hidePopUp].forEach(function(event){
	paella.events.bind(event, function(ev, params) {
		paella.userTracking.log(event, params.identifier);
	});
});

// Log captions Events
[/*paella.events.captionAdded,*/ paella.events.captionsEnabled, paella.events.captionsDisabled].forEach(function(event){
	paella.events.bind(event, function(ev, params) {
		var log;
		if (params != undefined) {
			var c = paella.captions.getCaptions(params);
			log = {id: params, lang: c._lang, url: c._url};
		}
		paella.userTracking.log(event, log);
	});
});

// Log setProfile
[paella.events.setProfile].forEach(function(event){
	paella.events.bind(event, function(ev, params) {		
		paella.userTracking.log(event, params.profileName);
	});
});


// Log seek events
[paella.events.seekTo, paella.events.seekToTime].forEach(function(event){
	paella.events.bind(event, function(ev, params) {
		var log;
		try {
			JSON.stringify(params);
			log = params;
		}
		catch(e) {}
		
		paella.userTracking.log(event, log);
	});
});


// Log param events
[paella.events.setVolume, paella.events.resize, paella.events.setPlaybackRate].forEach(function(event){
	paella.events.bind(event, function(ev, params) {
		var log;
		try {
			JSON.stringify(params);
			log = params;
		}
		catch(e) {}
		
		paella.userTracking.log(event, log);
	});
});


}());
/*** File: src/06_ui_controls.js ***/
Class ("paella.TimeControl", paella.DomNode,{
	initialize:function(id) {
		this.parent('div',id,{left:"0%"});
		this.domElement.className = 'timeControlOld';
		this.domElement.className = 'timeControl';
		//this.domElement.innerHTML = "0:00:00";
		var thisClass = this;
		paella.events.bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params); });
	},

	onTimeUpdate:function(memo) {
		var videoContainer = memo.videoContainer;
		var trimmed = { start:videoContainer.trimStart(), end:videoContainer.trimEnd() };
		var currentTime = memo.currentTime - trimmed.start;
		var duration = trimmed.end - trimmed.start;
		var percent = currentTime * 100 / duration;
		if (this.domElement.className=="timeControlOld") {	// Support for old style time control
			this.domElement.style.left = percent + '%';
		}
		this.domElement.innerHTML = this.secondsToHours(parseInt(currentTime));
	},

	secondsToHours:function(sec_numb) {
		var hours   = Math.floor(sec_numb / 3600);
		var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
		var seconds = sec_numb - (hours * 3600) - (minutes * 60);

		if (hours < 10) {hours = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}
		return hours + ':' + minutes + ':' + seconds;
	}
});

Class ("paella.PlaybackBar", paella.DomNode,{
	playbackFullId:'',
	updatePlayBar:true,
	timeControlId:'',
	//OVERLAY VARIABLES
	_images:null,
	_keys:null,
	_ant:null,
	_next:null,
	_videoLength:null,
	_lastSrc:null,
	_aspectRatio:1.777777778, // 16:9
	_hasSlides:null,
	_imgNode:null,
	_canvas:null,

	initialize:function(id) {
		var self = this;
		//OVERLAY INITIALIZE
		self.imageSetup();
		//END OVERLAY INITIALIZE

		var style = {};
		this.parent('div',id,style);
		this.domElement.className = "playbackBar";
		this.domElement.setAttribute("alt", "");
		//this.domElement.setAttribute("title", "Timeline Slider");
		this.domElement.setAttribute("aria-label", "Timeline Slider");
		this.domElement.setAttribute("role", "slider");
		this.domElement.setAttribute("aria-valuemin", "0");
		this.domElement.setAttribute("aria-valuemax", "100");
		this.domElement.setAttribute("aria-valuenow", "0");
		this.domElement.setAttribute("tabindex", "1100");
		$(this.domElement).keyup(function(event){
			var curr, selectedPosition;
			switch(event.keyCode) {
				case 37: //Left
					curr = 100*paella.player.videoContainer.currentTime()/paella.player.videoContainer.duration();
					selectedPosition = curr - 5;
					paella.player.videoContainer.seekTo(selectedPosition);
					break;
				case 39: //Right
					curr = 100*paella.player.videoContainer.currentTime()/paella.player.videoContainer.duration();
					selectedPosition = curr + 5;
					paella.player.videoContainer.seekTo(selectedPosition);
					break;
			}
		});

		this.playbackFullId = id + "_full";
		this.timeControlId = id + "_timeControl";
		var playbackFull = new paella.DomNode('div',this.playbackFullId,{width:'0%'});
		playbackFull.domElement.className = "playbackBarFull";
		this.addNode(playbackFull);
		this.addNode(new paella.TimeControl(this.timeControlId));
		var thisClass = this;
		paella.events.bind(paella.events.timeupdate,function(event,params) { thisClass.onTimeUpdate(params); });
		$(this.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation(); });
		$(playbackFull.domElement).bind('mousedown',function(event) { paella.utils.mouseManager.down(thisClass,event); event.stopPropagation();  });
		if (!base.userAgent.browser.IsMobileVersion) {
			$(this.domElement).bind('mousemove',function(event) { thisClass.movePassive(event); paella.utils.mouseManager.move(event); });
			$(playbackFull.domElement).bind('mousemove',function(event) { paella.utils.mouseManager.move(event); });
			$(this.domElement).bind("mouseout",function(event) { thisClass.mouseOut(event); });
		}
		$(this.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });
		$(playbackFull.domElement).bind('mouseup',function(event) { paella.utils.mouseManager.up(event); });

		if (paella.player.isLiveStream()) {
			$(this.domElement).hide();
		}
		setTimeout(function(){
			self.drawTimeMarks();
		},200);
	},

	mouseOut:function(event){
		var self = this;
		if(self._hasSlides)
			$("#divTimeImageOverlay").remove();
		else
			$("#divTimeOverlay").remove();
	},

	drawTimeMarks:function(){
		var self = this;
		var parent = $("#playerContainer_controls_playback_playbackBar");
		this.clearCanvas();
		if (this._keys) {
			this._keys.forEach(function (l) {
				var aux = (parseInt(l) * parent.width()) / self._videoLength; // conversion to canvas
				self.drawTimeMark(parseInt(aux));
			});
		}
	},

	drawTimeMark:function(sec){
		var ht = 12; //default height value
		var ctx = this.getCanvasContext();
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(sec,0,1,ht);	
	},

	clearCanvas:function() {
		if (this._canvas) {
			this._canvas.parentNode.removeChild(this._canvas);
			this._canvas = null;
		}
	},

	getCanvas:function(){
		if (!this._canvas) {
			var parent = $("#playerContainer_controls_playback_playbackBar");
			var canvas = document.createElement("canvas");
			canvas.className = "playerContainer_controls_playback_playbackBar_canvas";
			canvas.id = ("playerContainer_controls_playback_playbackBar_canvas");
			canvas.width = parent.width();
			ht = canvas.height = parent.height();
			parent.prepend(canvas);
			this._canvas = document.getElementById("playerContainer_controls_playback_playbackBar_canvas");
		}
		return this._canvas;
	},

	getCanvasContext:function(){
		return this.getCanvas().getContext("2d");
	},

	movePassive:function(event){
		var self = this;
		var time = 0;
		// CONTROLS_BAR POSITON
		var p = $(this.domElement);
		var pos = p.offset();

		var width = p.width();
		var left = (event.clientX-pos.left);
		left = (left < 0) ? 0 : left;
		var position = left * 100 / width; // GET % OF THE STREAM
		if(paella.player.videoContainer.trimEnabled()){
		 	time = paella.player.videoContainer.trimEnd()-paella.player.videoContainer.trimStart();
			time = ( position * time / 100 );
			time += paella.player.videoContainer.trimStart();
		}
		else{
			time = paella.player.videoContainer.duration("");
			time = ( position * time / 100 );
		}

		
		var timex = time;
		if(paella.player.videoContainer.trimEnabled())
			timex -= paella.player.videoContainer.trimStart();

		var hou = Math.floor(timex / 3600)%24;
		hou = ("00"+hou).slice(hou.toString().length);

		var min = Math.floor(timex / 60)%60;
		min = ("00"+min).slice(min.toString().length);

		var sec = Math.floor(timex%60);
		sec = ("00"+sec).slice(sec.toString().length);



		var timestr = (hou+":"+min+":"+sec);

		// CREATING THE OVERLAY
		if(self._hasSlides) {
			if($("#divTimeImageOverlay").length == 0) 
				self.setupTimeImageOverlay(timestr,pos.top,width);
			else {
				$("#divTimeOverlay")[0].innerHTML = timestr; //IF CREATED, UPDATE TIME AND IMAGE
			}

			// CALL IMAGEUPDATE
			self.imageUpdate(time);
		}
		else {
			if($("#divTimeOverlay").length == 0) self.setupTimeOnly(timestr,pos.top,width);
			else $("#divTimeOverlay")[0].innerHTML = timestr;
		}
		
		// UPDATE POSITION IMAGE OVERLAY

		if(self._hasSlides) {
			var ancho = $("#divTimeImageOverlay").width();
			var posx = event.clientX-(ancho/2);
			if(event.clientX > (ancho/2 + pos.left)  &&  event.clientX < (pos.left+width - ancho/2) ) { // LEFT
			$("#divTimeImageOverlay").css("left",posx); // CENTER THE DIV HOVER THE MOUSE
			}
			else if(event.clientX < width / 2)
				$("#divTimeImageOverlay").css("left",pos.left);
			else 
				$("#divTimeImageOverlay").css("left",pos.left + width - ancho);
		}

		// UPDATE POSITION TIME OVERLAY

		var ancho2 = $("#divTimeOverlay").width();
		var posx2 = event.clientX-(ancho2/2);
		if(event.clientX > ancho2/2 + pos.left  && event.clientX < (pos.left+width - ancho2/2) ){
		$("#divTimeOverlay").css("left",posx2); // CENTER THE DIV HOVER THE MOUSE
		}
		else if(event.clientX < width / 2)
			$("#divTimeOverlay").css("left",pos.left);
		else 
			$("#divTimeOverlay").css("left",pos.left + width - ancho2-2);

		if(self._hasSlides) {
			$("#divTimeImageOverlay").css("bottom",$('.playbackControls').height());
		}

	},

	imageSetup:function(){
		var self = this;
		
		//  BRING THE IMAGE ARRAY TO LOCAL
		this._images = {};
		var n = paella.initDelegate.initParams.videoLoader.frameList;

		if( !n || Object.keys(n).length === 0) { self._hasSlides = false; return;}
		else self._hasSlides = true;


		this._images = n; // COPY TO LOCAL
		this._videoLength = paella.player.videoContainer.duration(""); // video duration in frames

		// SORT KEYS FOR SEARCH CLOSEST
		this._keys = Object.keys(this._images);
		this._keys = this._keys.sort(function(a, b){return parseInt(a)-parseInt(b);}); // SORT FRAME NUMBERS STRINGS

		//NEXT
		this._next = 0;
		this._ant = 0;
	},

	imageUpdate:function(sec){
		var self = this;

		var src = $("#imgOverlay").attr('src');
		$(self._imgNode).show();
				if(sec > this._next || sec < this._ant) { 
					src = self.returnSrc(sec);
					if(src){
						self._lastSrc = src;
						$( "#imgOverlay" ).attr('src', src); // UPDATING IMAGE
					}
					else self.hideImg();
				} // RELOAD IF OUT OF INTERVAL
					else { 	
						if(src!=undefined) { return; }
						else { 
							$( "#imgOverlay" ).attr('src', self._lastSrc); 
						}// KEEP LAST IMAGE
					}			

				

	},
	hideImg:function(){
		var self = this;
		$(self._imgNode).hide();
	},

	returnSrc:function(sec){
		var thisClass = this;
		var keys = Object.keys(thisClass._images);

		keys.push(sec);

		keys.sort(function(a,b){
			return parseInt(a)-parseInt(b);
		});

		var n = keys.indexOf(sec)-1;
		n = (n > 0) ? n : 0;

		var i = keys[n];

		var next = keys[n+2];
		var ant = keys[n];

		next = (next==undefined) ? keys.length-1 : parseInt(next);
		thisClass._next = next;

		ant = (ant==undefined) ? 0 : parseInt(ant);
		thisClass._ant = ant;

		i=parseInt(i);
		if(thisClass._images[i]){
			return thisClass._images[i].thumb;
		}
		else return false;
	},

	setupTimeImageOverlay:function(time_str,top,width){
		var self = this;

		var div = document.createElement("div");
		div.className = "divTimeImageOverlay";
		div.id = ("divTimeImageOverlay");

		var aux = Math.round(width/10);
		div.style.width = Math.round(aux*self._aspectRatio)+"px"; //KEEP ASPECT RATIO 4:3
		//div.style.height = Math.round(aux)+"px";

		if(self._hasSlides){
		var img = document.createElement("img");
		img.className =  "imgOverlay";
		img.id = "imgOverlay";
		self._imgNode = img;

		div.appendChild(img);
		}


		var div2 = document.createElement("div");
		div2.className = "divTimeOverlay";
		div2.style.top = (top-20)+"px"; 
		div2.id = ("divTimeOverlay");
		div2.innerHTML = time_str;

		div.appendChild(div2);

		//CHILD OF CONTROLS_BAR
		$(this.domElement).parent().append(div);
	},
	
	setupTimeOnly:function(time_str,top,width){
		var div2 = document.createElement("div");
		div2.className = "divTimeOverlay";
		div2.style.top = (top-20)+"px"; 
		div2.id = ("divTimeOverlay");
		div2.innerHTML = time_str;

		//CHILD OF CONTROLS_BAR
		$(this.domElement).parent().append(div2);
	},

	playbackFull:function() {
		return this.getNode(this.playbackFullId);
	},

	timeControl:function() {
		return this.getNode(this.timeControlId);
	},

	setPlaybackPosition:function(percent) {
		this.playbackFull().domElement.style.width = percent + '%';
	},

	isSeeking:function() {
		return !this.updatePlayBar;
	},

	onTimeUpdate:function(memo) {
		if (this.updatePlayBar) {
			var videoContainer = memo.videoContainer;
			var trimmed = { start:videoContainer.trimStart(), end:videoContainer.trimEnd() };
			var currentTime = memo.currentTime - trimmed.start;
			var duration = trimmed.end - trimmed.start;
			this.setPlaybackPosition(currentTime * 100 / duration);
		}
	},

	down:function(event,x,y) {
		this.updatePlayBar = false;
		this.move(event,x,y);
	},

	move:function(event,x,y) {
		var width = $(this.domElement).width();
		var selectedPosition = x - $(this.domElement).offset().left; // pixels
		if (selectedPosition<0) {
			selectedPosition = 0;
		}
		else if (selectedPosition>width) {
			selectedPosition = 100;
		}
		else {
			selectedPosition = selectedPosition * 100 / width; // percent
		}
		this.setPlaybackPosition(selectedPosition);
	},

	up:function(event,x,y) {
		var width = $(this.domElement).width();
		var selectedPosition = x - $(this.domElement).offset().left; // pixels
		if (selectedPosition<0) {
			selectedPosition = 0;
		}
		else if (selectedPosition>width) {
			selectedPosition = 100;
		}
		else {
			selectedPosition = selectedPosition * 100 / width; // percent
		}
		paella.player.videoContainer.seekTo(selectedPosition);
		this.updatePlayBar = true;
	},

	onresize:function() {
		this.drawTimeMarks();
	}
});

Class ("paella.PlaybackControl",paella.DomNode,{
	playbackBarId:'',
	pluginsContainer:null,
	_popUpPluginContainer:null,
	_timeLinePluginContainer:null,

	playbackPluginsWidth:0,
	popupPluginsWidth:0,

	minPlaybackBarSize:120,

	playbackBarInstance:null,

	buttonPlugins:[],

	addPlugin:function(plugin) {
		var This = this;

		var id = 'buttonPlugin' + this.buttonPlugins.length;
		this.buttonPlugins.push(plugin);
		var button = paella.ButtonPlugin.buildPluginButton(plugin,id);
		plugin.button = button;
		this.pluginsContainer.domElement.appendChild(button);
		$(button).hide();
		plugin.checkEnabled(function(isEnabled) {
			var parent;
			if (isEnabled) {
				$(plugin.button).show();
				paella.pluginManager.setupPlugin(plugin);

				var id = 'buttonPlugin' + This.buttonPlugins.length;
				if (plugin.getButtonType()==paella.ButtonPlugin.type.popUpButton) {
					parent = This.popUpPluginContainer.domElement;
					var popUpContent = paella.ButtonPlugin.buildPluginPopUp(parent,plugin,id + '_container');
					This.popUpPluginContainer.registerContainer(plugin.getName(),popUpContent,button,plugin);
				}
				else if (plugin.getButtonType()==paella.ButtonPlugin.type.timeLineButton) {
					parent = This.timeLinePluginContainer.domElement;
					var timeLineContent = paella.ButtonPlugin.buildPluginPopUp(parent, plugin,id + '_timeline');
					This.timeLinePluginContainer.registerContainer(plugin.getName(),timeLineContent,button,plugin);
				}
			}
			else {
				This.pluginsContainer.domElement.removeChild(plugin.button);
			}
		});
	},

	initialize:function(id) {
		var style = {};
		this.parent('div',id,style);
		this.domElement.className = 'playbackControls';
		this.playbackBarId = id + '_playbackBar';

		var thisClass = this;
		this.pluginsContainer = new paella.DomNode('div',id + '_playbackBarPlugins');
		this.pluginsContainer.domElement.className = 'playbackBarPlugins';
		this.pluginsContainer.domElement.setAttribute("role", "toolbar");
		this.addNode(this.pluginsContainer);

		this.addNode(new paella.PlaybackBar(this.playbackBarId));

		paella.pluginManager.setTarget('button',this);

		Object.defineProperty(
				this,
				"popUpPluginContainer",
				{
					get: function() {
						if (!this._popUpPluginContainer) {
							this._popUpPluginContainer = new paella.PopUpContainer(id + '_popUpPluginContainer','popUpPluginContainer');
							this.addNode(this._popUpPluginContainer);
						}
						return this._popUpPluginContainer;
					}
				}
		);

		Object.defineProperty(
				this,
				"timeLinePluginContainer",
				{
					get: function() {
						if (!this._timeLinePluginContainer) {
							this._timeLinePluginContainer = new paella.TimelineContainer(id + '_timelinePluginContainer','timelinePluginContainer');
							this.addNode(this._timeLinePluginContainer);
						}
						return this._timeLinePluginContainer;
					}
				}
		);
	},

	showPopUp:function(identifier,button) {
		this.popUpPluginContainer.showContainer(identifier,button);
		this.timeLinePluginContainer.showContainer(identifier,button);
	},

	hidePopUp:function(identifier,button) {
		this.popUpPluginContainer.hideContainer(identifier,button);
		this.timeLinePluginContainer.hideContainer(identifier,button);
	},

	playbackBar:function() {
		if (this.playbackBarInstance==null) {
			this.playbackBarInstance = this.getNode(this.playbackBarId);
		}
		return this.playbackBarInstance;
	},

	onresize:function() {
		var windowSize = $(this.domElement).width();
		base.log.debug("resize playback bar (width=" + windowSize + ")");

		for (var i=0;i<this.buttonPlugins.length;++i) {
			var plugin = this.buttonPlugins[i];
			var minSize = plugin.getMinWindowSize();
			if (minSize > 0 && windowSize < minSize) {
				plugin.hideUI();
			}
			else {
				plugin.checkVisibility();
			}
		}

		this.getNode(this.playbackBarId).onresize();
	}
});

Class ("paella.ControlsContainer", paella.DomNode,{
	playbackControlId:'',
	editControlId:'',
	isEnabled:true,

	autohideTimer:null,
	hideControlsTimeMillis:3000,

	playbackControlInstance:null,

	videoOverlayButtons:null,

	buttonPlugins:[],
	
	_hidden:false,

	addPlugin:function(plugin) {
		var thisClass = this;
		var id = 'videoOverlayButtonPlugin' + this.buttonPlugins.length;
		this.buttonPlugins.push(plugin);
		var button = paella.ButtonPlugin.buildPluginButton(plugin,id);
		this.videoOverlayButtons.domElement.appendChild(button);
		plugin.button = button;
		$(button).hide();
		plugin.checkEnabled(function(isEnabled) {
			if (isEnabled) {
				$(plugin.button).show();
				paella.pluginManager.setupPlugin(plugin);
			}
		});
	},

	initialize:function(id) {
		this.parent('div',id);
		this.viewControlId = id + '_view';
		this.playbackControlId = id + '_playback';
		this.editControlId = id + '_editor';
		this.addNode(new paella.PlaybackControl(this.playbackControlId));
		var thisClass = this;
		paella.events.bind(paella.events.showEditor,function(event) { thisClass.onShowEditor(); });
		paella.events.bind(paella.events.hideEditor,function(event) { thisClass.onHideEditor(); });

		paella.events.bind(paella.events.play,function(event) { thisClass.onPlayEvent(); });
		paella.events.bind(paella.events.pause,function(event) { thisClass.onPauseEvent(); });
		$(document).mousemove(function(event) {
			paella.player.controls.restartTimerEvent();
		});
		paella.events.bind(paella.events.endVideo,function(event) { thisClass.onEndVideoEvent(); });
		paella.events.bind('keydown',function(event) { thisClass.onKeyEvent(); });

		this.videoOverlayButtons = new paella.DomNode('div',id + '_videoOverlayButtonPlugins');
		this.videoOverlayButtons.domElement.className = 'videoOverlayButtonPlugins';
		this.videoOverlayButtons.domElement.setAttribute("role", "toolbar");
		this.addNode(this.videoOverlayButtons);

		paella.pluginManager.setTarget('videoOverlayButton',this);
	},

	onShowEditor:function() {
		var editControl = this.editControl();
		if (editControl) $(editControl.domElement).hide();
	},

	onHideEditor:function() {
		var editControl = this.editControl();
		if (editControl) $(editControl.domElement).show();
	},

//	showEditorButton:function() {
//		this.addNode(new EditControl(this.editControlId));
//	},

	enterEditMode:function() {
		var playbackControl = this.playbackControl();
		var editControl = this.editControl();
		if (playbackControl && editControl) {
			$(playbackControl.domElement).hide();
		}
	},

	exitEditMode:function() {
		var playbackControl = this.playbackControl();
		var editControl = this.editControl();
		if (playbackControl && editControl) {
			$(playbackControl.domElement).show();
		}
	},

	playbackControl:function() {
		if (this.playbackControlInstance==null) {
			this.playbackControlInstance = this.getNode(this.playbackControlId);
		}
		return this.playbackControlInstance;
	},

	editControl:function() {
		return this.getNode(this.editControlId);
	},

	disable:function() {
		this.isEnabled = false;
		this.hide();
	},

	enable:function() {
		this.isEnabled = true;
		this.show();
	},

	isHidden:function() {
		return this._hidden;
	},

	hide:function() {
		var This = this;
		this._doHide = true;
		
		function hideIfNotCanceled() {
			if (This._doHide) {
				$(This.domElement).css({opacity:0.0});
				$(This.domElement).hide();
				This.domElement.setAttribute('aria-hidden', 'true');
				This._hidden = true;
				paella.events.trigger(paella.events.controlBarDidHide);
			}
		}

		paella.events.trigger(paella.events.controlBarWillHide);
		if (This._doHide) {
			if (!base.userAgent.browser.IsMobileVersion && !base.userAgent.browser.Explorer) {			
				$(this.domElement).animate({opacity:0.0},{duration:300, complete: hideIfNotCanceled});
			}
			else {
				hideIfNotCanceled();
			}		
		}
	},

	showPopUp:function(identifier) {
		this.playbackControl().showPopUp(identifier);
	},

	hidePopUp:function(identifier) {
		this.playbackControl().hidePopUp(identifier);
	},

	show:function() {
		if (this.isEnabled) {
			$(this.domElement).stop();
			this._doHide = false;
			this.domElement.style.opacity = 1.0;
			this.domElement.setAttribute('aria-hidden', 'false');
			this._hidden = false;
			$(this.domElement).show();
			paella.events.trigger(paella.events.controlBarDidShow);
		}
	},

	autohideTimeout:function() {
		var playbackBar = this.playbackControl().playbackBar();
		if (playbackBar.isSeeking()) {
			paella.player.controls.restartHideTimer();
		}
		else {
			paella.player.controls.hideControls();
		}
	},

	hideControls:function() {
		this.hide();
	},

	showControls:function() {
		this.show();
	},

	onPlayEvent:function() {
		this.restartHideTimer();
	},

	onPauseEvent:function() {
		this.clearAutohideTimer();
	},

	onEndVideoEvent:function() {
		this.show();
		this.clearAutohideTimer();
	},

	onKeyEvent:function() {
		this.showControls();
		if (paella.player.videoContainer.isReady() && !paella.player.videoContainer.paused()) {
			paella.player.controls.restartHideTimer();
		}
	},

	cancelHideBar:function() {
		this.restartTimerEvent();
	},

	restartTimerEvent:function() {
		if (this.isHidden()){
			this.showControls();
		}
		this._doHide = false;
		var paused = paella.player.videoContainer.paused();
		if (!paused) {
			this.restartHideTimer();
		}
	},

	clearAutohideTimer:function() {
		if (this.autohideTimer!=null) {
			this.autohideTimer.cancel();
			this.autohideTimer = null;
		}
	},

	restartHideTimer:function() {
		this.clearAutohideTimer();
		var thisClass = this;
		this.autohideTimer = new base.Timer(function(timer) {
			thisClass.autohideTimeout();
		},this.hideControlsTimeMillis);
	},

	onresize:function() {
		this.playbackControl().onresize();
	}
});

/*** File: src/07_ui_extras.js ***/
Class ("paella.LoaderContainer", paella.DomNode,{
	timer:null,
	loader:null,
	loaderPosition:0,

	initialize:function(id) {
		this.parent('div',id,{position:'fixed',backgroundColor:'white',opacity:'0.7',top:'0px',left:'0px',right:'0px',bottom:'0px',zIndex:10000});
		this.loader = this.addNode(new paella.DomNode('div','',{position:'fixed',width:'128px',height:'128px',top:'50%',left:'50%',marginLeft:'-64px',marginTop:'-64px',backgroundImage:'url(' + paella.utils.folders.resources() + '/images/loader.png)'}));
		var thisClass = this;
		paella.events.bind(paella.events.loadComplete,function(event,params) { thisClass.loadComplete(params); });
		this.timer = new base.Timer(function(timer) {
			thisClass.loaderPosition -= 128;
			thisClass.loader.domElement.style.backgroundPosition = thisClass.loaderPosition + 'px';
		},1000);
		this.timer.repeat = true;
	},

	loadComplete:function(params) {
		$(this.domElement).hide();
		this.timer.repeat = false;
	}
});

Class ("paella.KeyManager", {
	isPlaying:false,
	Keys:{Space:32,Left:37,Up:38,Right:39,Down:40,A:65,B:66,C:67,D:68,E:69,F:70,G:71,H:72,I:73,J:74,K:75,L:76,M:77,N:78,O:79,P:80,Q:81,R:82,S:83,T:84,U:85,V:86,W:87,X:88,Y:89,Z:90},

	enabled:true,

	initialize:function() {
		var thisClass = this;
		paella.events.bind(paella.events.loadComplete,function(event,params) { thisClass.loadComplete(event,params); });
		paella.events.bind(paella.events.play,function(event) { thisClass.onPlay(); });
		paella.events.bind(paella.events.pause,function(event) { thisClass.onPause(); });
	},

	loadComplete:function(event,params) {
		var thisClass = this;
		paella.events.bind("keyup",function(event) { thisClass.keyUp(event); });
	},

	onPlay:function() {
		this.isPlaying = true;
	},

	onPause:function() {
		this.isPlaying = false;
	},

	keyUp:function(event) {
		if (!this.enabled) return;

		// Matterhorn standard keys
		if (event.altKey && event.ctrlKey) {
			if (event.which==this.Keys.P) {
				this.togglePlayPause();
			}
			else if (event.which==this.Keys.S) {
				this.pause();
			}
			else if (event.which==this.Keys.M) {
				this.mute();
			}
			else if (event.which==this.Keys.U) {
				this.volumeUp();
			}
			else if (event.which==this.Keys.D) {
				this.volumeDown();
			}
		}
		else { // Paella player keys
			if (event.which==this.Keys.Space) {
				this.togglePlayPause();
			}
			else if (event.which==this.Keys.Up) {
				this.volumeUp();
			}
			else if (event.which==this.Keys.Down) {
				this.volumeDown();
			}
			else if (event.which==this.Keys.M) {
				this.mute();
			}
		}
	},

	togglePlayPause:function() {
		if (this.isPlaying) {
			paella.player.pause();
		}
		else {
			paella.player.play();
		}
	},

	pause:function() {
		paella.player.pause();
	},

	mute:function() {
		var videoContainer = paella.player.videoContainer;
		var newVolume = 0;
		if (videoContainer.volume()==0) newVolume = 1.0;
		paella.player.videoContainer.setVolume({ master:newVolume, slave: 0});
	},

	volumeUp:function() {
		var videoContainer = paella.player.videoContainer;
		var volume = videoContainer.volume();
		volume += 0.1;
		volume = (volume>1) ? 1.0:volume;
		paella.player.videoContainer.setVolume({ master:volume, slave: 0});
	},

	volumeDown:function() {
		var videoContainer = paella.player.videoContainer;
		var volume = videoContainer.volume();
		volume -= 0.1;
		volume = (volume<0) ? 0.0:volume;
		paella.player.videoContainer.setVolume({ master:volume, slave: 0});
	}
});

paella.keyManager = new paella.KeyManager();

/*** File: src/08_paella_core.js ***/
Class ("paella.AccessControl", {
	permissions:{
		canRead:false,
		canContribute:false,
		canWrite:false,
		loadError:true,
		isAnonymous:false
	},

	userData:{
		username:'',
		name:'',
		lastname: '',
		avatar:'',
	},

	checkAccess:function(onSuccess) {
		onSuccess(this.permissions);
	},

	getAuthenticationUrl:function(callbackParam) { return ""; }
});

// Default Access Control
//
Class ("paella.DefaultAccessControl", paella.AccessControl,{
	_authParams:null,

	initialize:function(authParams) {
		this._authParams = authParams || {};
	},

	checkAccess:function(onSuccess) {
		var This = this;
		this.getUserData(function(data) {
			This.permissions = data.permissions;
			This.userData = data.userData;
			onSuccess(This.permissions);
		});
	},

	getUserData:function(onSuccess) {
		var status = false;
		if (paella.player.config.auth) {
			var callback = paella.player.config.auth.userDataCallbackName ? window[paella.player.config.auth.userDataCallbackName]:null;
			if (typeof(callback)=="function") {
				status = true;
				callback(onSuccess);
			}
		}
		if (!status) {
			onSuccess({
				permissions: {
					canRead: true,
					canContribute: false,
					canWrite: false,
					loadError: false,
					isAnonymous: true
				},
				userData: {
					username: 'anonymous',
					name: 'Anonymous',
					avatar: paella.utils.folders.resources() + '/images/default_avatar.png'
				}
			});
		}
	},

	getAuthenticationUrl:function(callbackParams) {
		var authCallback = this._authParams.authCallbackName && window[this._authParams.authCallbackName];
		if (!authCallback && paella.player.config.auth) {
			authCallback = paella.player.config.auth.authCallbackName && window[paella.player.config.auth.authCallbackName];
		}

		if (typeof(authCallback)=="function") {
			return authCallback(callbackParams);
		}
		return "";
	}
});


Class ("paella.VideoLoader", {
	metadata:{		// Video metadata
		title:"",
		duration:0
	},
	streams:[],		// {sources:{mp4:{src:"videourl.mp4",type:"video/mp4"},
					//			 ogg:{src:"videourl.ogv",type:"video/ogg"},
					//			 webm:{src:"videourl.webm",type:"video/webm"},
					//			 flv:{src:"videourl.flv",type:"video/x-flv"},
					//			 rtmp:{src:"rtmp://server.com/endpoint/url.loquesea",type="video/mp4 | video/x-flv"},
					//			 image:{frames:{frame_1:'frame_1.jpg',...frame_n:'frame_n.jpg'},duration:183},
					//	preview:'video_preview.jpg'}
	frameList:[],	// frameList[timeInstant] = { id:"frame_id", mimetype:"image/jpg", time:timeInstant, url:"image_url"}

	loadStatus:false,
	codecStatus:false,

	getMetadata:function() {
		return this.metadata;
	},

	isH264Capable:function() {
		var videoElement = document.createElement('video');
		var h264 = videoElement.canPlayType('video/mp4; codecs="avc1.42E01E"');
		if (h264=="") h264 = videoElement.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
		h264 = (h264=='probably');
		return h264;
	},

	isOggCapable:function() {
		if (base.userAgent.browser.IsMobileVersion) return false;
		var videoElement = document.createElement('video');
		var ogg = videoElement.canPlayType('video/ogg; codecs="theora"');
		ogg = (ogg=='probably');
		return ogg;
	},

	isWebmCapable:function() {
		if (base.userAgent.browser.IsMobileVersion) return false;
		var videoElement = document.createElement('video');
		var webm = videoElement.canPlayType('video/webm; codecs="vp8, vorbis"');
		webm = (webm=='probably');
		return webm;
	},

	isImageCapable:function() {
		return true;
	},

	isHtmlVideoCompatible:function(streamIndex) {
		var status = false;
		if (this.streams.length>streamIndex) {
			var stream = this.streams[streamIndex];
			var h264 = this.isH264Capable();
			var ogg = this.isOggCapable();
			var webm = this.isWebmCapable();

			base.log.debug("Browser video capabilities: mp4=" + ((h264) ? 'yes':'no') + ', ogg=' + ((ogg) ? 'yes':'no') + ', webm=' + ((webm) ? 'yes':'no'));

			if (stream.sources.mp4 && h264 && !/rtmp:\/\//.test(stream.sources.mp4.src)) {
				status = true;
			}
			else if (stream.sources.ogg && ogg) {
				status = true;
			}
			else if (stream.sources.webm && webm) {
				status = true;
			}
		}
		return status;
	},

	isImageCompatible:function(streamIndex) {
		var status = false;
		if (this.streams.length>streamIndex) {
			var stream = this.streams[streamIndex];
			if (stream.sources.image) {
				status = true;
			}
		}
		return status;
	},

	isFlashCompatible:function(streamIndex) {
		var status = false;

		if (this.streams.length>streamIndex) {
			var stream = this.streams[streamIndex];

			if (stream.sources.mp4) status = true;
			else if (stream.sources.flv) status = true;
		}

		return status && !base.userAgent.browser.IsMobileVersion;
	},

	isStreamingCompatible:function(streamIndex) {
		var status = false;

		if (this.streams.length>streamIndex) {
			var stream = this.streams[streamIndex];

			if (base.userAgent.browser.IsMobileVersion && stream.sources.hls) status = true;
			else if (!base.userAgent.browser.IsMobileVersion && stream.sources.rtmp) status = true;
			else status = false;
		}

		return status;
	},

	isStreamCompatible:function(streamIndex,method) {
		var status = false;
		if (method.enabled) {
			if (method.name=='html' && this.isHtmlVideoCompatible(streamIndex)) {
				status = true;
			}
			else if (method.name=='flash' && this.isFlashCompatible(streamIndex)) {
				status = true;
			}
			else if (method.name=='streaming' && this.isStreamingCompatible(streamIndex)) {
				status = true;
			}
			else if (method.name=='image' && this.isImageCompatible(streamIndex)) {
				status = true;
			}
		}
		return status;
	},

	getPreferredMethod:function(streamIndex) {
		var preferredMethod = null;
		var methods = paella.player.config.player.methods;
		var i;

		// Mobile browsers can only play one stream
		if (base.userAgent.browser.IsMobileVersion && streamIndex>=1) {
			for (i=0;i<methods.length;++i) {
				if (methods[i].name=='image' && methods[i].enabled && this.isStreamCompatible(streamIndex,methods[i])) {
					preferredMethod = methods[i];
				}
			}
		}
		else {
			for (i=0;i<methods.length;++i) {
				if (this.isStreamCompatible(streamIndex,methods[i])) {
					preferredMethod = methods[i];
					break;
				}
			}
		}

		return preferredMethod;
	},

	loadVideo:function(videoId,onSuccess) {
		// This function must to:
		//	- load this.streams and this.frameList
		// 	- Check streams compatibility using this.isStreamCompatible(streamIndex)
		//	- Set this.loadStatus = true if load is Ok, or false if something gone wrong
		//	- Set this.codecStatus = true if the browser can reproduce all streams
		//	- Call onSuccess()
		onSuccess();
	}
});

Class ("paella.PlayerBase", {
	config:null,
	playerId:'',
	mainContainer:null,
	videoContainer:null,
	controls:null,
	accessControl:null,

	checkCompatibility:function() {
		var message = "";
		if (base.parameters.get('ignoreBrowserCheck')) {
			return true;
		}
		if (base.userAgent.browser.IsMobileVersion) return true;
		var isCompatible =	base.userAgent.browser.Chrome ||
							base.userAgent.browser.Safari ||
							base.userAgent.browser.Firefox ||
							base.userAgent.browser.Opera ||
							base.userAgent.browser.Edge ||
							(base.userAgent.browser.Explorer && base.userAgent.browser.Version.major>=9);
		if (isCompatible) {
			return true;
		}
		else {
			var errorMessage = base.dictionary.translate("It seems that your browser is not HTML 5 compatible");
			paella.events.trigger(paella.events.error,{error:errorMessage});
			message = errorMessage + '<div style="display:block;width:470px;height:140px;margin-left:auto;margin-right:auto;font-family:Verdana,sans-sherif;font-size:12px;"><a href="http://www.google.es/chrome" style="color:#004488;float:left;margin-right:20px;"><img src="'+paella.utils.folders.resources()+'images/chrome.png" style="width:80px;height:80px" alt="Google Chrome"></img><p>Google Chrome</p></a><a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home" style="color:#004488;float:left;margin-right:20px;"><img src="'+paella.utils.folders.resources()+'images/explorer.png" style="width:80px;height:80px" alt="Internet Explorer 9"></img><p>Internet Explorer 9</p></a><a href="http://www.apple.com/safari/" style="float:left;margin-right:20px;color:#004488"><img src="'+paella.utils.folders.resources()+'images/safari.png" style="width:80px;height:80px" alt="Safari"></img><p>Safari 5</p></a><a href="http://www.mozilla.org/firefox/" style="float:left;color:#004488"><img src="'+paella.utils.folders.resources()+'images/firefox.png" style="width:80px;height:80px" alt="Firefox"></img><p>Firefox 12</p></a></div>';
			message += '<div style="margin-top:30px;"><a id="ignoreBrowserCheckLink" href="#" onclick="window.location = window.location + \'&ignoreBrowserCheck=true\'">' + base.dictionary.translate("Continue anyway") + '</a></div>';
			paella.messageBox.showError(message,{height:'40%'});
		}
		return false;
	},

	initialize:function(playerId) {
		if (base.parameters.get('log') != undefined) {
			var log = 0;
			switch(base.parameters.get('log')) {
				case "error":
					log = base.Log.kLevelError;
					break;					
				case "warn":
					log = base.Log.kLevelWarning;
					break;					
				case "debug":
					log = base.Log.kLevelDebug;
					break;					
				case "log":
				case "true":
					log = base.Log.kLevelLog;
					break;
			}
			base.log.setLevel(log);
		}		
			
		if (!this.checkCompatibility()) {
			base.log.debug('It seems that your browser is not HTML 5 compatible');
		}
		else {
			paella.player = this;
			this.playerId = playerId;
			this.mainContainer = $('#' + this.playerId)[0];
			this.accessControl = paella.initDelegate.initParams.accessControl;
			var thisClass = this;
			paella.events.bind(paella.events.loadComplete,function(event,params) { thisClass.loadComplete(event,params); });
		}
	},

	loadComplete:function(event,params) {

	},

	auth: {
		login: function(redirect) {
			redirect = redirect || window.location.href;
			var url = paella.initDelegate.initParams.accessControl.getAuthenticationUrl(redirect);
			if (url) {
				window.location.href = url;
			}
		},

		permissions:function() {
			return paella.initDelegate.initParams.accessControl.permissions;
		},

		userData:function() {
			return paella.initDelegate.initParams.accessControl.userData;
		}
	}
});

Class ("paella.InitDelegate", {
	initParams:{
		configUrl:'config/config.json',
		dictionaryUrl:'localization/paella',
		//editorDictionaryUrl:'config/editor_dictionary',
		accessControl:new paella.DefaultAccessControl(),
		videoLoader:new paella.VideoLoader()
	},

	initialize:function(params) {
		if (params) {
			for (var key in params) {
				this.initParams[key] = params[key];
			}
		}
	},

	getId:function() {
		return base.parameters.get('id') || "noid";
	},

	loadDictionary:function(onSuccess) {
		var asyncLoader = new base.AsyncLoader();
		asyncLoader.addCallback(new base.DictionaryCallback(this.initParams.dictionaryUrl));
		//asyncLoader.addCallback(new base.DictionaryCallback(this.initParams.editorDictionaryUrl));
		asyncLoader.load(function() {
				onSuccess();
			},
			function() {
				onSuccess();
			}
		);
	},

	loadConfig:function(onSuccess) {
		var configUrl = this.initParams.configUrl;
		var params = {};
		params.url = configUrl;
		base.ajax.get(params,function(data,type,returnCode) {
				if (typeof(data)=='string') {
					try {
						data = JSON.parse(data);
					}
					catch (e) {
						onSuccess({});
					}
				}
				base.dictionary.addDictionary(data);
				onSuccess(data);
			},
			function(data,type,returnCode) {
				paella.messageBox.showError(base.dictionary.translate("Error! Config file not found. Please configure paella!"));
				//onSuccess({});
			});
	},

	loadEditorConfig:function(onSuccess) {
		var data = {
			cssPath: paella.utils.folders.resources() + '/ui/jquery-ui.css'
		};
		onSuccess(data);
	}
});

var paellaPlayer = null;
paella.plugins = {};
paella.plugins.events = {};
paella.initDelegate = null;

/*** File: src/09_paella_player.js ***/
Class ("paella.PaellaPlayer", paella.PlayerBase,{
	player:null,

	selectedProfile:'',
	videoIdentifier:'',
	editor:null,
	loader:null,

	// Video data:
	videoData:null,

	getPlayerMode: function() {	
		if (paella.player.isFullScreen()) {
			return paella.PaellaPlayer.mode.fullscreen;
		}
		else if (window.self !== window.top) {
			return paella.PaellaPlayer.mode.embed;
		}

		return paella.PaellaPlayer.mode.standard;
	},


	checkFullScreenCapability: function() {
		var fs = document.getElementById(paella.player.mainContainer.id);
		if ((fs.webkitRequestFullScreen) || (fs.mozRequestFullScreen) || (fs.msRequestFullscreen) || (fs.requestFullScreen)) {
			return true;
		}
		if (base.userAgent.browser.IsMobileVersion && paella.player.videoContainer.isMonostream) {
			return true;
		}		
		return false;
	},

	addFullScreenListeners : function() {
		var thisClass = this;
		
		var onFullScreenChangeEvent = function() {
			paella.pluginManager.checkPluginsVisibility();
			var fs = document.getElementById(paella.player.mainContainer.id);
			
			if (paella.player.isFullScreen()) {				
				fs.style.width = '100%';
				fs.style.height = '100%';
			}
			else {
				fs.style.width = '';
				fs.style.height = '';
			}
			
			if (thisClass.isFullScreen()) {
				paella.events.trigger(paella.events.enterFullscreen);				
			}
			else{
				paella.events.trigger(paella.events.exitFullscreen);
			}			
		};
	
		if (!this.eventFullScreenListenerAdded) {
			this.eventFullScreenListenerAdded = true;
			document.addEventListener("fullscreenchange", onFullScreenChangeEvent, false);
			document.addEventListener("webkitfullscreenchange", onFullScreenChangeEvent, false);
			document.addEventListener("mozfullscreenchange", onFullScreenChangeEvent, false);	
			document.addEventListener("MSFullscreenChange", onFullScreenChangeEvent, false);
		}		
	},

	isFullScreen: function() {
		var webKitIsFullScreen = (document.webkitIsFullScreen === true);
		var msIsFullScreen = (document.msFullscreenElement !== undefined && document.msFullscreenElement !== null);
		var mozIsFullScreen = (document.mozFullScreen === true);
		var stdIsFullScreen = (document.fullScreenElement !== undefined && document.fullScreenElement !== null);
		
		return (webKitIsFullScreen || msIsFullScreen || mozIsFullScreen || stdIsFullScreen);

	},
	goFullScreen: function() {
		this.addFullScreenListeners();
		if (!this.isFullScreen()) {
			if (base.userAgent.browser.IsMobileVersion && paella.player.videoContainer.isMonostream) {
				var video = paella.player.videoContainer.masterVideo().domElement;
				if (video.webkitSupportsFullscreen) {					
					video.webkitEnterFullscreen();
				}
			}
			else {			
				var fs = document.getElementById(paella.player.mainContainer.id);		
				if (fs.webkitRequestFullScreen) {			
					fs.webkitRequestFullScreen();
				}
				else if (fs.mozRequestFullScreen){
					fs.mozRequestFullScreen();
				}
				else if (fs.msRequestFullscreen) {
					fs.msRequestFullscreen();
				}
				else if (fs.requestFullScreen) {
					fs.requestFullScreen();
				}
			}
		}
	},
	
	exitFullScreen: function() {
		this.addFullScreenListeners();	
		if (this.isFullScreen()) {			
			if (document.webkitCancelFullScreen) {
				document.webkitCancelFullScreen();
			}
			else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			}
			else if (document.msExitFullscreen()) {
				document.msExitFullscreen();
			}
			else if (document.cancelFullScreen) {
				document.cancelFullScreen();
			}								
		}		
	},


	setProfile:function(profileName,animate) {
		var thisClass = this;
		this.videoContainer.setProfile(profileName,function(newProfileName) {
			thisClass.selectedProfile = newProfileName;
		},animate);
	},

	initialize:function(playerId) {
		this.parent(playerId);

		// if initialization ok
		if (this.playerId==playerId) {
			this.loadPaellaPlayer();
			var thisClass = this;
			paella.events.bind(paella.events.setProfile,function(event,params) {
				thisClass.setProfile(params.profileName);
			});
		}
	},

	loadPaellaPlayer:function() {
		var thisClass = this;
		this.loader = new paella.LoaderContainer('paellaPlayer_loader');
		$('body')[0].appendChild(this.loader.domElement);
		paella.events.trigger(paella.events.loadStarted);

		paella.initDelegate.loadDictionary(function() {
			paella.initDelegate.loadConfig(function(config) {
				thisClass.onLoadConfig(config);
				if (config.skin) {
					var skin = config.skin.default || 'dark';
					paella.utils.skin.restore(skin);
				}				
			});
		});
	},

	onLoadConfig:function(configData) {
		paella.data = new paella.Data(configData);

		this.config = configData;
		this.videoIdentifier = paella.initDelegate.getId();

		if (this.videoIdentifier) {
			if (this.mainContainer) {
				this.videoContainer = new paella.VideoContainer(this.playerId + "_videoContainer");
				var videoQualityStrategy = new paella.BestFitVideoQualityStrategy();
				try {
					var StrategyClass = this.config.player.videoQualityStrategy;
					var ClassObject = Class.fromString(StrategyClass);
					videoQualityStrategy = new ClassObject();
				}
				catch(e) {
					base.log.warning("Error selecting video quality strategy: strategy not found");
				}
				this.videoContainer.setVideoQualityStrategy(videoQualityStrategy);
				
				this.mainContainer.appendChild(this.videoContainer.domElement);
			}
			$(window).resize(function(event) { paella.player.onresize(); });
			this.onload();
		}
		
		paella.pluginManager.loadPlugins("paella.FastLoadPlugin");
	},

	onload:function() {
		var thisClass = this;
		this.accessControl.checkAccess(function(permissions) {
			var errorMessage;
			if (!permissions.loadError) {
				base.log.debug("read:" + permissions.canRead + ", contribute:" + permissions.canContribute + ", write:" + permissions.canWrite);
				if (permissions.canWrite) {
					//thisClass.setupEditor();
					paella.events.bind(paella.events.showEditor,function(event) { thisClass.showEditor(); });
					paella.events.bind(paella.events.hideEditor,function(event) { thisClass.hideEditor(); });
				}
				if (permissions.canRead) {
					thisClass.loadVideo();
					thisClass.videoContainer.publishVideo();
				}
				else {
					var redirectUrl = paella.initDelegate.initParams.accessControl.getAuthenticationUrl("player/?id=" + paella.player.videoIdentifier);
					var message = '<div>' + base.dictionary.translate("You are not authorized to view this resource") + '</div>';
					if (redirectUrl) {
						message += '<div class="login-link"><a href="' + redirectUrl + '">' + base.dictionary.translate("Login") + '</a></div>';
					}
					thisClass.unloadAll(message);
				}
			}
			else if (permissions.isAnonymous) {
				errorMessage = base.dictionary.translate("You are not logged in");
				thisClass.unloadAll(errorMessage);
				paella.events.trigger(paella.events.error,{error:errorMessage});
			}
			else {
				errorMessage = base.dictionary.translate("You are not authorized to view this resource");
				thisClass.unloadAll(errorMessage);
				paella.events.trigger(paella.events.error,{error:errorMessage});
			}
		});
	},

	onresize:function() {		
		this.videoContainer.onresize();
		if (this.controls) this.controls.onresize();
		if (this.editor) {
			this.editor.resize();
		}

		// Resize the layout profile
		var cookieProfile = paella.utils.cookies.get('lastProfile');
		if (cookieProfile) {
			this.setProfile(cookieProfile,false);
		}
		else {
			this.setProfile(paella.Profiles.getDefaultProfile(), false);
		}
		
		paella.events.trigger(paella.events.resize,{width:$(this.videoContainer.domElement).width(), height:$(this.videoContainer.domElement).height()});
	},

	unloadAll:function(message) {
		var loaderContainer = $('#paellaPlayer_loader')[0];
		this.mainContainer.innerHTML = "";
		paella.messageBox.showError(message);
	},

	showEditor:function() {
		new paella.editor.Editor();
	},

	hideEditor:function() {
	},

	reloadVideos:function(masterQuality,slaveQuality) {
		if (this.videoContainer) {
			this.videoContainer.reloadVideos(masterQuality,slaveQuality);
			this.onresize();
		}
	},

	loadVideo:function() {
		if (this.videoIdentifier) {
			var This = this;
			var loader = paella.initDelegate.initParams.videoLoader;
			paella.player.videoLoader = loader;
			this.onresize();
			loader.loadVideo(this.videoIdentifier,function() {
				var playOnLoad = false;
				if (base.parameters.get('autoplay')=="true" &&
						paella.player.config.experimental &&
						paella.player.config.experimental.autoplay &&
						!base.userAgent.browser.IsMobileVersion)
				{
					paella.player.videoContainer.setAutoplay();
					playOnLoad = true;
				}

				paella.player.videoContainer.setMasterQuality(base.parameters.list['resmaster']);
				paella.player.videoContainer.setSlaveQuality(base.parameters.list['resslave']);

				var master = loader.streams[0];
				var slave = loader.streams[1];
				var playerConfig = paella.player.config.player;
				// SET DEFAULT AUDIO VOLUME
				if(playerConfig && playerConfig.audio && playerConfig.audio.master !== undefined)
					paella.player.videoContainer.setDefaultMasterVolume(playerConfig.audio.master);
				if(playerConfig && playerConfig.audio && playerConfig.audio.slave !== undefined)
					paella.player.videoContainer.setDefaultSlaveVolume(playerConfig.audio.slave);
				

				if (slave && slave.data && Object.keys(slave.data.sources).length==0) slave = null;
				var frames = loader.frameList;
				var errorMessage;

				if (loader.loadStatus) {
					var preferredMethodMaster = loader.getPreferredMethod(0);
					var preferredMethodSlave  = loader.getPreferredMethod(1);

					if (!preferredMethodMaster) {
						message = "This video is not compatible with any codec installed in your system";
						paella.messageBox.showError(base.dictionary.translate(message));
						return false;
					}

					var h264WarningMessage = true;
					if ((master.sources.ogv || master.sources.webm) && (slave.sources.ogv || slave.sources.webm)) {
						h264WarningMessage = false;
					}

					if (h264WarningMessage) {
						var minFirefoxVersion = base.userAgent.system.MacOS ? 35:(base.userAgent.system.Windows) ? 25:26;
						if (base.userAgent.browser.Firefox && base.userAgent.browser.Version.major<minFirefoxVersion) {
							message = "You are using Firefox version, and some required video playback capabilities are not available until Firefox min_version. Please, update your browser and try again.";
							message = base.dictionary.translate(message);
							message = message.replace("version",base.userAgent.browser.Version.major);
							message = message.replace("min_version",minFirefoxVersion);
							paella.messageBox.showError(message);
							return false;
						}
					}

					paella.player.videoContainer.setSources(
						{ data:master, type:preferredMethodMaster },
						{ data:slave, type:preferredMethodSlave }
					);
					
					setTimeout(function(){
						paella.events.trigger(paella.events.loadComplete,{masterVideo:master,slaveVideo:slave,frames:frames});
					}, 10);					
					if (paella.player.isLiveStream()) {
						This.showPlaybackBar();
					}
					/* We need to autoplay after plugin loads
					else if (playOnLoad) {
						This.play();
					}
					*/
					This.onresize();
				}
				else {
					errorMessage = base.dictionary.translate("Error loading video data");
					paella.messageBox.showError(errorMessage);
					paella.events.trigger(paella.events.error,{error:errorMessage});
				}
			});
		}
	},

	showPlaybackBar:function() {
		if (!this.controls) {
			this.controls = new paella.ControlsContainer(this.playerId + '_controls');
			this.mainContainer.appendChild(this.controls.domElement);
			this.controls.onresize();
			paella.events.trigger(paella.events.loadPlugins,{pluginManager:paella.pluginManager});

		}
	},

	isLiveStream:function() {
		if (this._isLiveStream===undefined) {
			var loader = paella.initDelegate.initParams.videoLoader;
			var checkSource = function(sources,index) {
				if (sources.length>index) {
					var source = sources[index];
					for (var key in source.sources) {
						if (typeof(source.sources[key])=="object") {
							for (var i=0; i<source.sources[key].length; ++i) {
								var stream = source.sources[key][i];
								if (stream.isLiveStream) return true;
							}
						}
					}
				}
				return false;
			};
			this._isLiveStream = checkSource(loader.streams,0) || checkSource(loader.streams,1);
		}
		return this._isLiveStream;
	},

	loadPreviews:function() {
		var streams = paella.initDelegate.initParams.videoLoader.streams;
		var slavePreviewImg = null;

		var masterPreviewImg = streams[0].preview;
		if (streams.length >=2) {
			slavePreviewImg = streams[1].preview;
		}
		if (masterPreviewImg) {
			var masterRect = paella.player.videoContainer.overlayContainer.getMasterRect();
			this.masterPreviewElem = document.createElement('img');
			this.masterPreviewElem.src = masterPreviewImg;
			paella.player.videoContainer.overlayContainer.addElement(this.masterPreviewElem,masterRect);
		}
		if (slavePreviewImg) {
			var slaveRect = paella.player.videoContainer.overlayContainer.getSlaveRect();
			this.slavePreviewElem = document.createElement('img');
			this.slavePreviewElem.src = slavePreviewImg;
			paella.player.videoContainer.overlayContainer.addElement(this.slavePreviewElem,slaveRect);
		}
		paella.events.bind(paella.events.timeUpdate,function(event) {
			paella.player.unloadPreviews();
		});
	},

	unloadPreviews:function() {
		if (this.masterPreviewElem) {
			paella.player.videoContainer.overlayContainer.removeElement(this.masterPreviewElem);
			this.masterPreviewElem = null;
		}
		if (this.slavePreviewElem) {
			paella.player.videoContainer.overlayContainer.removeElement(this.slavePreviewElem);
			this.slavePreviewElem = null;
		}
	},

	loadComplete:function(event,params) {
		var thisClass = this;

		var master = paella.player.videoContainer.masterVideo();
		var getProfile = base.parameters.get('profile');
		var cookieProfile = base.cookies.get('lastProfile');
		if (getProfile) {
			this.setProfile(getProfile, false);
		}
		else if (cookieProfile) {
			this.setProfile(cookieProfile, false);
		}
		else {
			this.setProfile(paella.Profiles.getDefaultProfile(), false);
		}

		paella.pluginManager.loadPlugins("paella.EarlyLoadPlugin");
		if (paella.player.videoContainer._autoplay){
			this.play();
		}		
	},

	play:function() {
		if (!this.controls) {
			this.showPlaybackBar();
			var urlParamTime = base.parameters.get("time");
			var hashParamTime = base.hashParams.get("time");
			var timeString = hashParamTime ? hashParamTime:urlParamTime ? urlParamTime:"0s";
			var startTime = paella.utils.timeParse.timeToSeconds(timeString);
			if (startTime) {
				paella.player.videoContainer.setStartTime(startTime);
			}
			paella.events.trigger(paella.events.controlBarLoaded);
			this.controls.onresize();
		}

		this.videoContainer.play();
	},

	pause:function() {
		this.videoContainer.pause();
	},

	playing:function() {
		return !this.paused();
	},

	paused:function() {
		return this.videoContainer.paused();
	}
});

var PaellaPlayer = paella.PaellaPlayer;

paella.PaellaPlayer.mode = {
	standard: 'standard',
	fullscreen: 'fullscreen',
	embed: 'embed'
};

/* Initializer function */
function initPaellaEngage(playerId,initDelegate) {
	if (!initDelegate) {
		initDelegate = new paella.InitDelegate();
	}
	paella.initDelegate = initDelegate;
	var lang = navigator.language || window.navigator.userLanguage;
	paellaPlayer = new PaellaPlayer(playerId,paella.initDelegate);
}

/*** File: src/10_loader.js ***/



// Default Video Loader
//
Class ("paella.DefaultVideoLoader", paella.VideoLoader, {
	_url:null,
	
	initialize: function (data) {
		if (typeof(data)=="object") {
			this._data = data;
		}
		else {
			try {
				this._data = JSON.parse(data);
			}
			catch (e) {
				this._url = data;
			}
		}
	},

	loadVideo: function (videoId, onSuccess) {
		if (this._data) {
			this.loadVideoData(this._data, onSuccess);
		}
		else if (this._url) {
			var This = this;
			this._url = (/\/$/.test(this._url) ? this._url:this._url + '/')
				 + videoId + '/';
			base.ajax.get({ url:this._url + 'data.json' },
				function(data,type,err) {
					if (typeof(data)=="string") {
						try {
							data = JSON.parse(data);
						}
						catch(e) {}
					}
					This._data = data;
					This.loadVideoData(This._data,onSuccess);
				},
				function(data,type,err) {
				});
		}
	},

	loadVideoData:function(data,onSuccess) {
		var This = this;
		if (data.metadata) {
			this.metadata = data.metadata;
		}

		if (data.streams) {
			data.streams.forEach(function(stream) {
				This.loadStream(stream);
			});
		}
		if (data.frameList) {
			this.loadFrameData(data);
		}
		if (data.captions) {
			this.loadCaptions(data.captions);
		}
		if (data.blackboard) {
			this.loadBlackboard(data.streams[0],data.blackboard);
		}
		this.streams = data.streams;
		this.frameList = data.frameList;
		this.loadStatus = this.streams.length>0;
		onSuccess();
	},

	loadFrameData:function(data) {
		var This = this;
		if (data.frameList && data.frameList.forEach) {
			var newFrames = {};
			data.frameList.forEach(function(frame) {
				if (! /^[a-zA-Z]+:\/\//.test(frame.url)) {
					frame.url = This._url + frame.url;
				}
				if (frame.thumb && ! /^[a-zA-Z]+:\/\//.test(frame.thumb)) {
					frame.thumb = This._url + frame.thumb;
				}
				var id = frame.time;
				newFrames[id] = frame;

			});
			data.frameList = newFrames;
		}
	},

	loadStream:function(stream) {
		var This=this;
		if (stream.preview && ! /^[a-zA-Z]+:\/\//.test(stream.preview)) {
			stream.preview = This._url + stream.preview;
		}

		if (stream.sources.image) {
			stream.sources.image.forEach(function(image) {
				if (image.frames.forEach) {
					var newFrames = {};
					image.frames.forEach(function(frame) {
						if (frame.src && ! /^[a-zA-Z]+:\/\//.test(frame.src)) {
							frame.src = This._url + frame.src;
						}
						if (frame.thumb && ! /^[a-zA-Z]+:\/\//.test(frame.thumb)) {
							frame.thumb = This._url + frame.thumb;
						}
						var id = "frame_" + frame.time;
						newFrames[id] = frame.src;
					});
					image.frames = newFrames;
				}
			});
		}
		for (var type in stream.sources) {
			if (stream.sources[type]) {
				if (type != 'image') {
					var source = stream.sources[type];
					source.forEach(function (sourceItem) {
						var pattern = /^[a-zA-Z\:]+\:\/\//gi;
						if (typeof(sourceItem.src)=="string") {
							if(sourceItem.src.match(pattern) == null){
								sourceItem.src = This._url + sourceItem.src;
							}
						}
						sourceItem.type = sourceItem.mimetype;
					});
				}
			}
			else {
				delete stream.sources[type];
			}
		}
	},

	loadCaptions:function(captions) {
		if (captions) {
			for (var i=0; i<captions.length; ++i) {
				var url = captions[i].url;

				if (! /^[a-zA-Z]+:\/\//.test(url)) {
					url = this._url + url;
				}
				var c = new paella.captions.Caption(i, captions[i].format, url, {code: captions[i].lang, txt: captions[i].text});
				paella.captions.addCaptions(c);
			}
		}
	},

	loadBlackboard:function(stream, blackboard) {
		var This = this;
		if (!stream.sources.image) {
			stream.sources.image = [];
		}
		var imageObject = {
			count: blackboard.frames.length,
			duration: blackboard.duration,
			mimetype: blackboard.mimetype,
			res: blackboard.res,
			frames: {}
		};

		blackboard.frames.forEach(function(frame) {
			var id = "frame_" + Math.round(frame.time);
			if (!/^[a-zA-Z]+:\/\//.test(frame.src)) {
				frame.src = This._url + frame.src;
			}
			imageObject.frames[id] = frame.src;
		});

		stream.sources.image.push(imageObject);
	}
});

Class ("paella.DefaultInitDelegate", paella.InitDelegate, {
	initialize:function(config, params) {
		if (arguments.length==1) {
			this.parent(arguments[0]);
		}
		else if (arguments.length==2) {
			this._config = arguments[0];
			this.parent(arguments[1]);
		}
	},

	loadConfig: function(onSuccess) {
		if (this._config) {
			onSuccess(this._config);
		}
		else {
			this.parent(onSuccess);
		}
	}
});

/*
 *	playerContainer	Player DOM container id
 *	params.config			Use this configuration file
 *	params.data				Paella video data schema
 *	params.url				Repository URL
 */
paella.load = function(playerContainer, params) {
	var auth = (params && params.auth) || {};
	var initObjects = {
		accessControl: new paella.DefaultAccessControl(auth),
		videoLoader: new paella.DefaultVideoLoader(params.data || params.url)
	};

	if (params.config) {
		paella.initDelegate = new paella.DefaultInitDelegate(params.config, initObjects);
	}
	else {
		paella.initDelegate = new paella.DefaultInitDelegate(initObjects);
	}
	new PaellaPlayer(playerContainer,paella.initDelegate);
};

/*** File: src/10_paella_extended_adapter.js ***/
/*
	Paella HTML 5 Multistream Player
	Copyright (C) 2013  Universitat Politècnica de València

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


Class ("paella.RightBarPlugin", paella.DeferredLoadPlugin,{
	type:'rightBarPlugin',
	getName:function() { return "es.upv.paella.RightBarPlugin"; },

	buildContent:function(domElement) {

	}
});

Class ("paella.TabBarPlugin", paella.DeferredLoadPlugin,{
	type:'tabBarPlugin',
	getName:function() { return "es.upv.paella.TabBarPlugin"; },

	getTabName:function() {
		return "New Tab";
	},

	action:function(tab) {
	},

	buildContent:function(domElement) {
	},
	
	setToolTip:function(message) {
		this.button.setAttribute("title", message);
		this.button.setAttribute("aria-label", message);
	},

	getDefaultToolTip: function() {
		return "";
	}
});


Class ("paella.ExtendedAdapter", {
	rightContainer:null,
	bottomContainer:null,

	rightBarPlugins:[],
	tabBarPlugins:[],

	currentTabIndex:0,
	bottomContainerTabs:null,
	bottomContainerContent:null,


	initialize:function() {

		this.rightContainer = document.createElement('div');
		//this.rightContainer.id = this.settings.rightContainerId;
		this.rightContainer.className = "rightPluginContainer";

		this.bottomContainer = document.createElement('div');
		//this.bottomContainer.id = this.settings.bottomContainerId;
		this.bottomContainer.className = "tabsPluginContainer";

		var tabs = document.createElement('div');
		//tabs.id = 'bottomContainer_tabs';
		tabs.className = 'tabsLabelContainer';
		this.bottomContainerTabs = tabs;
		this.bottomContainer.appendChild(tabs);

		var bottomContent = document.createElement('div');
		//bottomContent.id = 'bottomContainer_content';
		bottomContent.className = 'tabsContentContainer';
		this.bottomContainerContent = bottomContent;
		this.bottomContainer.appendChild(bottomContent);



		this.initPlugins();
	},

	initPlugins:function() {
		paella.pluginManager.setTarget('rightBarPlugin', this);
		paella.pluginManager.setTarget('tabBarPlugin', this);
	},

	addPlugin:function(plugin) {
		var thisClass = this;
		plugin.checkEnabled(function(isEnabled) {
			if (isEnabled) {
				paella.pluginManager.setupPlugin(plugin);
				if (plugin.type=='rightBarPlugin') {
					thisClass.rightBarPlugins.push(plugin);
					thisClass.addRightBarPlugin(plugin);
				}
				if (plugin.type=='tabBarPlugin') {
					thisClass.tabBarPlugins.push(plugin);
					thisClass.addTabPlugin(plugin);
				}
			}
		});
	},

	showTab:function(tabIndex) {
		var i =0;
		var labels = this.bottomContainer.getElementsByClassName("tabLabel");
		var contents = this.bottomContainer.getElementsByClassName("tabContent");
	
		for (i=0; i < labels.length; ++i) {
			if (labels[i].getAttribute("tab") == tabIndex) {
				labels[i].className = "tabLabel enabled";
			}
			else {
				labels[i].className = "tabLabel disabled";
			}
		}
		
		for (i=0; i < contents.length; ++i) {
			if (contents[i].getAttribute("tab") == tabIndex) {
				contents[i].className = "tabContent enabled";
			}
			else {
				contents[i].className = "tabContent disabled";
			}
		}
	},

	addTabPlugin:function(plugin) {
		var thisClass = this;
		var tabIndex = this.currentTabIndex;

		// Add tab
		var tabItem = document.createElement('div');
		tabItem.setAttribute("tab", tabIndex);
		tabItem.className = "tabLabel disabled";		
		tabItem.innerHTML = plugin.getTabName();
		tabItem.plugin = plugin;
		$(tabItem).click(function(event) { if (/disabled/.test(this.className)) { thisClass.showTab(tabIndex); this.plugin.action(this); } });
		$(tabItem).keyup(function(event) {
			if (event.keyCode == 13) {
				if (/disabledTabItem/.test(this.className)) { thisClass.showTab(tabIndex); this.plugin.action(this); }
			}
		});
		this.bottomContainerTabs.appendChild(tabItem);

		// Add tab content
		var tabContent = document.createElement('div');
		tabContent.setAttribute("tab", tabIndex);
		tabContent.className = "tabContent disabled " + plugin.getSubclass();
		this.bottomContainerContent.appendChild(tabContent);
		plugin.buildContent(tabContent);

		plugin.button = tabItem;
		plugin.container = tabContent;

		plugin.button.setAttribute("tabindex", 3000+plugin.getIndex());
		plugin.button.setAttribute("alt", "");
		plugin.setToolTip(plugin.getDefaultToolTip());


		// Show tab
		if (this.firstTabShown===undefined) {
			this.showTab(tabIndex);
			this.firstTabShown = true;
		}
		++this.currentTabIndex;
	},

	addRightBarPlugin:function(plugin) {
		var container = document.createElement('div');
		container.className = "rightBarPluginContainer " + plugin.getSubclass();
		this.rightContainer.appendChild(container);
		plugin.buildContent(container);
	}
});


paella.extendedAdapter = new paella.ExtendedAdapter();
/*** File: src/11_editor_base.js ***/
paella.editor = {};

paella.editor.utils = {
	mouse: {
		mouseDownTarget:'',
	}
};
/*** File: src/12_editor_bootstrap_utils.js ***/
var bootstrapUtils = {
	elem:function(type,params,inner) {
		var elem = document.createElement(type);
		for (var attr in params) {
			elem.setAttribute(attr, params[attr]);
		}
		if (inner) {elem.innerHTML = inner;}
		return elem;
	},
	
	append:function(parent,child) {
		parent.appendChild(child);
		return child;
	},

	navbar:function(title,subclass) {
		var nav = this.elem("div",{"class":"navbar tiny " + subclass});
		var navInner = this.append(nav,this.elem("div",{"class":"navbar-inner tiny"}));
		if (title) {
			this.append(navInner,this.elem("div",{"class":"brand","href":"javascript:void(0);"},title));
		}
		return nav;
	},
	
	dropdown:function(title,subclass,items,size,icon,alignRight) {
		return this.dropButton(title,subclass,items,size,icon,alignRight,'');
	},
	
	dropup:function(title,subclass,items,size,icon,alignRight) {
		return this.dropButton(title,subclass,items,size,icon,alignRight,'dropup');
	},

	dropButton:function(title,subclass,items,size,icon,alignRight,type) {
		var align = '';
		if (alignRight) align = 'pull-right';
		
		var dropup = this.elem('div',{'class':'btn-group ' + type + ' ' + subclass + ' ' + align});
		if (icon) {
			title = '<i class="' + icon + '"></i>&nbsp;<span class="text">' + title + '</span>&nbsp;';
		}
		else {
			title = '&nbsp;<span class="text">' + title + '</span>&nbsp;';
		}
		
		var btn = this.append(dropup,this.elem('a',{'class':'btn dropdown-toggle ' + size,'data-toggle':'dropdown','href':'JavaScript:void(0);'},title + '<span class="caret"></span>'));
		
		
		var ul = this.append(dropup,this.elem('ul',{'class':'dropdown-menu'}));
		for (var key in items) {
			var action = items[key];
			var li = this.append(ul,this.elem('li'));
			this.append(li,this.elem('a',{'href':'JavaScript:void(0);','onclick':action,'class':'listItem'},key));
		}
		return dropup;
	},
	
	buttonGroup:function(buttons,btnSubclass,isPushButton) {
		var group = document.createElement('div');
		group.className = 'btn-group';
		
		
		for (var i=0;i<buttons.length;++i) {
			var button = document.createElement('button');
			button.className = 'btn ' + btnSubclass;
			button.innerHTML = buttons[i].label;
			button.buttonData = buttons[i];
			button.buttonData.disabledClass = button.className;
			button.title = buttons[i].hint;
			if (isPushButton) {
				$(button).click(function(event) {
					this.buttonData.onclick(this.buttonData);
				});				
			}
			else {
				$(button).click(function(event) {
					for (var j=0;j<this.parentNode.childNodes.length;++j) {
						this.parentNode.childNodes[j].className = this.buttonData.disabledClass;
					}
					this.className = this.className + ' active';
					this.buttonData.onclick(this.buttonData);
				});
			}
			group.appendChild(button);
		}
		return group;
	},
	
	button:function(label,className,hint,onclick) {
		var button = document.createElement('button');
		button.className = 'btn ' + className;
		button.innerHTML = label;
		button.title = hint;
		$(button).click(function(event) { onclick(this); });
		return button;
	}
};
/*** File: src/13_editor_plugin_base.js ***/
Class ("paella.editor.PluginSaveCallback", base.AsyncLoaderCallback,{
	plugin:null,

	initialize:function(plugin) {
		this.parent("pluginSaveCallback");
		this.plugin = plugin;
	},

	load:function(onSuccess,onError) {
		this.plugin.onSave(function() {
			onSuccess();
		});
	}
});

Class ("paella.editor.PluginDiscardCallback", base.AsyncLoaderCallback,{
	plugin:null,

	initialize:function(plugin) {
		this.parent("pluginDiscardCallback");
		this.plugin = plugin;
	},

	load:function(onSuccess,onError) {
		this.plugin.onDiscard(function() {
			onSuccess();
		});
	}
});

Class ("paella.editor.PluginManager", {
	trackPlugins:[],
	rightBarPlugins:[],
	toolbarPlugins:[],

	initialize:function() {
		this.initPlugins();
	},

	initPlugins:function() {
		paella.pluginManager.setTarget('editorTrackPlugin',this);
		paella.pluginManager.setTarget('editorRightBarPlugin',this);
		paella.pluginManager.setTarget('editorToolbarPlugin',this);
	},

	addPlugin:function(plugin) {
		var thisClass = this;
		plugin.checkEnabled(function(isEnabled) {
			if (isEnabled) {
				paella.pluginManager.setupPlugin(plugin);
				if (plugin.type=='editorTrackPlugin') {
					thisClass.trackPlugins.push(plugin);
				}
				if (plugin.type=='editorRightBarPlugin') {
					thisClass.rightBarPlugins.push(plugin);
				}
				if (plugin.type=='editorToolbarPlugin') {
					thisClass.toolbarPlugins.push(plugin);
				}
			}
		});
	},

	onTrackChanged:function(newTrack) {
		// Notify tab plugins
		var i, plugin;
		for (i=0;i<this.rightBarPlugins.length;++i) {
			plugin = this.rightBarPlugins[i];
			plugin.onTrackSelected(newTrack);
		}

		// Notify toolbar plugins
		for (i=0;i<this.toolbarPlugins.length;++i) {
			plugin = this.toolbarPlugins[i];
			plugin.onTrackSelected(newTrack);
		}
	},

	onSave:function(onDone) {
		var asyncLoader = new paella.AsyncLoader();
		var i;
		for (i=0;i<this.trackPlugins.length;++i) {
			asyncLoader.addCallback(new paella.editor.PluginSaveCallback(this.trackPlugins[i]));
		}
		for (i=0;i<this.rightBarPlugins.length;++i) {
			asyncLoader.addCallback(new paella.editor.PluginSaveCallback(this.rightBarPlugins[i]));
		}
		for (i=0;i<this.toolbarPlugins.length;++i) {
			asyncLoader.addCallback(new paella.editor.PluginSaveCallback(this.toolbarPlugins[i]));
		}
		asyncLoader.load(function() {
				paella.events.trigger(paella.events.didSaveChanges);
				onDone(true);
			},
			function() {
				onDone(false);
			});
	},

	onDiscard:function(onDone) {
		var asyncLoader = new paella.AsyncLoader();
		var i;
		for (i=0;i<this.trackPlugins.length;++i) {
			asyncLoader.addCallback(new paella.editor.PluginDiscardCallback(this.trackPlugins[i]));
		}
		for (i=0;i<this.rightBarPlugins.length;++i) {
			asyncLoader.addCallback(new paella.editor.PluginDiscardCallback(this.rightBarPlugins[i]));
		}
		for (i=0;i<this.toolbarPlugins.length;++i) {
			asyncLoader.addCallback(new paella.editor.PluginDiscardCallback(this.toolbarPlugins[i]));
		}
		asyncLoader.load(function() {
				onDone(true);
			},
			function() {
				onDone(false);
			});
	}
});

paella.editor.pluginManager = new paella.editor.PluginManager();

Class ("paella.editor.EditorPlugin", paella.DeferredLoadPlugin,{
	onTrackSelected:function(newTrack) {
		if (newTrack) {
			base.log.debug(this.getName() + ": New track selected " + newTrack.getName());
		}
		else {
			base.log.debug("No track selected");
		}
	},

	onSave:function(onDone) {
		// Paella Editor calls this function when the user clicks on "save" button
		onDone();
	},

	onDiscard:function(onDone) {
		onDone();
	},

	contextHelpString:function() {
		return "";
	}
});

Class ("paella.editor.TrackPlugin", paella.editor.EditorPlugin,{
	type:'editorTrackPlugin',

	getIndex:function() {
		return 10000;
	},

	getName:function() {
		return "editorTrackPlugin";
	},

	getTrackName:function() {
		return "My Track";
	},

	getColor:function() {
		return "#5500FF";
	},

	getTextColor:function() {
		return "#F0F0F0";
	},

	getTrackType:function() {
		return "secondary";
	},

	getTrackItems:function() {
		var exampleTracks = [{id:1,s:10,e:70},{id:2,s:110,e:340}];
		return exampleTracks;
	},

	isSegment:function() {
		return true;
	},

	allowResize:function() {
		return true;
	},

	allowDrag:function() {
		return true;
	},

	allowEditContent:function() {
		return true;
	},

	onTrackChanged:function(id,start,end) {
		//base.log.debug('Track changed: id=' + id + ", start: " + start + ", end:" + end);
		paella.events.trigger(paella.events.documentChanged);
	},

	onTrackContentChanged:function(id,content) {
		//base.log.debug('Track content changed: id=' + id + ', new content: ' + content);
		paella.events.trigger(paella.events.documentChanged);
	},

	onSelect:function(trackItemId) {
		base.log.debug('Track list selected: ' + this.getTrackName());
	},

	onUnselect:function() {
		base.log.debug('Track list unselected: ' + this.getTrackName());
	},

	onDblClick:function(trackData) {
	},

	getTools:function() {
		return [];
	},

	onToolSelected:function(toolName) {
		//base.log.debug('Tool selected: ' + toolName);
		paella.events.trigger(paella.events.documentChanged);
	},

	isToolEnabled:function(toolName) {
		return true;
	},

	buildToolTabContent:function(tabContainer) {

	},

	getSettings:function() {
		return null;
	}
});

Class ("paella.editor.MainTrackPlugin", paella.editor.TrackPlugin,{
	getTrackType:function() {
		return "master";
	},

	getTrackItems:function() {
		var exampleTracks = [{id:1,s:30,e:470}];
		return exampleTracks;
	},

	getName:function() {
		return "editorMainTrackPlugin";
	},
});

Class ("paella.editor.RightBarPlugin", paella.editor.EditorPlugin,{
	type:'editorRightBarPlugin',

	getIndex:function() {
		return 10000;
	},

	getName:function() {
		return "editorRightbarPlugin";
	},

	getTabName:function() {
		return "My Rightbar Plugin";
	},

	getContent:function() {
		var container = document.createElement('div');
		container.innerHTML = "Rightbar plugin";
		return container;
	},

	onLoadFinished:function() {

	}
});

Class ("paella.editor.EditorToolbarPlugin", paella.editor.EditorPlugin,{
	type:'editorToolbarPlugin',
	trackList:[],

	getIndex:function() {
		return 10000;
	},

	getName:function() {
		return "editorToolbarPlugin";
	},

	getButtonName:function() {
		return "Toolbar Plugin";
	},

	getIcon:function() {
		return "icon-edit";
	},

	getOptions:function() {
		return [];
	},

	onOptionSelected:function(optionIndex) {
	}
});

/*** File: src/14_editor_ui_controls.js ***/
Class ("paella.editor.Tabbar", {
	navbar:null,
	container:null,

	initialize:function(parent) {
		this.navbar = bootstrapUtils.navbar("","navbar-inverse");
		parent.appendChild(this.navbar);
		this.container = $(this.navbar).find(".navbar-inner")[0];
	}
});

Class ("paella.editor.Toolbar", {
	navbar:null,
	container:null,
	toolButton:null,
	selectedToolUtils:null,
	editorMenu:null,
	toolbarPlugins:null,

	initialize:function(parent) {
		this.navbar = bootstrapUtils.navbar("","navbar-inverse");
		parent.appendChild(this.navbar);
		this.container = $(this.navbar).find(".navbar-inner")[0];
		this.buildTrackTools();
		this.buildPlaybackControls();
		this.buildEditorMenu();
		this.buildPlugins();
	},

	buildTrackTools:function() {
		var selectionTrackName = base.dictionary.translate("Selection");
		var tools = {};
		tools[selectionTrackName] = "paella.editor.instance.bottomBar.toolbar.onToolChanged('select','" + selectionTrackName + "')";
		var trackPlugins = paella.editor.pluginManager.trackPlugins;
		trackPlugins.forEach(function(plugin) {
			var label = plugin.getTrackName();
			// TODO: tool icon
			var action = "paella.editor.instance.bottomBar.toolbar.onToolChanged('" + plugin.getName() + "','" + plugin.getTrackName() +"')";
			//var action = "paella.editor.instance.bottomBar.timeline.selectTrackList('" + plugin.getName() + "');";
			tools[label] = action;
		});
		var defaultText = base.dictionary.translate("Tool") + ": " + base.dictionary.translate('Selection');
		this.toolButton = bootstrapUtils.dropdown(defaultText,'toolDropdown',tools,'btn-mini','',false);
		this.container.appendChild(this.toolButton);
		this.selectedToolUtils = document.createElement('span');
		this.selectedToolUtils.className = 'editorToolbar_selectedToolUtils';
		this.container.appendChild(this.selectedToolUtils);
	},

	buildPlaybackControls:function() {
		var playbackControls = document.createElement('span');
		playbackControls.className = 'editorToolbarPlaybackControls';
		this.container.appendChild(playbackControls);
		var buttonData = [];
		buttonData.push({
			label:'<i class="icon-step-backward icon-white"></i>',hint:'',
			onclick:function(buttonData) {
				$(document).trigger(paella.events.seekTo,{newPositionPercent:0});
			}
		});
		buttonData.push({
			label:'<i class="icon-play icon-white"></i>',hint:'',
			onclick:function(buttonData) {
				$(document).trigger(paella.events.play);
			}
		});
		buttonData.push({
			label:'<i class="icon-pause icon-white"></i>',hint:'',
			onclick:function(buttonData) {
				$(document).trigger(paella.events.pause);
			}
		});
		buttonData.push({
			label:'<i class="icon-step-forward icon-white"></i>',hint:'',
			onclick:function(buttonData) {
				$(document).trigger(paella.events.seekTo,{newPositionPercent:99});
			}
		});
		playbackControls.appendChild(bootstrapUtils.buttonGroup(buttonData,'btn-mini',true));
	},

	buildPlugins:function() {
		var This = this;
		if (!this.toolbarPlugins) {
			this.toolbarPlugins = document.createElement('span');
			this.container.appendChild(this.toolbarPlugins);
		}
		else {
			this.toolbarPlugins.innerHTML = "";
		}
		var plugins = paella.editor.pluginManager.toolbarPlugins;
		plugins.forEach(function(plugin) {
			var i = plugins.indexOf(plugin);
			var pluginName = plugin.getName();
			var name = plugin.getButtonName();
			var options = plugin.getOptions();
			var optionsObject = {};
			var icon = plugin.getIcon();
			if (icon) { icon = icon + ' icon-white'; }
			for (var j=0;j<options.length;++j) {
				optionsObject[options[j]] = "paella.editor.instance.bottomBar.toolbar.selectPluginOption('" + pluginName + "'," + j + ")";
			}
			var button = bootstrapUtils.dropdown(name,'editorDropdown',optionsObject,'btn-mini',icon,true);
			This.toolbarPlugins.appendChild(button);
		});
	},

	buildEditorMenu:function() {
		var tools = {
		};
		tools[base.dictionary.translate("Save and close editor")] = "paella.editor.instance.bottomBar.toolbar.saveAndClose();";
		tools[base.dictionary.translate("Save changes")] = "paella.editor.instance.bottomBar.toolbar.save();";
		tools[base.dictionary.translate("Discard changes and close")] = "paella.editor.instance.bottomBar.toolbar.discardAndClose();";
		this.editorMenu = bootstrapUtils.dropdown(base.dictionary.translate('Paella Editor'),'editorDropdown',tools,'btn-mini','icon-edit icon-white',true);
		this.container.appendChild(this.editorMenu);
	},

	selectPluginOption:function(pluginName,optionIndex) {
		var plugins = paella.editor.pluginManager.toolbarPlugins;
		plugins.forEach(function(plugin) {
			if (plugin.getName()==pluginName) {
				plugin.onOptionSelected(optionIndex);
			}
		});
		this.buildPlugins();
	},

	onToolChanged:function(toolName,trackName) {
		paella.editor.instance.bottomBar.timeline.selectTrackList(toolName);
		var textElem = $(this.toolButton).find('.text')[0];
		textElem.innerHTML = base.dictionary.translate("Tool") + ": " + trackName;
		this.setupTrackTool(toolName);
	},

	setupTrackTool:function(toolName) {
		this.selectedToolUtils.innerHTML = "";
		var plugin = null;
		var i;
		for (i=0;i<paella.editor.pluginManager.trackPlugins.length;++i) {
			plugin = paella.editor.pluginManager.trackPlugins[i];
			if (toolName==plugin.getName()) {
				break;
			}
			else {
				plugin = null;
			}
		}
		if (plugin) {
			var buttonData = [];
			var tools = plugin.getTools();
			for (i=0;i<tools.length;++i) {
				buttonData.push({
					label:tools[i].label,
					plugin:plugin,
					toolName:tools[i].name,
					hint:tools[i].hint,
					onclick:function(buttonData) {
						if (buttonData.plugin.onToolSelected(buttonData.toolName)) {
							paella.editor.instance.bottomBar.timeline.rebuildTrack(plugin.getName());
							paella.editor.pluginManager.onTrackChanged(plugin);
							paella.editor.instance.rightBar.updateCurrentTab();
						}
					}
				});
			}
			if (buttonData.length>0) {
				var toolLabel = document.createElement('span');
				toolLabel.innerHTML = '&nbsp;' + base.dictionary.translate('Options') + ':';
				this.selectedToolUtils.appendChild(toolLabel);
				this.selectedToolUtils.appendChild(bootstrapUtils.buttonGroup(buttonData,'btn-mini'));
			}
		}
	},

	saveAndClose:function() {
		paella.editor.pluginManager.onSave(function(status) {
			paella.editor.instance.unloadEditor();
		});
	},

	save:function() {
		paella.editor.pluginManager.onSave(function() {

		});
	},

	discardAndClose:function() {
		paella.editor.pluginManager.onDiscard(function(status) {
			base.log.debug("Discard changes");
			paella.editor.instance.unloadEditor();
		});
	}
});

Class ("paella.editor.Timeline", {
	container:null,
	containerMinHeight:133,
	content:null,
	timeMarks:null,
	tracks:null,
	zoom:100,
	trackItemList:null,
	trackItemIndex:{
		back:5,
		front:10
	},
	trackItemOpacity:{
		back:0.5,
		front:0.9
	},
	currentTrackList:null,

	initialize:function(parent) {
		var defaultHeight = this.containerMinHeight;

		this.trackItemList = [];
		this.container = document.createElement('div');
		this.container.className = 'editorTimelineContainer';
		$(this.container).css({
			"height":defaultHeight + "px"
		});
		parent.appendChild(this.container);


		this.content = document.createElement('div');
		this.content.className = 'editorTimelineContent';
		$(this.content).css({
			'width':this.zoom + '%',
			'height':'100%'
		});
		this.container.appendChild(this.content);

		this.timeMarks = document.createElement('div');
		this.timeMarks.className = "editorTimeLineTimeMarks";
		this.content.appendChild(this.timeMarks);
		this.buildTimeMarks();

		this.tracks = document.createElement('div');
		this.tracks.className = "editorTimeLineTracks";
		this.tracks.style.minHeight = this.containerMinHeight + 'px';
		this.content.appendChild(this.tracks);

		this.loadPlugins();

		this.setupCursors();
		
		var self = this;
		paella.events.bind(paella.events.documentChanged,function(event,params) {
			self.rebuildAllTracks();
		});		
	},

	setupCursors:function() {
		var cursor = document.createElement('div');
		cursor.className = 'editorTimelineCursor';
		this.container.appendChild(cursor);
		var content = this.content;
		$(this.container).mousemove(function(event) {
			var duration = paella.player.videoContainer.duration(true);
			var contentWidth = $(content).width();
			var position = $(content).position().left;
			var left = event.pageX - position;
			$(cursor).css({'left':left + 'px'});

			var time = left * duration / contentWidth;
			cursor.innerHTML =  paella.utils.timeParse.secondsToTime(time);
		});

		var currentTimeCursor = document.createElement('div');
		currentTimeCursor.className = 'editorTimelineCursor currentTime';
		this.container.appendChild(currentTimeCursor);
		$(document).bind(paella.events.timeUpdate,function(event,params) {
			var duration = paella.player.videoContainer.duration(true);
			var contentWidth = $(content).width();
			var currentTime = params.currentTime;

			var left = currentTime * contentWidth / duration;

			$(currentTimeCursor).css({'left':left + 'px'});

			currentTimeCursor.innerHTML =  paella.utils.timeParse.secondsToTime(currentTime);
		});

		$(document).bind(paella.events.seekToTime,function(event,params) {
			var duration = paella.player.videoContainer.duration(true);
			var contentWidth = $(content).width();
			var currentTime = params.time;

			var left = currentTime * contentWidth / duration;

			$(currentTimeCursor).css({'left':left + 'px'});

			currentTimeCursor.innerHTML =  paella.utils.timeParse.secondsToTime(currentTime);
		});

		$(this.container).mouseup(function(event) {
			if (paella.editor.utils.mouse.mouseDownTarget!='track') {
				var duration = paella.player.videoContainer.duration(true);
				var contentWidth = $(content).width();
				var position = $(content).position().left;
				var left = event.pageX - position;
				var time = left * 100 / contentWidth;
				$(document).trigger(paella.events.seekTo,{newPositionPercent:time});
			}
		});
	},

	loadPlugins:function() {
		var thisClass = this;
		var container = this.tracks;
		container.innerHTML = "";
		var plugins = paella.editor.pluginManager.trackPlugins;
		var secTrackIndex = 0;
		var subclass = "";
		plugins.forEach(function(plugin) {
			if (plugin.getTrackType()=='secondary') {
				subclass = "track" + secTrackIndex;
				++secTrackIndex;
			}
			else {
				subclass = "";
			}
			var track = new paella.editor.Track(container,plugin,subclass);
			thisClass.trackItemList.push(track);
		});
		this.selectTrackList(this.currentTrackList);
	},

	rebuildAllTracks: function() {
		this.trackItemList.forEach(function(track) {
			track.rebuild();
		});		
	},
	
	rebuildTrack:function(pluginName) {
		var plugins = paella.editor.pluginManager.trackPlugins;
		for (var i=0; i<this.trackItemList.length; ++i) {
			var track = this.trackItemList[i];
			if (track.getName()==pluginName) {
				track.rebuild();
			}
		}
	},

	getHeight:function() {
		if ($(this.container).height()<this.containerMinHeight) return this.containerMinHeight;
		else return $(this.container).height();
	},

	buildTimeMarks:function() {
		var zoom = this.zoom;
		this.timeMarks.innerHTML = "";
		var barWidth = $(this.timeMarks).width();
		var duration = paella.player.videoContainer.duration(true);
		var markWidth = 70;
		var numberOfMarks = Math.ceil(barWidth / markWidth);
		var timeIncrement = duration / numberOfMarks;
		var remainder = barWidth % markWidth;
		var odd = true;
		var currentTime = 0;
		for (var i=0;i<numberOfMarks;++i) {
			var mark = document.createElement('div');
			mark.className = "editorTimeLineMark";
			if (odd) mark.className = mark.className + " odd";
			if (i==(numberOfMarks-1)) {
				markWidth = remainder;
				mark.className += " last";
			}
			mark.style.width = markWidth + 'px';
			mark.innerHTML = paella.utils.timeParse.secondsToTime(currentTime);//"0:00:00";
			currentTime += timeIncrement;
			this.timeMarks.appendChild(mark);
			var padding = 0; //$(mark).css('padding-left');
			var finalWidth = markWidth - padding;
			mark.style.width = finalWidth + 'px';
			odd = !odd;
		}
	},

	setZoom:function(percent) {
		var thisClass = this;
		this.zoom = percent;
		this.timeMarks.innerHTML = "";
		$(this.content).animate({'width':percent + '%'},{
			complete:function() {
				thisClass.buildTimeMarks();
			}
		});
	},

	onresize:function() {
		this.buildTimeMarks();
		var height = $(this.tracks).outerHeight();
		if (base.userAgent.system.Windows) {
			var padding = $(this.tracks).outerHeight() - $(this.tracks).height();
			height = height + padding - 3;
		}

		$(this.container).css('height',height + 'px');
	},

	selectTrackList:function(trackItem,noEvent,selectTrackItem) {
		if (trackItem=='select') {
			this.currentTrackList = null;
		}
		else {
			for (var i=0; i<this.trackItemList.length; ++i) {
				var trackItemObj = this.trackItemList[i];
				var container = trackItemObj.container;
				if (trackItemObj.getName()==trackItem) {
					this.currentTrackList = trackItemObj;
					$(container).css({
						'z-index':this.trackItemIndex.front,
						'opacity':this.trackItemOpacity.front
					});
				}
				else {
					$(container).css({
						'z-index':this.trackItemIndex.back,
						'opacity':this.trackItemOpacity.back
					});
				}
			}
		}

		var plugin = null;
		if (this.currentTrackList) {
			plugin = this.currentTrackList.plugin;
			if (selectTrackItem>0) this.currentTrackList.selectTrack(selectTrackItem,noEvent);
		}
		if (!noEvent) {
			paella.editor.pluginManager.onTrackChanged(plugin);
			paella.editor.instance.rightBar.updateCurrentTab();
		}
	},

	focusTrackListItem:function(trackItemName,itemId) {
		this.selectTrackList(trackItemName,true,itemId);
		var trackElement = $('#' + paella.editor.TrackUtils.buildTrackItemId(trackItemName,itemId))[0];
		if (trackElement) {
			var scrollLeft = paella.editor.instance.bottomBar.timeline.container.scrollLeft;
			var itemOffset = $(trackElement).offset().left - 10;
			var newScroll = scrollLeft + itemOffset;
			 $(paella.editor.instance.bottomBar.timeline.container).animate({scrollLeft : newScroll},{duration:100});
		}
	}
});

Class ("paella.editor.BottomToolbar", {
	container:null,
	content:null,

	initialize:function(parent) {
		this.container = document.createElement('div');
		this.container.className = 'editorBottomToolbarContainer';
		parent.appendChild(this.container);

		this.content = document.createElement('div');
		this.container.appendChild(this.content);
		this.content.appendChild(bootstrapUtils.dropup('Zoom','zoomDropup',{
			'100%':'paella.editor.instance.bottomBar.timeline.setZoom(100)',
			'200%':'paella.editor.instance.bottomBar.timeline.setZoom(200)',
			'500%':'paella.editor.instance.bottomBar.timeline.setZoom(200)',
			'1000%':'paella.editor.instance.bottomBar.timeline.setZoom(1000)',
			'3000%':'paella.editor.instance.bottomBar.timeline.setZoom(3000)',
			'5000%':'paella.editor.instance.bottomBar.timeline.setZoom(5000)'
		},'btn-mini','icon-search',true));
	}
});

Class ("paella.editor.BottomBar", base.AsyncLoaderCallback, {
	editor:null,
	container:null,
	toolbar:null,
	timeline:null,
	bottomToolbar:null,

	initialize:function() {
		this.editor = paella.editor.instance;
	},

	load:function(onSuccess,onError) {
		var thisClass = this;
		this.container = document.createElement('div');
		this.container.className = "paellaEditorBottomBar";
	//	this.container.style.height = this.getHeight() + 'px';
		this.editor.editorContainer.appendChild(this.container);
		this.build();
		onSuccess();
	},

	build:function() {
		this.toolbar = new paella.editor.Toolbar(this.container);
		this.timeline = new paella.editor.Timeline(this.container);
		this.bottomToolbar = new paella.editor.BottomToolbar(this.container);
	},

	getHeight:function() {
		return $(this.container).height();
	},

	onresize:function() {
		this.timeline.onresize();
	}
});

Class ("paella.editor.RightBar", base.AsyncLoaderCallback,{
	editor:null,
	container:null,
	tabBar:null,
	selectedTab:0,
	tabContent:null,

	initialize:function() {
		this.editor = paella.editor.instance;
	},

	load:function(onSuccess,onError) {
		this.container = document.createElement('div');
		this.container.className = "paellaEditorRightBar";
		this.container.style.width = this.getWidth() + 'px';
		this.container.style.bottom = this.editor.bottomBar.getHeight() + 'px';
		this.editor.editorContainer.appendChild(this.container);
		this.tabBar = new paella.editor.Tabbar(this.container);
		this.tabContent = document.createElement('div');
		this.tabContent.className = "paellaEditorRightBarContent";
		this.container.appendChild(this.tabContent);

		this.loadPlugins();
		onSuccess();
	},

	loadPlugins:function() {
		var thisClass = this;
		var container = this.tabBar.container;
		container.innerHTML = "";
		var ul = document.createElement('ul');
		ul.className = "nav";
		var active = "active";
		var plugins = paella.editor.pluginManager.rightBarPlugins;
		if (plugins.length>0) {
			var i=0;
			plugins.forEach(function(plugin) {
				var i = plugins.indexOf(plugin);
				ul.appendChild(thisClass.getTab(plugin,i));
			});
			container.appendChild(ul);

			var currentTab = plugins[this.selectedTab];
			this.tabContent.innerHTML = "";
			this.tabContent.appendChild(currentTab.getContent());
			currentTab.onLoadFinished();
		}
	},

	getTab:function(plugin,index) {
		var thisClass = this;
		var active = "";
		if (index==this.selectedTab) active = "active";
		var li = document.createElement('li');
		li.className = active;
		var a = document.createElement('a');
		a.className = "rightBarPlugin";
		a.setAttribute('href','JavaScript:void(0);');
		a.innerHTML = '<span class="editorRightBarTabIcon ' + plugin.getName() + '"></span>' + plugin.getTabName();
		a.tabIndex = index;
		$(a).click(function(event) {
			thisClass.loadTab(this.tabIndex);
		});
		li.appendChild(a);
		return li;
	},

	updateCurrentTab:function() {
		if (this.tabBar) {	// Prevents update current tab if the editor is the tab bar is not loaded
			this.loadPlugins();
		}
	},

	getWidth:function() {
		return 300;
	},

	loadTab:function(index) {
		this.selectedTab = index;
		this.loadPlugins();
	},

	onresize:function() {
		this.container.style.bottom = this.editor.bottomBar.getHeight() + 'px';
	}
});

/*** File: src/15_editor_track.js ***/
paella.editor.TrackUtils = {
	buildTrackItemId:function(trackName,trackItemId) {
		return 'paellaEditorTrack_' + trackName + '_' + trackItemId;
	},
};

Class ("paella.editor.Track", {
	container:null,
	plugin:null,
	trackIndex:{
		back:10,
		front:20
	},
	trackOpacity:{
		back:0.7,
		front:1
	},
	trackElemList:null,

	buildTrackItemId:function(trackName,trackItemId) {
		return paella.editor.TrackUtils.buildTrackItemId(trackName,trackItemId);
	},

	initialize:function(parentContainer,plugin,subclass) {
		this.trackElemList = [];
		this.plugin = plugin;
		var newTrackGroup = document.createElement('div');
		this.container = newTrackGroup;
		parentContainer.appendChild(newTrackGroup);
		this.buildTracks(newTrackGroup);
		type = plugin.getTrackType();
		if (type=="master") {
			newTrackGroup.className = "editorTrackListItem master " + subclass;
		}
		else if (type=="secondary") {
			newTrackGroup.className = "editorTrackListItem secondary " + subclass;
		}
	},

	getName:function() {
		return this.plugin.getName();
	},

	rebuild:function() {
		this.container.innerHTML = '';
		this.buildTracks(this.container);
	},

	buildTracks:function(container) {
		var plugin = this.plugin;
		var trackList = plugin.getTrackItems();
		for (var i=0; i<trackList.length; ++i) {
			var trackItem = this.getTrack(trackList[i]);
			this.trackElemList.push(trackItem);
			this.container.appendChild(trackItem);
		}
	},

	getTrack:function(trackData) {
		var thisClass = this;
		var plugin = this.plugin;
		var duration = paella.player.videoContainer.duration(true);
		trackData.d = trackData.e - trackData.s;
		var track = document.createElement('div');
		track.className = 'editorTrackItem ' + plugin.getName();
		if(plugin.isSegment()) {
			track.className += " editorTrackItemSegment";
		} else {
			track.className += " editorTrackItemMark";
		}
		track.id = this.buildTrackItemId(plugin.getName(),trackData.id);
		var start = trackData.s * 100 / duration;
		var width = plugin.isSegment() ? (trackData.d * 100 / duration) + '%' : '3px';
		$(track).css({
			'left':start + '%',
			'width':width,
			'background-color':plugin.getColor(),
			'opacity':this.trackOpacity.back
		});
		track.trackInfo = {
			trackData:trackData,
			plugin:plugin
		};

		var label = document.createElement('div');
		if (trackData.name && trackData.name!='') {
			label.innerHTML = trackData.name;
		}
		else {
			label.innerHTML = plugin.getTrackName();
		}

		label.className = 'editorTrackItemLabel ' + this.plugin.getTrackType();
		label.style.color = plugin.getTextColor();
		track.appendChild(label);

		if (!trackData.lock) {
			if (plugin.allowResize()) {
				var resizerL = document.createElement('div');
				resizerL.className = 'editorTrackItemResizer left';
				resizerL.track = track;
				track.appendChild(resizerL);
				var resizerR = document.createElement('div');
				resizerR.className = 'editorTrackItemResizer right';
				resizerR.track = track;
				track.appendChild(resizerR);

				$(resizerL).mousedown(function(event) {
					paella.editor.utils.mouse.mouseDownTarget = 'track';
					thisClass.onResizerDown(this.track,'L',event);
				});
				$(resizerR).mousedown(function(event) {
					paella.editor.utils.mouse.mouseDownTarget = 'track';
					thisClass.onResizerDown(this.track,'R',event);
				});
			}

			if (plugin.allowDrag()) {
				var moveArea = document.createElement('div');
				moveArea.className = 'editorTrackItemMoveArea';
				moveArea.track = track;
				track.appendChild(moveArea);
				$(moveArea).mousedown(function(event) {
					paella.editor.utils.mouse.mouseDownTarget = 'track';
					thisClass.onResizerDown(this.track,'M',event);
				});
			}
		}
		else {
			var lockIcon = document.createElement('i');
			lockIcon.className = 'editorTrackItemLock icon-lock icon-white';
			track.appendChild(lockIcon);
		}

		$(track).mousedown(function(event) {
			paella.editor.utils.mouse.mouseDownTarget = 'track';
			thisClass.onTrackDown(this,event);
		});

		$(document).mousemove(function(event) {
			thisClass.onResizerMove(event);
		});
		$(document).mouseup(function(event) {
			paella.editor.utils.mouse.mouseDownTarget = '';
			thisClass.onResizerUp(this.track,event);
		});
		$(track).dblclick(function(event) {
			thisClass.onDblClick(this.trackInfo,event);
		});
		return track;
	},


	currentTrack:null,
	resizeTrack:null,
	currentResizer:null,
	lastPos:{x:0,y:0},

	selectTrack:function(requestedTrack,noEvents) {
		var i, trackElem;
		if (typeof(requestedTrack)=="number") {
			for (i=0;i<this.trackElemList.length;++i) {
				trackElem = this.trackElemList[i];
				if (trackElem.trackInfo.trackData.id==requestedTrack) {
					requestedTrack = trackElem;
					break;
				}
			}
		}
		if (typeof(requestedTrack)!="number" && this.currentTrack!=requestedTrack) {
			if (!noEvents) this.onUnselect();
			for (i=0;i<this.trackElemList.length;++i) {
				trackElem = this.trackElemList[i];
				if (trackElem==requestedTrack) {
					this.currentTrack = trackElem;
					if (!noEvents) this.onSelect(trackElem.trackInfo);
					$(trackElem).css({
						'z-index':this.trackIndex.front,
						'opacity':this.trackOpacity.front
					});
				}
				else {
					$(trackElem).css({
						'z-index':this.trackIndex.back,
						'opacity':this.trackOpacity.back
					});
				}
			}
		}
	},

	onSelect:function(trackInfo) {
		this.plugin.onSelect(trackInfo.trackData);
	},

	onDblClick:function(track,event) {
		this.plugin.onDblClick(track.trackData);
	},

	onUnselect:function() {
		this.plugin.onUnselect();
	},

	onTrackDown:function(track,event) {
	// This will work only in secondary track items and in the first main track plugin:
		this.selectTrack(track);
		paella.editor.instance.bottomBar.toolbar.onToolChanged(this.plugin.getName(),this.plugin.getTrackName());

	},

	onResizerDown:function(track,resizer,event) {
		if (event) {
			this.resizeTrack = track;
			this.currentResizer = resizer;
			this.lastPos.x = event.clientX;
			this.lastPos.y = event.clientY;
		}
	},

	onResizerUp:function(track,event) {
		if (this.resizeTrack) {
			this.resizeTrack = document.getElementById(this.resizeTrack.id); //Workaround. Fixes breaks resetting.
			var duration = paella.player.videoContainer.duration(true);
			var totalWidth = $(this.container).width();
			var left = $(this.resizeTrack).position().left;
			left = left * 100 / totalWidth;
			var width = $(this.resizeTrack).width();
			width = width * 100 / totalWidth;
			var start = left * duration / 100;
			var end = (left + width) * duration / 100;

			var plugin = this.resizeTrack.trackInfo.plugin;
			var trackData = this.resizeTrack.trackInfo.trackData;
			plugin.onTrackChanged(trackData.id,start,end);
			paella.editor.pluginManager.onTrackChanged(plugin);
			paella.editor.instance.rightBar.updateCurrentTab();
			paella.editor.instance.bottomBar.timeline.rebuildTrack(plugin.getName());

			if(plugin.isSegment()) {
				width = width + '%';
			} else {
				width = '3px';
			}

			$(this.resizeTrack).css({
				'left':left + '%',
				'width':width
			});
		}
		this.resizeTrack = null;
	},

	onResizerMove:function(event) {
		if (this.resizeTrack) {
			var diff = {
				x:event.clientX - this.lastPos.x,
				y:event.clientY - this.lastPos.y
			};
			var duration = paella.player.videoContainer.duration(true);
			var left = $(this.resizeTrack).position().left;
			var width = $(this.resizeTrack).width();

			//if (left<0) return;
			//else if ((left + width)>duration) return;
			if (this.currentResizer=='L') {
				left += diff.x;
				width -= diff.x;
				$(this.resizeTrack).css({'left':left + 'px','width':width + 'px'});
			}
			else if (this.currentResizer=='R') {
				width += diff.x;
				$(this.resizeTrack).css({'width':width + 'px'});
			}
			else if (this.currentResizer=='M') {	// Move track tool
				left +=diff.x;
				$(this.resizeTrack).css({'left':left + 'px'});
			}
			this.lastPos.x = event.clientX;
			this.lastPos.y = event.clientY;
		}
	}
});

/*** File: src/16_embed_player.js ***/
Class ("paella.editor.EmbedPlayer", base.AsyncLoaderCallback,{
	editar:null,

	initialize:function() {
		this.editor = paella.editor.instance;
	},

	load:function(onSuccess,onError) {
		var barHeight = this.editor.bottomBar.getHeight() + 20;
		var rightBarWidth = this.editor.rightBar.getWidth() + 20;
		$(paella.player.mainContainer).css({
			'position':'fixed',
			"width":"",
			"bottom":barHeight + "px",
			"right":rightBarWidth + "px",
			"left":"20px",
			"top":"20px"
		});
		paella.player.mainContainer.className = "paellaMainContainerEditorMode";
		new Timer(function(timer) {
			paella.player.controls.disable();
			paella.player.onresize();
			if (onSuccess) {
				onSuccess();
			}
		},500);
	},

	restorePlayer:function() {
		$('body')[0].appendChild(paella.player.mainContainer);
		paella.player.controls.enable();
		paella.player.mainContainer.className = "";
		$(paella.player.mainContainer).css({
			'position':'',
			"width":"",
			"bottom":"",
			"left":"",
			"right":"",
			"top":""
		});
		paella.player.onresize();
	},

	onresize:function() {
		var barHeight = this.editor.bottomBar.getHeight() + 20;
		var rightBarWidth = this.editor.rightBar.getWidth() + 20;
		$(paella.player.mainContainer).css({
			'position':'fixed',
			"width":"",
			"bottom":barHeight + "px",
			"right":rightBarWidth + "px",
			"left":"20px",
			"top":"20px"
		});

	}
});

/*** File: src/17_paella_editor.js ***/
Class ("paella.editor.Editor", {
	config:null,
	editorContainer:null,
	isLoaded:false,
	bottomBar:null,
	rightBar:null,
	embedPlayer:null,
	loader:null,

	initialize:function() {
		if (paella.player.accessControl.permissions.canWrite) {
			var thisClass = this;
			paella.editor.instance = this;
			paella.initDelegate.loadEditorConfig(function(config) {
				thisClass.config = config;
				thisClass.loadEditor();
			});
		}
	},

	loadEditor:function() {
		paella.keyManager.enabled = false;
		var thisClass = this;
		this.editorContainer = document.createElement('div');
		$('body')[0].appendChild(this.editorContainer);
		this.editorContainer.className = 'editorContainer';
		this.editorContainer.id = "editorContainer";
		this.editorContainer.appendChild(paella.player.mainContainer);
		$('body')[0].style.backgroundImage = "url("+paella.utils.folders.resources()+"images/editor_video_bkg.png)";

		this.loader = new paella.AsyncLoader();
		this.bottomBar = this.loader.addCallback(new paella.editor.BottomBar());
		this.rightBar = this.loader.addCallback(new paella.editor.RightBar());
		this.embedPlayer = this.loader.addCallback(new paella.editor.EmbedPlayer());
		this.loader.load(function() {
			thisClass.onLoadSuccess();
		},function() {
			thisClass.onLoadFail();
		});
	},

	onLoadSuccess:function() {
		this.isLoaded = true;
		var thisClass = this;
		this.onresize();
		$(window).resize(function(event) {
			thisClass.onresize();
		});
		$(document).trigger(paella.events.play);
		new Timer(function(timer) {
			$(document).trigger(paella.events.pause);
		},100);
		paella.events.bind(paella.events.documentChanged,function(event,params) {
			window.onbeforeunload = function(event) { return base.dictionary.translate('There are unsaved changes'); };
		});
		paella.events.bind(paella.events.didSaveChanges,function(event,params) {
			window.onbeforeunload = null;
		});
	},

	onLoadFail:function() {

	},

	unloadEditor:function() {
		paella.keyManager.enabled = true;
		this.embedPlayer.restorePlayer();
		$('body')[0].removeChild(this.editorContainer);
		$('body')[0].style.backgroundImage = "";
		this.editorContainer = null;
		this.isLoaded = false;
		$(document).trigger(paella.events.pause);
		$(document).trigger(paella.events.hideEditor);
	},

	onresize:function() {
		if (this.isLoaded) {
			this.bottomBar.onresize();
			this.rightBar.onresize();
			this.embedPlayer.onresize();
		}
	}
});


/*** File: src/99_deprecated.js ***/
///////////////////////////////////////////////////////
// Deprecated functions/objects
//
//    Will be removed in next paella version.
///////////////////////////////////////////////////////


function DeprecatedClass(name, replacedBy, p) {
	Class (name, p, {
		initialize: function() {
			base.log.warning(name +  " is deprecated, use " + replacedBy + " instead.");
			this.parent.apply(this, arguments);
		}
	});
}

function DeprecatedFunc(name, replacedBy, func) {
	function ret(){
		base.log.warning(name +  " is deprecated, use " + replacedBy + " instead.");
		func.apply(this, arguments);
	}
	
	return ret;
}

// Pella Dictionary
///////////////////////////////////////////////////////
DeprecatedClass("paella.Dictionary", "base.Dictionary", base.Dictionary);
paella.dictionary = base.dictionary;

// Paella AsyncLoader
///////////////////////////////////////////////////////
DeprecatedClass("paella.AsyncLoaderCallback", "base.AsyncLoaderCallback", base.AsyncLoaderCallback);
DeprecatedClass("paella.AjaxCallback", "base.AjaxCallback", base.AjaxCallback);
DeprecatedClass("paella.JSONCallback", "base.JSONCallback", base.JSONCallback);
DeprecatedClass("paella.DictionaryCallback", "base.DictionaryCallback", base.DictionaryCallback);
DeprecatedClass("paella.AsyncLoader", "base.AsyncLoader", base.AsyncLoader);

// Paella Timer
///////////////////////////////////////////////////////
DeprecatedClass("paella.Timer", "base.Timer", base.Timer);
DeprecatedClass("paella.utils.Timer", "base.Timer", base.Timer);


// Paella Ajax
///////////////////////////////////////////////////////
paella.ajax = {};
paella.ajax['send'] = DeprecatedFunc("paella.ajax.send", "base.ajax.send", base.ajax.send);
paella.ajax['get'] = DeprecatedFunc("paella.ajax.get", "base.ajax.get", base.ajax.get);
paella.ajax['put'] = DeprecatedFunc("paella.ajax.put", "base.ajax.put", base.ajax.put);
paella.ajax['post'] = DeprecatedFunc("paella.ajax.post", "base.ajax.post", base.ajax.post);
paella.ajax['delete'] = DeprecatedFunc("paella.ajax.delete", "base.ajax.delete", base.ajax.send);



// Paella UI
///////////////////////////////////////////////////////
paella.ui = {};

paella.ui.Container = function(params) {
	var elem = document.createElement('div');
	if (params.id) elem.id = params.id;
	if (params.className) elem.className = params.className;
	if (params.style) $(elem).css(params.style);
	return elem;
};




// paella.utils
///////////////////////////////////////////////////////
paella.utils.ajax = base.ajax;
paella.utils.cookies = base.cookies;
paella.utils.parameters = base.parameters;
paella.utils.require = base.require;
paella.utils.importStylesheet = base.importStylesheet;
paella.utils.language = base.dictionary.currentLanguage;
paella.utils.uuid = base.uuid;
paella.utils.userAgent = base.userAgent;




// paella.debug
///////////////////////////////////////////////////////
paella.debug = {
	log:function(msg) {
		base.log.warning("paella.debug.log is deprecated, use base.debug.[error/warning/debug/log] instead.");
		base.log.log(msg);
	}
};
/*** File: plugins/edu.harvard.dce.paella.flexSkipPlugin/flexskipbutton.js ***/
Class("paella.plugins.FlexSkipPlugin", paella.ButtonPlugin, {
	getAlignment: function() {
		return 'left';
	},
	getName: function() {
		return "edu.harvard.dce.paella.flexSkipPlugin";
	},
	getIndex: function() {
		return 121;
	},
	getSubclass: function() {
		return 'flexSkip_Rewind_10';
	},
	formatMessage: function() {
		return 'Rewind 10 seconds';
	},
	getDefaultToolTip: function() {
		return base.dictionary.translate(this.formatMessage());
	},
	getMinWindowSize: function() {
		return 510;
	},

	checkEnabled: function(onSuccess) {
		onSuccess(!paella.player.isLiveStream());
	},
	
	action: function(button) {
		var newTime = paella.player.videoContainer.currentTime() - 10;
		paella.player.videoContainer.seekToTime(newTime);
	}
});

paella.plugins.flexSkipPlugin = new paella.plugins.FlexSkipPlugin();



Class("paella.plugins.FlexSkipForwardPlugin", paella.plugins.FlexSkipPlugin, {
	getIndex: function() {
		return 122;
	},
	getName: function() {
		return "edu.harvard.dce.paella.flexSkipForwardPlugin";
	},
	
	getSubclass: function() {
		return 'flexSkip_Forward_30';
	},
	formatMessage: function() {
		return 'Forward 30 seconds';
	},
	
	action: function(button) {
		var newTime = paella.player.videoContainer.currentTime() + 30;
		paella.player.videoContainer.seekToTime(newTime);
	}
});

paella.plugins.flexSkipForwardPlugin = new paella.plugins.FlexSkipForwardPlugin();

/*** File: plugins/es.teltek.paella.chapterMarksPlugins/editor.js ***/
Class ("paella.plugins.MarksEditorPlugin",paella.editor.MainTrackPlugin, {
	tracks:null,
	selectedTrackItem:null,

	checkEnabled:function(onSuccess) {
		var This = this;
		this.tracks = [];
		this.tracksData = [];
		paella.data.read('marks',{id:paella.initDelegate.getId()},function(data,status) {
			if (data && typeof(data)=='object' && data.marks && data.marks.length>0) {
				This.tracks = data.marks;
			}
			//Copy this.tracks on this.tracksData as backup.
			This.tracksData = JSON.parse(JSON.stringify(This.tracks));
			onSuccess(true);
		});
	},

	setup:function() {
		if (base.dictionary.currentLanguage()=="es") {
			var esDict = {
				'Chapter marks':'Marcas de capítulo',
				'Chapter mark':'Marca de capítulo',
				'Create a new chapter marks in the current position': 'Añade una marca de captitulo en el instante actual',
				'Delete selected chapter mark': 'Borra la marca de capítulo seleccionada'
			};
			base.dictionary.addDictionary(esDict);
		}
	},

	getTrackItems:function() {
		return this.tracks;
	},

	getTools:function() {
		return [
			{name:'create',label:base.dictionary.translate('Create'),hint:base.dictionary.translate('Create a new chapter marks in the current position')},
			{name:'delete',label:base.dictionary.translate('Delete'),hint:base.dictionary.translate('Delete selected chapter mark')}
		];
	},

	onToolSelected:function(toolName) {
		if (this.selectedTrackItem && toolName=='delete' && this.selectedTrackItem) {
			paella.events.trigger(paella.events.documentChanged);
			this.tracks.splice(this.tracks.indexOf(this.selectedTrackItem),1);
			return true;
		}
		else if (toolName=='create') {
			paella.events.trigger(paella.events.documentChanged);
			var start = paella.player.videoContainer.currentTime();
			var end = start;
			var id = this.getTrackUniqueId();
			var content = base.dictionary.translate('Chapter mark');
			this.tracks.push({id:id,s:start,e:end,content:content,name:content});
			return true;
		}
	},

	getTrackUniqueId:function() {
		var newId = -1;
		if (this.tracks.length==0) return 1;
		for (var i=0;i<this.tracks.length;++i) {
			if (newId<=this.tracks[i].id) {
				newId = this.tracks[i].id + 1;
			}
		}
		return newId;
	},

	getName:function() {
		return "pumukitChapterMarkPlugin";
	},

	getTrackName:function() {
		return base.dictionary.translate("Chapter marks");
	},

	getColor:function() {
		return 'red';
	},

	getTextColor:function() {
		return 'rgb(90,90,90)';
	},

	onTrackChanged:function(id,start,end) {
		paella.events.trigger(paella.events.documentChanged);
		var item = this.getTrackItem(id);
		if (item) {
			item.s = start;
			item.e = end;
			this.selectedTrackItem = item;
		}
	},

	onTrackContentChanged:function(id,content) {
		paella.events.trigger(paella.events.documentChanged);
		var item = this.getTrackItem(id);
		if (item) {
			item.content = paella.AntiXSS.htmlEscape(content);
			item.name = paella.AntiXSS.htmlEscape(content);
		}
	},

    isSegment:function() {
        return false;
    },

	allowEditContent:function() {
		return true;
	},

    allowResize:function() {
        return false;
    },

	getTrackItem:function(id) {
		for (var i=0;i<this.tracks.length;++i) {
			if (this.tracks[i].id==id) return this.tracks[i];
		}
	},

	contextHelpString:function() {
		if (base.dictionary.currentLanguage()=="es") {
			return "Utiliza esta herramienta para crear, borrar y editar marcas de capítulos. Para crear una marca, selecciona el instante de tiempo haciendo clic en el fondo de la línea de tiempo, y pulsa el botón 'Crear'. Utiliza esta pestaña para editar el texto de los capítulos";
		}
		else {
			return "Use this tool to create, delete and edit chapter marks. To create a chapter chapter, select the time instant clicking the timeline's background and press 'create' button. Use this tab to edit the chapter mark text.";
		}
	},

	onSave:function(success) {
		var data = {
			marks:this.tracks
		};
		paella.data.write('marks',{id:paella.initDelegate.getId()},data,function(response,status) {
                        if(typeof paella.plugins.marksPlayerPlugin !== 'undefined')
			    paella.plugins.marksPlayerPlugin.marks = data.marks;
			success(status);
		});
		//Update this.tracksData backup tracks
		this.tracksData = JSON.parse(JSON.stringify(this.tracks));

	},

	onDiscard:function(success) {
		//Override discarded changes using this.tracksData backup
		this.tracks = JSON.parse(JSON.stringify(this.tracksData));
		success(true);
	}
});

paella.plugins.marksEditorPlugin = new paella.plugins.MarksEditorPlugin();


/*** File: plugins/es.upv.paella.TrimmingPlugins/trimming_editor.js ***/
paella.plugins.TrimmingTrackPlugin = Class.create(paella.editor.MainTrackPlugin,{
	trimmingTrack:null,
	trimmingData:{s:0,e:0},

	getTrackItems:function() {
		if (this.trimmingTrack==null) {
			this.trimmingTrack = {id:1,s:0,e:0};
			this.trimmingTrack.s = paella.player.videoContainer.trimStart();
			this.trimmingTrack.e = paella.player.videoContainer.trimEnd();
			this.trimmingData.s = this.trimmingTrack.s;
			this.trimmingData.e = this.trimmingTrack.e;
		}		
		var tracks = [];
		tracks.push(this.trimmingTrack);
		return tracks;
	},
		
	getName:function() { return "es.upv.paella.editor.trimmingTrackPlugin"; },

	getTools:function() {
		if(this.config.enableResetButton) {
			return [
				{name:'reset', label:base.dictionary.translate('Reset'), hint:base.dictionary.translate('Resets the trimming bar to the default length of the video.')}
			];
		}
	},

	onToolSelected:function(toolName) {
		if(this.config.enableResetButton) {
		    if(toolName=='reset') {
			this.trimmingTrack = {id:1,s:0,e:0};
			this.trimmingTrack.s = 0;
			this.trimmingTrack.e = paella.player.videoContainer.duration(true);
			return true;
			}
		}
	},

	getTrackName:function() {
		return base.dictionary.translate("Trimming");
	},
	
	getColor:function() {
		return 'rgb(0, 51, 107)';
	},
	
	//checkEnabled:function(isEnabled) {
	//	isEnabled(paella.plugins.trimmingLoaderPlugin.config.enabled);
		//isEnabled(paella.player.config.trimming && paella.player.config.trimming.enabled);
		//},
	
	onSave:function(onDone) {
		paella.player.videoContainer.enableTrimming();
		paella.player.videoContainer.setTrimmingStart(this.trimmingTrack.s);
		paella.player.videoContainer.setTrimmingEnd(this.trimmingTrack.e);

		this.trimmingData.s = this.trimmingTrack.s;
		this.trimmingData.e = this.trimmingTrack.e;
		
		paella.data.write('trimming',{id:paella.initDelegate.getId()},{start:this.trimmingTrack.s,end:this.trimmingTrack.e},function(data,status) {
			onDone(status);
		});
	},
	
	onDiscard:function(onDone) {
		this.trimmingTrack.s = this.trimmingData.s;
		this.trimmingTrack.e = this.trimmingData.e;
		onDone(true);
	},
	
	allowDrag:function() {
		return false;
	},
	
	onTrackChanged:function(id,start,end) {
		//Checks if the trimming is valid (start >= 0 and end <= duration_of_the_video)
		playerEnd = paella.player.videoContainer.duration(true);
		start = (start < 0)? 0 : start;
		end = (end > playerEnd)? playerEnd : end;
		this.trimmingTrack.s = start;
		this.trimmingTrack.e = end;
		this.parent(id,start,end);
	},

	contextHelpString:function() {
		// TODO: Implement this using the standard base.dictionary class
		if (base.dictionary.currentLanguage()=="es") {
			return "Utiliza la herramienta de recorte para definir el instante inicial y el instante final de la clase. Para cambiar la duración solo hay que arrastrar el inicio o el final de la pista \"Recorte\", en la linea de tiempo.";
		}
		else {
			return "Use this tool to define the start and finish time.";
		}
	}
});

paella.plugins.trimmingTrackPlugin = new paella.plugins.TrimmingTrackPlugin();


/*** File: plugins/es.upv.paella.TrimmingPlugins/trimming_player.js ***/
Class ("paella.plugins.TrimmingLoaderPlugin",paella.EventDrivenPlugin,{
	
	getName:function() { return "es.upv.paella.trimmingPlayerPlugin"; },
	checkEnabled:function(onSuccess) {
	    this.loadTrimming();
            onSuccess(true);
	},
		
	getEvents:function() { return [paella.events.controlBarLoaded, paella.events.showEditor, paella.events.hideEditor]; },

	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.controlBarLoaded:
				this.loadTrimming();
				break;
			case paella.events.showEditor:
				if (paella.player.accessControl.permissions.canWrite) {
					paella.player.videoContainer.disableTrimming();
				}
				break;
			case paella.events.hideEditor:
				if (paella.player.config.trimming && paella.player.config.trimming.enabled) {
					paella.player.videoContainer.enableTrimming();
				}
				break;
		}
	},
	
	loadTrimming:function() {
		var videoId = paella.initDelegate.getId();
		paella.data.read('trimming',{id:videoId},function(data,status) {
			if (data && status && data.end>0) {
				paella.player.videoContainer.enableTrimming();
				paella.player.videoContainer.setTrimming(data.start, data.end);
			}
			else {
				// Check for optional trim 'start' and 'end', in seconds, in location args
				var startTime =  base.parameters.get('start');
				var endTime = base.parameters.get('end');
				if (startTime && endTime) {
					paella.player.videoContainer.enableTrimming();
					paella.player.videoContainer.setTrimming(startTime, endTime);
				}
			}
		});
	}
});

paella.plugins.trimmingLoaderPlugin = new paella.plugins.TrimmingLoaderPlugin();

/*** File: plugins/es.upv.paella.annotationPlugins/editor.js ***/
Class ("paella.plugins.AnnotationsEditorPlugin",paella.editor.TrackPlugin, {
	tracks:null,
	selectedTrackItem:null,

	checkEnabled:function(onSuccess) {
		var This = this;
		this.tracks = [];
		paella.data.read('annotations',{id:paella.initDelegate.getId()},function(data,status) {
			if (data && typeof(data)=='object' && data.annotations && data.annotations.length>0) {
				This.tracks = data.annotations;
			}
			onSuccess(true);
		});
	},

	setup:function() {
		if (base.dictionary.currentLanguage()=="es") {
			var esDict = {
				'Annotation':'Anotación',
				'Annotations':'Anotaciones'
			};
			base.dictionary.addDictionary(esDict);
		}
	},

	getTrackItems:function() {
		return this.tracks;
	},

	getTools:function() {
		return [
			{name:'create',label:base.dictionary.translate('Create'),hint:base.dictionary.translate('Create a new caption in the current position')},
			{name:'delete',label:base.dictionary.translate('Delete'),hint:base.dictionary.translate('Delete selected caption')}
		];
	},

	onToolSelected:function(toolName) {
		if (this.selectedTrackItem && toolName=='delete' && this.selectedTrackItem) {
			paella.events.trigger(paella.events.documentChanged);
			this.tracks.splice(this.tracks.indexOf(this.selectedTrackItem),1);
			return true;
		}
		else if (toolName=='create') {
			paella.events.trigger(paella.events.documentChanged);
			var start = paella.player.videoContainer.currentTime();
			var end = start + 30;
			var id = this.getTrackUniqueId();
			var content = base.dictionary.translate('Annotation');
			this.tracks.push({id:id,s:start,e:end,content:content,name:content});
			return true;
		}
	},

	getTrackUniqueId:function() {
		var newId = -1;
		if (this.tracks.length==0) return 1;
		for (var i=0;i<this.tracks.length;++i) {
			if (newId<=this.tracks[i].id) {
				newId = this.tracks[i].id + 1;
			}
		}
		return newId;
	},

	getName:function() {
		return "es.upv.paella.editor.trackAnnotations";
	},

	getTrackName:function() {
		return base.dictionary.translate("Annotations");
	},

	getColor:function() {
		return 'rgb(212, 212, 224)';
	},

	getTextColor:function() {
		return 'rgb(90,90,90)';
	},

	onTrackChanged:function(id,start,end) {
		paella.events.trigger(paella.events.documentChanged);
		var item = this.getTrackItem(id);
		if (item) {
			item.s = start;
			item.e = end;
			this.selectedTrackItem = item;
		}
	},

	onTrackContentChanged:function(id,content) {
		paella.events.trigger(paella.events.documentChanged);
		var item = this.getTrackItem(id);
		if (item) {
			//item.content = content;
			item.content = paella.AntiXSS.htmlEscape(content);
			//item.name = content;
			item.name = paella.AntiXSS.htmlEscape(content);

		}
	},

	allowEditContent:function() {
		return true;
	},

	getTrackItem:function(id) {
		for (var i=0;i<this.tracks.length;++i) {
			if (this.tracks[i].id==id) return this.tracks[i];
		}
	},

	contextHelpString:function() {
		if (base.dictionary.currentLanguage()=="es") {
			return "Utiliza esta herramienta para crear, borrar y editar anotaciones. Para crear una anotación, selecciona el instante de tiempo haciendo clic en el fondo de la línea de tiempo, y pulsa el botón 'Crear'. Utiliza esta pestaña para editar el texto de las anotaciones";
		}
		else {
			return "Use this tool to create, delete and edit video annotations. To create an annotation, select the time instant clicking the timeline's background and press 'create' button. Use this tab to edit the annotation text.";
		}
	},

	onSave:function(success) {
		var data = {
			annotations:this.tracks
		};
		paella.data.write('annotations', {id:paella.initDelegate.getId()},data,function(response,status) {
			paella.plugins.annotationsPlayerlugin.annotations = data.annotations;
			success(status);
		});
	}
});

paella.plugins.annotationsEditorPlugin = new paella.plugins.AnnotationsEditorPlugin();

/*** File: plugins/es.upv.paella.annotationPlugins/player.js ***/
Class ("paella.plugins.AnnotationsPlayerPlugin",paella.EventDrivenPlugin,{
	annotations:null,
	lastEvent:0,

	visibleAnnotations:null,

	getName:function() { return "es.upv.paella.annotationsPlayerPlugin"; },
	checkEnabled:function(onSuccess) {
		var This = this;
		this.annotations = [];
		this.visibleAnnotations = [];
		paella.data.read('annotations',{id:paella.initDelegate.getId()},function(data,status) {
			if (data && typeof(data)=='object' && data.annotations && data.annotations.length>0) {
				This.annotations = data.annotations;
			}
			onSuccess(true);
		});
	},

	getEvents:function() { return [paella.events.timeUpdate]; },

	onEvent:function(eventType,params) {
		this.checkAnnotations(params);
	},

	checkAnnotations:function(params) {
		var a;
		for (var i=0; i<this.annotations.length; ++i) {
			a = this.annotations[i];
			if (a.s<params.currentTime && a.e>params.currentTime) {
				this.showAnnotation(a);
			}
		}

		for (var key in this.visibleAnnotations) {
			if (typeof(a)=='object') {
				a = this.visibleAnnotations[key];
				if (a && (a.s>=params.currentTime || a.e<=params.currentTime)) {
					this.removeAnnotation(a);
				}
			}
		}
	},

	showAnnotation:function(annotation) {
		if (!this.visibleAnnotations[annotation.s]) {
			var rect = {left:100,top:10,width:1080,height:20};
			annotation.elem = paella.player.videoContainer.overlayContainer.addText(annotation.content,rect);
			annotation.elem.className = 'textAnnotation';
			this.visibleAnnotations[annotation.s] = annotation;
		}
	},

	removeAnnotation:function(annotation) {
		if (this.visibleAnnotations[annotation.s]) {
			var elem = this.visibleAnnotations[annotation.s].elem;
			paella.player.videoContainer.overlayContainer.removeElement(elem);
			this.visibleAnnotations[annotation.s] = null;
		}
	}
});

paella.plugins.annotationsPlayerlugin = new paella.plugins.AnnotationsPlayerPlugin();

/*** File: plugins/es.upv.paella.blackBoardPlugin/blackBoard.js ***/
Class ("paella.BlackBoard2", paella.EventDrivenPlugin,{
	_blackBoardProfile:"s_p_blackboard2",
	_blackBoardDIV:null,
	_hasImages:null,
	_active:false,
	_creationTimer:500,
	_zImages:null,
	_videoLength:null,
	_keys:null,
	_actualImage:null,
	_next:null,
	_ant:null,
	_lensDIV:null,
	_lensContainer:null,
	_lensWidth:null,
	_lensHeight:null,
	_conImg:null,
	_zoom:250,
	_currentZoom:null,
	_maxZoom:500,
	_mousePos:null,
	_containerRect:null,

	getName:function() { 
		return "es.upv.paella.blackBoardPlugin";
	},

	getIndex:function() {return 10;},

	getAlignment:function(){
		return 'right';
	},
	getSubclass:function() { return "blackBoardButton2"; },
	getDefaultToolTip:function() { return base.dictionary.translate("BlackBoard");},

	checkEnabled:function(onSuccess) {		
			onSuccess(true);
	},

	getEvents:function() {
		return[
			paella.events.setProfile,
			paella.events.timeUpdate
		];
    },

    onEvent:function(event, params){
    	var self = this;
    	switch(event){
    		case paella.events.setProfile:
				if(params.profileName!=self._blackBoardProfile){
					if(self._active){
						self.destroyOverlay();
						self._active = false;
					}
					break;
				}
				else{ 
				
					if(!self._hasImages){
						paella.player.setProfile("slide_professor");
					}
					if(self._hasImages && !self._active){
						self.createOverlay();
						self._active = true;
					}
				}
				break;
    		case paella.events.timeUpdate:
    			if(self._active && self._hasImages) {
	    			self.imageUpdate(event,params);
	    		}
	    		break;
    	}
    },

	setup:function() {
		var self = this;	

		var n = paella.player.videoContainer.sourceData[0].sources;
		if(n.hasOwnProperty("image")){
			self._hasImages = true;
			//  BRING THE IMAGE ARRAY TO LOCAL
			self._zImages = {};
			self._zImages = paella.player.videoContainer.sourceData[0].sources.image[0].frames; // COPY TO LOCAL
			self._videoLength = paella.player.videoContainer.sourceData[0].sources.image[0].duration; // video duration in frames

			// SORT KEYS FOR SEARCH CLOSEST
			self._keys = Object.keys(self._zImages);
			self._keys = self._keys.sort(function(a, b){
				a = a.slice(6);
				b = b.slice(6);
				return parseInt(a)-parseInt(b); 
			});
		}
		else{
			self._hasImages = false;

			if (paella.player.selectedProfile == self._blackBoardProfile) {
				defaultprofile = paella.player.config.defaultProfile;
				paella.player.setProfile(defaultprofile);
			}
		}


		//NEXT
		this._next = 0;
		this._ant = 0;

		if(paella.player.selectedProfile == self._blackBoardProfile){
			self.createOverlay();
			self._active = true;
		}

		self._mousePos = {};


		paella.Profiles.loadProfile(self._blackBoardProfile,function(profileData) {
			self._containerRect = profileData.blackBoardImages;
		});
	},

	createLens:function(){
		var self = this;
			if(self._currentZoom == null) { self._currentZoom = self._zoom; }
			var lens = document.createElement("div");
			lens.className = "lensClass";

			self._lensDIV = lens;

			var p = $('.conImg').offset();
			var width = $('.conImg').width();
			var height = $('.conImg').height();
			lens.style.width = (width/(self._currentZoom/100))+"px";
			lens.style.height = (height/(self._currentZoom/100))+"px";
			self._lensWidth = parseInt(lens.style.width);
			self._lensHeight = parseInt(lens.style.height);
			$(self._lensContainer).append(lens);
			
			$(self._lensContainer).mousemove(function(event) {	
				mouseX = (event.pageX-p.left);
				mouseY = (event.pageY-p.top);
				
				self._mousePos.x = mouseX;
				self._mousePos.y = mouseY;

				lensTop = (mouseY - self._lensHeight/2);
				lensTop = (lensTop < 0) ? 0 : lensTop;
				lensTop = (lensTop > (height-self._lensHeight)) ? (height-self._lensHeight) : lensTop; 

				lensLeft = (mouseX - self._lensWidth/2);
				lensLeft = (lensLeft < 0) ? 0 : lensLeft;
				lensLeft = (lensLeft > (width-self._lensWidth)) ? (width-self._lensWidth) : lensLeft; 

				self._lensDIV.style.left = lensLeft + "px";
				self._lensDIV.style.top = lensTop + "px";
				if(self._currentZoom != 100){
	        		x = (lensLeft) * 100 / (width-self._lensWidth);
	        		y = (lensTop) * 100 / (height-self._lensHeight);
	        		self._blackBoardDIV.style.backgroundPosition = x.toString() + '% ' + y.toString() + '%';
	        	}
	        		
	        	else if(self._currentZoom == 100){
	        			var xRelative = mouseX * 100 / width;
	        			var yRelative = mouseY * 100 / height;
	        			self._blackBoardDIV.style.backgroundPosition = xRelative.toString() + '% ' + yRelative.toString() + '%';
	        		}

	        	self._blackBoardDIV.style.backgroundSize = self._currentZoom+'%';
	        });

    		$(self._lensContainer).bind('wheel mousewheel', function(e){
	        var delta;

	        if (e.originalEvent.wheelDelta !== undefined)
	            delta = e.originalEvent.wheelDelta;
	        else
	            delta = e.originalEvent.deltaY * -1;

	            if(delta > 0 && self._currentZoom<self._maxZoom) {
	            	self.reBuildLens(10);
	            }
	            else if(self._currentZoom>100){
	                self.reBuildLens(-10);
	            }
	            else if(self._currentZoom==100){
	            	self._lensDIV.style.left = 0+"px";
	            	self._lensDIV.style.top = 0+"px";
	            }
	            self._blackBoardDIV.style.backgroundSize = (self._currentZoom)+"%";
        	});
		
	},

	reBuildLens:function(zoomValue){
		var self = this;
			self._currentZoom += zoomValue;
			var p = $('.conImg').offset();
			var width = $('.conImg').width();
			var height = $('.conImg').height();
			self._lensDIV.style.width = (width/(self._currentZoom/100))+"px";
			self._lensDIV.style.height = (height/(self._currentZoom/100))+"px";
			self._lensWidth = parseInt(self._lensDIV.style.width);
			self._lensHeight = parseInt(self._lensDIV.style.height);
			
			if(self._currentZoom != 100){
				var mouseX = self._mousePos.x;
				var mouseY = self._mousePos.y;

				lensTop = (mouseY - self._lensHeight/2);
				lensTop = (lensTop < 0) ? 0 : lensTop;
				lensTop = (lensTop > (height-self._lensHeight)) ? (height-self._lensHeight) : lensTop; 

				lensLeft = (mouseX - self._lensWidth/2);
				lensLeft = (lensLeft < 0) ? 0 : lensLeft;
				lensLeft = (lensLeft > (width-self._lensWidth)) ? (width-self._lensWidth) : lensLeft; 

				self._lensDIV.style.left = lensLeft + "px";
				self._lensDIV.style.top = lensTop + "px";

				x = (lensLeft) * 100 / (width-self._lensWidth);
	        	y = (lensTop) * 100 / (height-self._lensHeight);
	        	self._blackBoardDIV.style.backgroundPosition = x.toString() + '% ' + y.toString() + '%';
			}
	},

	destroyLens:function(){
		var self=this;
		if(self._lensDIV){
			$(self._lensDIV).remove();
			self._blackBoardDIV.style.backgroundSize = 100+'%';
			self._blackBoardDIV.style.opacity = 0;
		}
		//self._currentZoom = self._zoom;
	},

	createOverlay:function(){
		var self = this;

		var blackBoardDiv = document.createElement("div");
		blackBoardDiv.className = "blackBoardDiv";
		self._blackBoardDIV = blackBoardDiv;
		self._blackBoardDIV.style.opacity = 0;

		var lensContainer = document.createElement("div");
		lensContainer.className = "lensContainer";
		self._lensContainer = lensContainer;

		var conImg = document.createElement("img");
		conImg.className = "conImg";
		self._conImg = conImg;

		if(self._actualImage){
			self._conImg.src = self._actualImage;
			$(self._blackBoardDIV).css('background-image', 'url(' + self._actualImage + ')');
		}

		$(lensContainer).append(conImg);

		$(self._lensContainer).mouseenter(function(){self.createLens(); self._blackBoardDIV.style.opacity = 1.0;});
		$(self._lensContainer).mouseleave(function(){self.destroyLens();});

		setTimeout(function(){ // TIMER FOR NICE VIEW
			overlayContainer = paella.player.videoContainer.overlayContainer;
			overlayContainer.addElement(blackBoardDiv, overlayContainer.getMasterRect());
			overlayContainer.addElement(lensContainer, self._containerRect);
		}, self._creationTimer);
	},

	destroyOverlay:function(){
		var self = this;

		if(self._blackBoardDIV){
			$(self._blackBoardDIV).remove();
		}
		if(self._lensContainer){
			$(self._lensContainer).remove();
		}
	},

	imageUpdate:function(event,params) {

			var self = this;
			var sec = Math.round(params.currentTime);
			var src = $(self._blackBoardDIV).css('background-image');

			if($(self._blackBoardDIV).length>0){

				if(self._zImages.hasOwnProperty("frame_"+sec)) { // SWAP IMAGES WHEN PLAYING
					if(src == self._zImages["frame_"+sec]) return;
					else src = self._zImages["frame_"+sec]; 
					}

				else if(sec > self._next || sec < self._ant) {
					src = self.returnSrc(sec); 
					} // RELOAD IF OUT OF INTERVAL
					else return;

					//PRELOAD NEXT IMAGE
					var image = new Image();
					image.onload = function(){
	    			$(self._blackBoardDIV).css('background-image', 'url(' + src + ')'); // UPDATING IMAGE
					};
					image.src = src;

					self._actualImage = src;
					self._conImg.src = self._actualImage;
			}
		
	},
	returnSrc:function(sec){
		var self = this;
		var ant = 0;
		for (i=0; i<self._keys.length; i++){
			var id = parseInt(self._keys[i].slice(6));
			var lastId = parseInt(self._keys[(self._keys.length-1)].slice(6));
			if(sec < id) {  // PREVIOUS IMAGE
				self._next = id; 
				self._ant = ant; 
				self._imageNumber = i-1;
				return self._zImages["frame_"+ant];} // return previous and keep next change
			else if(sec > lastId && sec < self._videoLength){ // LAST INTERVAL
					self._next = self._videoLength;
					self._ant = lastId;
					return self._zImages["frame_"+ant]; 
			}
			else ant = id;
		}
	}
});

paella.plugins.blackBoard2 = new paella.BlackBoard2();

/*** File: plugins/es.upv.paella.breakPlugins/editor.js ***/
Class ("paella.plugins.BreaksEditorPlugin",paella.editor.MainTrackPlugin, {
	tracks:null,
	selectedTrackItem:null,

	checkEnabled:function(onSuccess) {
		var This = this;
		this.tracks = [];
		this.tracksData = [];
		paella.data.read('breaks',{id:paella.initDelegate.getId()},function(data,status) {
			if (data && typeof(data)=='object' && data.breaks && data.breaks.length>0) {
				This.tracks = data.breaks;
			}
			//Copy this.tracks on this.tracksData as backup.
			This.tracksData = JSON.parse(JSON.stringify(This.tracks));
			onSuccess(true);
		});
	},

	setup:function() {
		if (base.dictionary.currentLanguage()=="es") {
			var esDict = {
				'Breaks':'Descansos',
				'Break':'Descanso',
				'Create a new break in the current position': 'Añade un descanso en el instante actual',
				'Delete selected break': 'Borra el descanso seleccionado'
			};
			base.dictionary.addDictionary(esDict);
		}
	},

	getTrackItems:function() {
		return this.tracks;
	},

	getTools:function() {
		return [
			{name:'create',label:base.dictionary.translate('Create'),hint:base.dictionary.translate('Create a new break in the current position')},
			{name:'delete',label:base.dictionary.translate('Delete'),hint:base.dictionary.translate('Delete selected break')}
		];
	},

	onToolSelected:function(toolName) {
		if (this.selectedTrackItem && toolName=='delete' && this.selectedTrackItem) {
			paella.events.trigger(paella.events.documentChanged);
			this.tracks.splice(this.tracks.indexOf(this.selectedTrackItem),1);
			return true;
		}
		else if (toolName=='create') {
			paella.events.trigger(paella.events.documentChanged);
			var start = paella.player.videoContainer.currentTime();
			var end = start + 30;
			var id = this.getTrackUniqueId();
			var content = base.dictionary.translate('Break');
			this.tracks.push({id:id,s:start,e:end,content:content,name:content});
			return true;
		}
	},

	getTrackUniqueId:function() {
		var newId = -1;
		if (this.tracks.length==0) return 1;
		for (var i=0;i<this.tracks.length;++i) {
			if (newId<=this.tracks[i].id) {
				newId = this.tracks[i].id + 1;
			}
		}
		return newId;
	},

	getName:function() {
		return "es.upv.paella.editor.trackBreaksPlugin";
	},

	getTrackName:function() {
		return base.dictionary.translate("Breaks");
	},

	getColor:function() {
		return 'rgb(219, 81, 81)';
	},

	getTextColor:function() {
		return 'rgb(90,90,90)';
	},

	onTrackChanged:function(id,start,end) {
		paella.events.trigger(paella.events.documentChanged);
		var item = this.getTrackItem(id);
		if (item) {
			item.s = start;
			item.e = end;
			this.selectedTrackItem = item;
		}
	},

	onTrackContentChanged:function(id,content) {
		paella.events.trigger(paella.events.documentChanged);
		var item = this.getTrackItem(id);
		if (item) {
			item.content = paella.AntiXSS.htmlEscape(content);
			item.name = paella.AntiXSS.htmlEscape(content);
		}
	},

	allowEditContent:function() {
		return true;
	},

	getTrackItem:function(id) {
		for (var i=0;i<this.tracks.length;++i) {
			if (this.tracks[i].id==id) return this.tracks[i];
		}
	},

	contextHelpString:function() {
		if (base.dictionary.currentLanguage()=="es") {
			return "Utiliza esta herramienta para crear, borrar y editar descansos. Para crear un descanso, selecciona el instante de tiempo haciendo clic en el fondo de la línea de tiempo, y pulsa el botón 'Crear'. Utiliza esta pestaña para editar el texto de los descansos";
		}
		else {
			return "Use this tool to create, delete and edit breaks. To create a break, select the time instant clicking the timeline's background and press 'create' button. Use this tab to edit the break text.";
		}
	},

	onSave:function(success) {
		var data = {
			breaks:this.tracks
		};
		paella.data.write('breaks',{id:paella.initDelegate.getId()},data,function(response,status) {
			paella.plugins.breaksPlayerPlugin.breaks = data.breaks;
			success(status);
		});
		//Update this.tracksData backup tracks
		this.tracksData = JSON.parse(JSON.stringify(this.tracks));

	},

	onDiscard:function(success) {
		//Override discarded changes using this.tracksData backup
		this.tracks = JSON.parse(JSON.stringify(this.tracksData));
		success(true);
	}
});

paella.plugins.breaksEditorPlugin = new paella.plugins.BreaksEditorPlugin();

/*** File: plugins/es.upv.paella.breakPlugins/player.js ***/
Class ("paella.plugins.BreaksPlayerPlugin",paella.EventDrivenPlugin,{
	breaks:null,
	lastEvent:0,
	visibleBreaks:null,

	getName:function() { return "es.upv.paella.breaksPlayerPlugin"; },
	checkEnabled:function(onSuccess) {
		var This = this;
		this.breaks = [];
		this.visibleBreaks = [];
		paella.data.read('breaks',{id:paella.initDelegate.getId()},function(data,status) {
			if (data && typeof(data)=='object' && data.breaks && data.breaks.length>0) {
				This.breaks = data.breaks;
			}
			onSuccess(true);
		});
	},

	getEvents:function() { return [paella.events.timeUpdate]; },

	onEvent:function(eventType,params) {
		this.checkBreaks(params);
	},

	checkBreaks:function(params) {
		var a;
		for (var i=0; i<this.breaks.length; ++i) {
			a = this.breaks[i];

			if (a.s<params.currentTime && a.e>params.currentTime) {
                            if(this.areBreaksClickable())
                                this.avoidBreak(a);
                            else
                                this.showBreaks(a);
			} else if (a.s.toFixed(0) == params.currentTime.toFixed(0)){
				this.avoidBreak(a);
			}
		}
		if(!this.areBreaksClickable()) {
			for (var key in this.visibleBreaks) {
				if (typeof(a)=='object') {
					a = this.visibleBreaks[key];
					if (a && (a.s>=params.currentTime || a.e<=params.currentTime)) {
						this.removeBreak(a);
					}
				}
			}
		}
	},
	areBreaksClickable:function() {
            //Returns true if the config value is set and if we are not on the editor.
	    return this.config.neverShow && !(paella.editor.instance && paella.editor.instance.isLoaded);
	},
	showBreaks:function(br) {
		if (!this.visibleBreaks[br.s]) {
			var rect = {left:100,top:350,width:1080,height:20};
			br.elem = paella.player.videoContainer.overlayContainer.addText(br.content,rect);
			br.elem.className = 'textBreak';
			this.visibleBreaks[br.s] = br;
		}
	},

	removeBreak:function(br) {
		if (this.visibleBreaks[br.s]) {
			var elem = this.visibleBreaks[br.s].elem;
			paella.player.videoContainer.overlayContainer.removeElement(elem);
			this.visibleBreaks[br.s] = null;
		}
	},

	avoidBreak:function(br){
		var newTime = br.e + (this.config.neverShow?0.01:0);
		paella.player.videoContainer.seekToTime(newTime);
	}
});

paella.plugins.breaksPlayerPlugin = new paella.plugins.BreaksPlayerPlugin();

/*** File: plugins/es.upv.paella.captions.DFXPParserPlugin/dfxp_parser.js ***/
(function(){
	
/////////////////////////////////////////////////
// DFXP Parser
/////////////////////////////////////////////////
Class ("paella.captions.parsers.DFXPParserPlugin", paella.CaptionParserPlugIn, {
	ext: ["dfxp"],
	getName: function() { return "es.upv.paella.captions.DFXPParserPlugin"; },
	parse: function(content, lang, next) {
		var captions = [];
		var self = this;
		var xml = $(content);
		var g_lang = xml.attr("xml:lang");
		
		var lls = xml.find("div");
		for(var idx=0; idx<lls.length; ++idx) {
			var ll = $(lls[idx]);
			var l_lang = ll.attr("xml:lang");
			if ((l_lang == undefined) || (l_lang == "")){
				if ((g_lang == undefined) || (g_lang == "")) {
					base.log.debug("No xml:lang found! Using '" + lang + "' lang instead.");
					l_lang = lang;
				}
				else {
					l_lang = g_lang;
				}
			}
			//
			if (l_lang == lang) {
				ll.find("p").each(function(i, cap){
					var c = {
						id: i,
		            	begin: self.parseTimeTextToSeg(cap.getAttribute("begin")),
		            	end: self.parseTimeTextToSeg(cap.getAttribute("end")),
		            	content: $(cap).text().trim()
		            };				
					captions.push(c);				
				});
				break;
			}
		}
		
		if (captions.length > 0) {
			next(false, captions);
		}
		else {
			next(true);
		}
	},

    parseTimeTextToSeg:function(ttime){
            var nseg = 0;
            var segtime = /^([0-9]*([.,][0-9]*)?)s/.test(ttime);
            if (segtime){
                    nseg = parseFloat(RegExp.$1);
            }
            else {
                    var split = ttime.split(":");
                    var h = parseInt(split[0]);
                    var m = parseInt(split[1]);
                    var s = parseInt(split[2]);
                    nseg = s+(m*60)+(h*60*60);
            }
            return nseg;
    }
});


new paella.captions.parsers.DFXPParserPlugin();


}());
/*** File: plugins/es.upv.paella.captionsPlugin/captionsPlugin.js ***/
Class ("paella.plugins.CaptionsPlugin", paella.ButtonPlugin,{
	_searchTimerTime:1500,
	_searchTimer:null,
	_pluginButton:null,
	_open:0, // 0 closed, 1 st click
	_parent:null,
	_body:null,
	_inner:null,
	_bar:null,
	_input:null,
	_select:null,
	_editor:null,
	_activeCaptions:null,
	_lastSel:null,
	_browserLang:null,
	_defaultBodyHeight:280,
	_autoScroll:true,
	_searchOnCaptions:null,

	getAlignment:function() { return 'right'; },
	getSubclass:function() { return 'captionsPluginButton'; },
	getName:function() { return "es.upv.paella.captionsPlugin"; },
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },	
	getDefaultToolTip:function() { return base.dictionary.translate("Subtitles"); },
	getIndex:function() {return 509;},

	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	showUI: function(){
		if(!paella.captions.getAvailableLangs().length || paella.captions.getAvailableLangs().length < 1){
			this.parent();
		}
	},

	setup:function() {
		var self = this;

		// HIDE UI IF NO Captions
		if(!paella.captions.getAvailableLangs().length){
			paella.plugins.captionsPlugin.hideUI();
		}

		//BINDS
		paella.events.bind(paella.events.captionsEnabled,function(event,params){
			self.onChangeSelection(params);
		});

		paella.events.bind(paella.events.captionsDisabled,function(event,params){
			self.onChangeSelection(params);
		});

		paella.events.bind(paella.events.captionAdded,function(event,params){
			self.onCaptionAdded(params);
			paella.plugins.captionsPlugin.showUI();
		});

		paella.events.bind(paella.events.timeUpdate, function(event,params){
			if(self._searchOnCaptions){
				self.updateCaptionHiglighted(params);				
			}

		});

		paella.events.bind(paella.events.controlBarWillHide, function(evt) {
			self.cancelHideBar();
		});

		self._activeCaptions = paella.captions.getActiveCaptions();

		self._searchOnCaptions = self.config.searchOnCaptions || false;
	},

	cancelHideBar:function(){
		var thisClass = this;
		if(thisClass._open > 0){
			paella.player.controls.cancelHideBar();
		}
	},

	updateCaptionHiglighted:function(time){
		var thisClass = this;
		var sel = null;
		var id = null;
		if(time){
			id = thisClass.searchIntervaltoHighlight(time);

			if(id != null){
				sel = $( ".bodyInnerContainer[sec-id='"+id+"']" );

				if(sel != thisClass._lasSel){
					$(thisClass._lasSel).removeClass("Highlight");
				}

				if(sel){
					$(sel).addClass("Highlight");
					if(thisClass._autoScroll){
						thisClass.updateScrollFocus(id);
					}
					thisClass._lasSel = sel;
				}
			}
		}
		

	},

	searchIntervaltoHighlight:function(time){
		var thisClass = this;
		var resul = null;

		if(paella.captions.getActiveCaptions()){
			n = paella.captions.getActiveCaptions()._captions;
			n.forEach(function(l){
				if(l.begin < time.currentTime && time.currentTime < l.end) thisClass.resul = l.id;
			});
		}
		if(thisClass.resul != null) return thisClass.resul;
		else return null;
	},

	updateScrollFocus:function(id){
		var thisClass = this;
		var resul = 0;
		var t = $(".bodyInnerContainer").slice(0,id);
		t = t.toArray();

		t.forEach(function(l){
			var i = $(l).outerHeight(true);
			resul += i;
		});

		var x = parseInt(resul / 280);
		$(".captionsBody").scrollTop( x*thisClass._defaultBodyHeight );
	},

	onCaptionAdded:function(obj){
		var thisClass = this;

		var newCap = paella.captions.getCaptions(obj);

		var defOption = document.createElement("option"); // NO ONE SELECT
        defOption.text = newCap._lang.txt;
        defOption.value = obj;

        thisClass._select.add(defOption);
	},

	changeSelection:function(){
		var thisClass = this;

		var sel = $(thisClass._select).val();
       	if(sel == ""){ 
       		$(thisClass._body).empty();
       		paella.captions.setActiveCaptions(sel);
       		return;
       	} // BREAK IF NO ONE SELECTED
		paella.captions.setActiveCaptions(sel);
		thisClass._activeCaptions = sel;
		if(thisClass._searchOnCaptions){
			thisClass.buildBodyContent(paella.captions.getActiveCaptions()._captions,"list");	
		}
		thisClass.setButtonHideShow();
	},
	
	onChangeSelection:function(obj){
		var thisClass = this;

		if(thisClass._activeCaptions != obj){
			$(thisClass._body).empty();
			if(obj==undefined){
				thisClass._select.value = "";
				$(thisClass._input).prop('disabled', true);
			}
			else{
				$(thisClass._input).prop('disabled', false);
				thisClass._select.value = obj;
				if(thisClass._searchOnCaptions){
					thisClass.buildBodyContent(paella.captions.getActiveCaptions()._captions,"list");
				}
			}
			thisClass._activeCaptions = obj;
			thisClass.setButtonHideShow();
		}
	},

	action:function(){
		var self = this;
		self._browserLang = base.dictionary.currentLanguage();
		self._autoScroll = true;

		switch(self._open){
			case 0:
				if(self._browserLang && paella.captions.getActiveCaptions()==undefined){
					self.selectDefaultBrowserLang(self._browserLang);
				}
				self._open = 1;
				paella.keyManager.enabled = false;
				break;
		
			case 1: 
				paella.keyManager.enabled = true;
				self._open = 0;
				break;
		}

	},

	buildContent:function(domElement) {
		var thisClass = this;

		//captions CONTAINER
		thisClass._parent = document.createElement('div');
        thisClass._parent.className = 'captionsPluginContainer';  
	    //captions BAR
	   	thisClass._bar = document.createElement('div');
        thisClass._bar.className = 'captionsBar';
        //captions BODY
        if(thisClass._searchOnCaptions){
	        thisClass._body = document.createElement('div');
	        thisClass._body.className = 'captionsBody';
	        thisClass._parent.appendChild(thisClass._body);
	         //BODY JQUERY
	        $(thisClass._body).scroll(function(){
	        	thisClass._autoScroll = false;
	        });

	        //INPUT
	        thisClass._input = document.createElement("input");
	        thisClass._input.className = "captionsBarInput";
	        thisClass._input.type = "text";
	        thisClass._input.id ="captionsBarInput";
	        thisClass._input.name = "captionsString";
	        thisClass._input.placeholder = base.dictionary.translate("Search captions");
	        thisClass._bar.appendChild(thisClass._input);

	        //INPUT jQuery
	         $(thisClass._input).change(function(){
	        	var text = $(thisClass._input).val();
	        	thisClass.doSearch(text);
			});

			$(thisClass._input).keyup(function(){
				var text = $(thisClass._input).val();
				if(thisClass._searchTimer != null){
					thisClass._searchTimer.cancel();
				}
				thisClass._searchTimer = new base.Timer(function(timer) {
					thisClass.doSearch(text);
				}, thisClass._searchTimerTime);			
			});
	    }

	        

        //SELECT
        thisClass._select = document.createElement("select");
        thisClass._select.className = "captionsSelector";
        
        var defOption = document.createElement("option"); // NO ONE SELECT
        defOption.text = base.dictionary.translate("None");
        defOption.value = "";
        thisClass._select.add(defOption);

        paella.captions.getAvailableLangs().forEach(function(l){
        	var option = document.createElement("option");
        	option.text = l.lang.txt;
        	option.value = l.id;
        	thisClass._select.add(option);
        });

         thisClass._bar.appendChild(thisClass._select);
         thisClass._parent.appendChild( thisClass._bar);

        //jQuery SELECT
        $(thisClass._select).change(function(){
	       thisClass.changeSelection();
        });

        //BUTTON EDITOR
        thisClass._editor = document.createElement("button");
        thisClass._editor.className = "editorButton";
        thisClass._editor.innerHTML = "";
        thisClass._bar.appendChild(thisClass._editor);

        //BUTTON jQuery
        $(thisClass._editor).prop("disabled",true);
        $(thisClass._editor).click(function(){
        	var c = paella.captions.getActiveCaptions();        	
	        paella.userTracking.log("paella:caption:edit", {id: c._captionsProvider + ':' + c._id, lang: c._lang});
        	c.goToEdit();
        });

        domElement.appendChild(thisClass._parent);
    },

    selectDefaultBrowserLang:function(code){
    	var thisClass = this;
		var provider = null;
		paella.captions.getAvailableLangs().forEach(function(l){
			if(l.lang.code == code){ provider = l.id; }
		});
		
		if(provider){
			paella.captions.setActiveCaptions(provider);
		}
		/*
		else{
			$(thisClass._input).prop("disabled",true);
		}
		*/

    },

    doSearch:function(text){
    	thisClass = this;
		var c = paella.captions.getActiveCaptions();
		if(c){
			if(text==""){thisClass.buildBodyContent(paella.captions.getActiveCaptions()._captions,"list");}
			else{
				c.search(text,function(err,resul){
					if(!err){
						thisClass.buildBodyContent(resul,"search");
					}
				});
			}
		}
    },

    setButtonHideShow:function(){
    	var thisClass = this;
    	var editor = $('.editorButton');
		var c = paella.captions.getActiveCaptions();
		var res = null;
	   	if(c!=null){
	   		$(thisClass._select).width('39%');
		    
		    c.canEdit(function(err, r){res=r;});
	        if(res){
	        	$(editor).prop("disabled",false);
	        	$(editor).show();
	        }
	        else{
	        	$(editor).prop("disabled",true);
	        	$(editor).hide();
	        	$(thisClass._select).width('47%');
	        }
    	}
    	else {
    		$(editor).prop("disabled",true);
    		$(editor).hide();
    		$(thisClass._select).width('47%');
    	}

    	if(!thisClass._searchOnCaptions){
    		if(res){$(thisClass._select).width('92%');}
    		else{$(thisClass._select).width('100%');}
     	}
    },

    buildBodyContent:function(obj,type){
    	var thisClass = this;
    	$(thisClass._body).empty();
    	obj.forEach(function(l){
    		thisClass._inner = document.createElement('div');
        	thisClass._inner.className = 'bodyInnerContainer';
        	thisClass._inner.innerHTML = l.content;
        	if(type=="list"){
        		thisClass._inner.setAttribute('sec-begin',l.begin);
        		thisClass._inner.setAttribute('sec-end',l.end);
        		thisClass._inner.setAttribute('sec-id',l.id);
        		thisClass._autoScroll = true;
        	}
        	if(type=="search"){
        		thisClass._inner.setAttribute('sec-begin',l.time);
        	}
        	thisClass._body.appendChild(thisClass._inner);

        	//JQUERY
        	$(thisClass._inner).hover(
        		function(){ 
        			$(this).css('background-color','rgba(250, 161, 102, 0.5)');	           		
        		},
        		function(){ 
        			$(this).removeAttr('style');
        		}
	        );
	        $(thisClass._inner).click(function(){ 
	        		var secBegin = $(this).attr("sec-begin");
	        		paella.player.videoContainer.seekToTime(parseInt(secBegin));
	        });
    	});
    }
});

paella.plugins.captionsPlugin = new paella.plugins.CaptionsPlugin();
/*** File: plugins/es.upv.paella.captionsPlugin/overlayCaptionsPlugin.js ***/
Class ("paella.plugins.CaptionsOnScreen",paella.EventDrivenPlugin,{
	containerId:'paella_plugin_CaptionsOnScreen',
	container:null,
	innerContainer:null,
	top:null,
	actualPos:null,
	lastEvent:null,
	controlsPlayback:null,
	captions:false,
	captionProvider:null,

	checkEnabled:function(onSuccess) {
		onSuccess(!paella.player.isLiveStream());
	},

	setup:function() {

	
	},

	getEvents:function() {
		return [paella.events.controlBarDidHide, paella.events.resize, paella.events.controlBarDidShow, paella.events.captionsEnabled, paella.events.captionsDisabled ,paella.events.timeUpdate];
	},

	onEvent:function(eventType,params) {
		var thisClass = this;


		switch (eventType) {
			case paella.events.controlBarDidHide:
				if(thisClass.lastEvent == eventType || thisClass.captions==false)break;
				thisClass.moveCaptionsOverlay("down");
				break;
			case paella.events.resize:
				if(thisClass.captions==false)break;
				if(paella.player.controls.isHidden()){
					thisClass.moveCaptionsOverlay("down");
				}
				else {
					thisClass.moveCaptionsOverlay("top");
				}
				break;

			case paella.events.controlBarDidShow:
				if(thisClass.lastEvent == eventType || thisClass.captions==false)break;
				thisClass.moveCaptionsOverlay("top");
				break;
			case paella.events.captionsEnabled:
				thisClass.buildContent(params);
				thisClass.captions = true;
				if(paella.player.controls.isHidden()){
					thisClass.moveCaptionsOverlay("down");
				}
				else {
					thisClass.moveCaptionsOverlay("top");
				}
				break;
			case paella.events.captionsDisabled:
				thisClass.hideContent();
				thisClass.captions = false;
				break;
			case paella.events.timeUpdate:
				if(thisClass.captions){ thisClass.updateCaptions(params); }
				break;

		}
		thisClass.lastEvent = eventType; 
	},

	buildContent:function(provider){
		var thisClass = this;
		thisClass.captionProvider = provider;

		if(thisClass.container==null){ // PARENT
			thisClass.container = document.createElement('div');
			thisClass.container.className = "CaptionsOnScreen";
			thisClass.container.id = thisClass.containerId;

			thisClass.innerContainer = document.createElement('div');
			thisClass.innerContainer.className = "CaptionsOnScreenInner";

			thisClass.container.appendChild(thisClass.innerContainer);			

			if(thisClass.controlsPlayback==null) thisClass.controlsPlayback = $('#playerContainer_controls_playback');


			paella.player.videoContainer.domElement.appendChild(thisClass.container);
		}
		else {
			$(thisClass.container).show();
		}

	},

	updateCaptions:function(time){
		var thisClass = this;

		if(thisClass.captions){
			var c = paella.captions.getActiveCaptions();
			var caption = c.getCaptionAtTime(time.currentTime);
			if(caption){
				$(thisClass.container).show();
				thisClass.innerContainer.innerHTML = caption.content;
			}
			else { 
				thisClass.innerContainer.innerHTML = ""; 
			}
		}
	},
	
	hideContent:function(){
		var thisClass = this;

		$(thisClass.container).hide();
	},
 
	moveCaptionsOverlay:function(pos){
		var thisClass = this;

		if(thisClass.controlsPlayback==null) thisClass.controlsPlayback = $('#playerContainer_controls_playback');
		
		if(pos=="down"){
			var t = thisClass.controlsPlayback.offset().top;
			thisClass.innerContainer.style.bottom = (-thisClass.container.offsetHeight+50)+"px";
		}
		if(pos=="top") {
			var t2 = thisClass.controlsPlayback.offset().top;
			t2 -= thisClass.innerContainer.offsetHeight+10;
			thisClass.innerContainer.style.bottom = (0-t2)+"px";
		}
	},

	getIndex:function() {
		return 1050;
	},

	getName:function() {
		return "es.upv.paella.overlayCaptionsPlugin";
	}
});

new paella.plugins.CaptionsOnScreen();
/*** File: plugins/es.upv.paella.commentsPlugin/comments.js ***/
Class ("paella.plugins.CommentsPlugin",paella.TabBarPlugin,{
	divPublishComment:null,
	divComments:null,
	publishCommentTextArea:null,
	publishCommentButtons:null,
	canPublishAComment: false,
	comments: [],
	commentsTree: [],
	domElement:null,
  
	getSubclass:function() { return "showCommentsTabBar"; },
	getName:function() { return "es.upv.paella.commentsPlugin"; },
	getTabName:function() { return base.dictionary.translate("Comments"); },
	checkEnabled:function(onSuccess) { onSuccess(true); },
	getIndex:function() { return 40; },
	getDefaultToolTip:function() { return base.dictionary.translate("Comments"); },	
				     
	action:function(tab) {
		this.loadContent();
	},
			
	buildContent:function(domElement) {
		this.domElement = domElement;
		this.canPublishAComment = paella.initDelegate.initParams.accessControl.permissions.canWrite;
		this.loadContent();
	},
				
	loadContent:function() {
		this.divRoot = this.domElement;
		this.divRoot.innerHTML ="";
		
		this.divPublishComment = document.createElement('div');
		this.divPublishComment.className = 'CommentPlugin_Publish';
		this.divPublishComment.id = 'CommentPlugin_Publish';

		this.divComments = document.createElement('div'); 
		this.divComments.className = 'CommentPlugin_Comments';
		this.divComments.id = 'CommentPlugin_Comments';

		if(this.canPublishAComment){
			this.divRoot.appendChild(this.divPublishComment);
			this.createPublishComment();
		}
		this.divRoot.appendChild(this.divComments);
		
		this.reloadComments();
	},
	
	//Allows the user to write a new comment
	createPublishComment:function() {
		var thisClass = this;
		var rootID = this.divPublishComment.id+"_entry";
		
		var divEntry;
		divEntry = document.createElement('div');
		divEntry.id = rootID;
		divEntry.className = 'comments_entry';
		
		var divSil;
		divSil = document.createElement('img');
		divSil.className = "comments_entry_silhouette";
		divSil.style.width = "48px";
		divSil.src = paella.initDelegate.initParams.accessControl.userData.avatar;
		divSil.id = rootID+"_silhouette";
		divEntry.appendChild(divSil);
		
		var divTextAreaContainer;
		divTextAreaContainer = document.createElement('div');
		divTextAreaContainer.className = "comments_entry_container";
		divTextAreaContainer.id = rootID+"_textarea_container";
		divEntry.appendChild(divTextAreaContainer);
		
		this.publishCommentTextArea = document.createElement('textarea');
		this.publishCommentTextArea.id = rootID+"_textarea";
		this.publishCommentTextArea.onclick = function(){paella.keyManager.enabled = false;};
		this.publishCommentTextArea.onblur = function(){paella.keyManager.enabled = true;};
		divTextAreaContainer.appendChild(this.publishCommentTextArea);
		
		this.publishCommentButtons = document.createElement('div');
		this.publishCommentButtons.id = rootID+"_buttons_area";
		divTextAreaContainer.appendChild(this.publishCommentButtons);
		
		var btnAddComment;
		btnAddComment = document.createElement('button');
		btnAddComment.id = rootID+"_btnAddComment";
		btnAddComment.className = "publish";
		btnAddComment.onclick = function(){
			var txtValue = thisClass.publishCommentTextArea.value;
			if (txtValue.replace(/\s/g,'') != "") {
				thisClass.addComment();
			}
		};
		btnAddComment.innerHTML = base.dictionary.translate("Publish");
		
		this.publishCommentButtons.appendChild(btnAddComment);
		
		divTextAreaContainer.commentsTextArea = this.publishCommentTextArea;
		divTextAreaContainer.commentsBtnAddComment = btnAddComment;
		divTextAreaContainer.commentsBtnAddCommentToInstant = this.btnAddCommentToInstant;
		
		this.divPublishComment.appendChild(divEntry);
	},
		
	addComment:function(){
		var thisClass = this;
		var txtValue = paella.AntiXSS.htmlEscape(thisClass.publishCommentTextArea.value);
		//var txtValue = thisClass.publishCommentTextArea.value;
		var now = new Date();
		
		this.comments.push({
			id: base.uuid(),
			userName:paella.initDelegate.initParams.accessControl.userData.name,
			mode: "normal",
			value: txtValue,
			created: now
		});

		var data = {
			allComments: this.comments
		};
		
		paella.data.write('comments',{id:paella.initDelegate.getId()},data,function(response,status){
			if (status) {thisClass.loadContent();}
		});
	},
	
	addReply:function(annotationID, domNodeId){
		var thisClass = this;
		var textArea = document.getElementById(domNodeId);
		var txtValue = paella.AntiXSS.htmlEscape(textArea.value);
		var now = new Date();
		
		paella.keyManager.enabled = true;

		this.comments.push({
			id: base.uuid(),
			userName:paella.initDelegate.initParams.accessControl.userData.name,
			mode: "reply",
			parent: annotationID,
			value: txtValue,
			created: now
		});

		var data = {
			allComments: this.comments
		};
		
		paella.data.write('comments',{id:paella.initDelegate.getId()},data,function(response,status){
			if (status) thisClass.reloadComments();
		});
	},
	
	reloadComments:function() {     
		var thisClass = this;
		thisClass.commentsTree = [];
		thisClass.comments = [];
		this.divComments.innerHTML ="";
		
		paella.data.read('comments',{id:paella.initDelegate.getId()},function(data,status) {
			var i;
			var valueText;
			var comment;
			if (data && typeof(data)=='object' && data.allComments && data.allComments.length>0) {
				thisClass.comments = data.allComments;
				var tempDict = {};

				// obtain normal comments  
				for (i =0; i < data.allComments.length; ++i ) {
					valueText = data.allComments[i].value;
                                                
					if (data.allComments[i].mode !== "reply") { 
						comment = {};
						comment["id"] = data.allComments[i].id;
						comment["userName"] = data.allComments[i].userName;
						comment["mode"] = data.allComments[i].mode;
						comment["value"] = valueText;
						comment["created"] = data.allComments[i].created;
						comment["replies"] = [];    

						thisClass.commentsTree.push(comment); 
						tempDict[comment["id"]] = thisClass.commentsTree.length - 1;
					}
				}
			
				// obtain reply comments
				for (i =0; i < data.allComments.length; ++i ){
					valueText = data.allComments[i].value;

					if (data.allComments[i].mode === "reply") { 
						comment = {};
						comment["id"] = data.allComments[i].id;
						comment["userName"] = data.allComments[i].userName;
						comment["mode"] = data.allComments[i].mode;
						comment["value"] = valueText;
						comment["created"] = data.allComments[i].created;

						var index = tempDict[data.allComments[i].parent];
						thisClass.commentsTree[index]["replies"].push(comment);
					}
				}
				thisClass.displayComments();
			} 
		});
	},
	
	displayComments:function() {
          var thisClass = this;
          for (var i =0; i < thisClass.commentsTree.length; ++i ){
            var comment = thisClass.commentsTree[i];
            var e = thisClass.createACommentEntry(comment);
            thisClass.divComments.appendChild(e);
          } 
        },
	
	createACommentEntry:function(comment) {
		var thisClass = this;
		var rootID = this.divPublishComment.id+"_entry"+comment["id"];
		var users;
		
		var divEntry;
		divEntry = document.createElement('div');
		divEntry.id = rootID;
		divEntry.className = "comments_entry";
		
		var divSil;
		divSil = document.createElement('img');
		divSil.className = "comments_entry_silhouette";
		divSil.id = rootID+"_silhouette";

		divEntry.appendChild(divSil);
		
		var divCommentContainer;
		divCommentContainer = document.createElement('div');
		divCommentContainer.className = "comments_entry_container";
		divCommentContainer.id = rootID+"_comment_container";
		divEntry.appendChild(divCommentContainer);
		
		var divCommentMetadata;
		divCommentMetadata = document.createElement('div');
		divCommentMetadata.id = rootID+"_comment_metadata"; 
		divCommentContainer.appendChild(divCommentMetadata);
		
		
		
//		var datePublish = comment["created"];
		var datePublish = "";
		if (comment["created"]) {
			var dateToday=new Date();
			var dateComment = paella.utils.timeParse.matterhornTextDateToDate(comment["created"]);			
			datePublish = paella.utils.timeParse.secondsToText((dateToday.getTime()-dateComment.getTime())/1000);
		}
		/*
		var headLine = "<span class='comments_entry_username'>" + comment["userName"] + "</span>";
		headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";
		divCommentMetadata.innerHTML = headLine;
		*/
		
		var divCommentValue;
		divCommentValue = document.createElement('div');
		divCommentValue.id = rootID+"_comment_value";
		divCommentValue.className = "comments_entry_comment";
		divCommentContainer.appendChild(divCommentValue);		
		
		divCommentValue.innerHTML = comment["value"];
		
		var divCommentReply = document.createElement('div');
		divCommentReply.id = rootID+"_comment_reply";
		divCommentContainer.appendChild(divCommentReply);
		
		paella.data.read('userInfo',{username:comment["userName"]}, function(data,status) {
			if (data) {
				divSil.src = data.avatar;
				
				var headLine = "<span class='comments_entry_username'>" + data.name + " " + data.lastname + "</span>";
				headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";				
				divCommentMetadata.innerHTML = headLine;
			}
		});

		if (this.canPublishAComment == true) {
			//var btnRplyComment = document.createElement('button');
			var btnRplyComment = document.createElement('div');
			btnRplyComment.className = "reply_button";
			btnRplyComment.innerHTML = base.dictionary.translate("Reply");
			
			btnRplyComment.id = rootID+"_comment_reply_button";
			btnRplyComment.onclick = function(){
				var e = thisClass.createAReplyEntry(comment["id"]);
				this.style.display="none";
				this.parentElement.parentElement.appendChild(e);
			};
			divCommentReply.appendChild(btnRplyComment);
		}
		
		for (var i =0; i < comment.replies.length; ++i ){
			var e = thisClass.createACommentReplyEntry(comment["id"], comment["replies"][i]);
			divCommentContainer.appendChild(e);
		}
		return divEntry;
	},
	
	createACommentReplyEntry:function(parentID, comment) {
		var thisClass = this;
		var rootID = this.divPublishComment.id+"_entry_" + parentID + "_reply_" + comment["id"];

		var divEntry;
		divEntry = document.createElement('div');
		divEntry.id = rootID;
		divEntry.className = "comments_entry";
		
		var divSil;
		divSil = document.createElement('img');
		divSil.className = "comments_entry_silhouette";
		divSil.id = rootID+"_silhouette";

		divEntry.appendChild(divSil);
			
		var divCommentContainer;
		divCommentContainer = document.createElement('div');
		divCommentContainer.className = "comments_entry_container";
		divCommentContainer.id = rootID+"_comment_container";
		divEntry.appendChild(divCommentContainer);
			
		var divCommentMetadata;
		divCommentMetadata = document.createElement('div');
		divCommentMetadata.id = rootID+"_comment_metadata"; 
		divCommentContainer.appendChild(divCommentMetadata);
//		var datePublish = comment["created"];
		var datePublish = "";
		if (comment["created"]) {
			var dateToday=new Date();
			var dateComment = paella.utils.timeParse.matterhornTextDateToDate(comment["created"]);			
			datePublish = paella.utils.timeParse.secondsToText((dateToday.getTime()-dateComment.getTime())/1000);
		}
		
		/*
		var headLine = "<span class='comments_entry_username'>" + comment["userName"] + "</span>";
		headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";
		divCommentMetadata.innerHTML = headLine;
		*/
		
		var divCommentValue;
		divCommentValue = document.createElement('div');
		divCommentValue.id = rootID+"_comment_value";
		divCommentValue.className = "comments_entry_comment";
		divCommentContainer.appendChild(divCommentValue);		
		
		divCommentValue.innerHTML = comment["value"];
		
		paella.data.read('userInfo',{username:comment["userName"]}, function(data,status) {
			if (data) {
				divSil.src = data.avatar;
				
				var headLine = "<span class='comments_entry_username'>" + data.name + " " + data.lastname + "</span>";
				headLine += "<span class='comments_entry_datepublish'>" + datePublish + "</span>";				
				divCommentMetadata.innerHTML = headLine;
			}
		});	
			
		return divEntry;
	},
	
	//Allows the user to write a new reply
	createAReplyEntry:function(annotationID) {
		var thisClass = this;
		var rootID = this.divPublishComment.id+"_entry_" + annotationID + "_reply";

		var divEntry;
		divEntry = document.createElement('div');
		divEntry.id = rootID+"_entry";
		divEntry.className = "comments_entry";
		
		var divSil;
		divSil = document.createElement('img');
		divSil.className = "comments_entry_silhouette";
		divSil.style.width = "48px";		
		divSil.id = rootID+"_silhouette";
		divSil.src = paella.initDelegate.initParams.accessControl.userData.avatar;
		divEntry.appendChild(divSil);
		
		var divCommentContainer;
		divCommentContainer = document.createElement('div');
		divCommentContainer.className = "comments_entry_container comments_reply_container";
		divCommentContainer.id = rootID+"_reply_container";
		divEntry.appendChild(divCommentContainer);
	
		var textArea;
		textArea = document.createElement('textArea');
		textArea.onclick = function(){paella.keyManager.enabled = false;};
		textArea.draggable = false;
		textArea.id = rootID+"_textarea";
		divCommentContainer.appendChild(textArea);
		
		this.publishCommentButtons = document.createElement('div');
		this.publishCommentButtons.id = rootID+"_buttons_area";
		divCommentContainer.appendChild(this.publishCommentButtons);
		
		var btnAddComment;
		btnAddComment = document.createElement('button');
		btnAddComment.id = rootID+"_btnAddComment";
		btnAddComment.className = "publish";
		btnAddComment.onclick = function(){
			var txtValue = textArea.value;
			if (txtValue.replace(/\s/g,'') != "") {
				thisClass.addReply(annotationID,textArea.id);
			}
		};
		btnAddComment.innerHTML = base.dictionary.translate("Reply");
		
		this.publishCommentButtons.appendChild(btnAddComment);
		
		return divEntry;
	}
	
});
  
paella.plugins.commentsPlugin = new paella.plugins.CommentsPlugin();


/*** File: plugins/es.upv.paella.descriptionPlugin/description.js ***/
Class ("paella.plugins.DescriptionPlugin",paella.TabBarPlugin,{
	getSubclass:function() { return "showDescriptionTabBar"; },
	getName:function() { return "es.upv.paella.descriptionPlugin"; },
	getTabName:function() { return "Descripción"; },
			
	domElement:null,
			
	buildContent:function(domElement) {
		this.domElement = domElement;
		this.loadContent();
	},
			
	action:function(tab) {
		this.loadContent();
	},
			
	loadContent:function() {
		var container = this.domElement;
		container.innerHTML = "Loading...";
		new paella.Timer(function(t) {
			container.innerHTML = "Loading done";
		},2000);
	}
	
});
  

paella.plugins.descriptionPlugin = new paella.plugins.DescriptionPlugin();
/*** File: plugins/es.upv.paella.editor.SnapShotsEditorPlugin/snapshots_editor.js ***/
Class ("paella.plugins.SnapShotsEditorPlugin",paella.editor.TrackPlugin,{
	tracks:null,
	selectedTrackItem:null,
	highResFrames:null,

	getIndex:function() { return 0; },

	checkEnabled:function(onSuccess) {
		var frames = paella.initDelegate.initParams.videoLoader.frameList;
		onSuccess(frames!=null);
	},

	setup:function() {
		if (base.dictionary.currentLanguage()=="es") {
			var esDict = {
				'Slides':'Diapositivas',
				'Slide': 'Diapositiva'
			};
			base.dictionary.addDictionary(esDict);
		}
	},


	showHiResFrame:function(url) {
		var frameRoot = document.createElement("div");
		var frame = document.createElement("div");
		var hiResImage = document.createElement('img');
        hiResImage.className = 'frameHiRes';
        hiResImage.setAttribute('src',url);
        hiResImage.setAttribute('style', 'width: 100%;');

		$(frame).append(hiResImage);
		$(frameRoot).append(frame);

        frameRoot.setAttribute('style', 'display: table;');
        frame.setAttribute('style', 'display: table-cell; vertical-align:middle;');
		overlayContainer = paella.player.videoContainer.overlayContainer;

		var streams = paella.initDelegate.initParams.videoLoader.streams;
		if (streams.length == 1){
			overlayContainer.addElement(frameRoot, overlayContainer.getMasterRect());
		}
		else if (streams.length >= 2){
			overlayContainer.addElement(frameRoot, overlayContainer.getSlaveRect());
		}
		overlayContainer.enableBackgroundMode();
		this.hiResFrame = frameRoot;
	},

	removeHiResFrame:function() {
		overlayContainer = paella.player.videoContainer.overlayContainer;
		overlayContainer.removeElement(this.hiResFrame);
		overlayContainer.disableBackgroundMode();
	},


	createTrackContent: function(frameItem, numSlide) {
		onMouseOverScript = "paella.plugins.snapShotsEditorPlugin.showHiResFrame('" + frameItem.url + "');";
		onMouseOutScript = "paella.plugins.snapShotsEditorPlugin.removeHiResFrame();";

		return 	'<div class="snapShotsEditorPluginBox" onmouseover="'+ onMouseOverScript + '" onmouseout="' + onMouseOutScript + '">' +
				'	<img class="snapShotsEditorPluginImage" src="' + frameItem.thumb + '"/>' +
				'	<div class="snapShotsEditorPluginSliteText">'+ base.dictionary.translate("Slide") + ' ' + numSlide +'</div>' +
				'</div>';
	},

	getTrackItems:function() {
		if (this.tracks == null) {
			this.tracks = [];
			var frames = paella.initDelegate.initParams.videoLoader.frameList;
			if (frames) {
				var frameItem,s,e,d;
				var numFrame = 0;
				var keys = Object.keys(paella.initDelegate.initParams.videoLoader.frameList);

				for (;numFrame< keys.length-1; numFrame++) {
					frameItem = frames[keys[numFrame]];
					s = parseInt(keys[numFrame]);
					e = parseInt(keys[numFrame+1]);
					d = e-s;
					this.tracks.push({s:s, e:e, d:d, name: this.createTrackContent(frameItem, numFrame+1)});
				}
				if (keys.length > 0){
					frameItem = frames[keys[numFrame]];
					s = parseInt(keys[numFrame]);
					e = paella.player.videoContainer.duration();
					d = e-s;
					this.tracks.push({s:s, e:e, d:d, name: this.createTrackContent(frameItem, numFrame+1)});
				}
			}
		}
		return this.tracks;
	},

	getTools:function() {
		return [];
	},

	onToolSelected:function(toolName) {
	},

	getTrackUniqueId:function() {
		var newId = -1;
		if (this.tracks.length==0) return 1;
		for (var i=0;i<this.tracks.length;++i) {
			if (newId<=this.tracks[i].id) {
				newId = this.tracks[i].id + 1;
			}
		}
		return newId;
	},

	getName:function() {
		return "es.upv.paella.editor.snapShotsEditorPlugin";
	},

	getTrackName:function() {
		return base.dictionary.translate("Slides");
	},

	getColor:function() {
		return 'rgb(159, 166, 88)';
	},

	getTextColor:function() {
		return 'rgb(90,90,90)';
	},

	allowEditContent:function() {
		return false;
	},
	allowDrag:function() {
		return false;
	},
	allowResize:function() {
		return false;
	},

	getTrackItem:function(id) {
		for (var i=0;i<this.tracks.length;++i) {
			if (this.tracks[i].id==id) return this.tracks[i];
		}
	},

	onSave:function(success) {
		success(true);
	}
});

paella.plugins.snapShotsEditorPlugin = new paella.plugins.SnapShotsEditorPlugin();

/*** File: plugins/es.upv.paella.editor.toolStatusPlugin/toolStatusPlugin.js ***/
Class ("paella.editor.ToolStatusPlugin",paella.editor.RightBarPlugin,{
	currentTrack:null,
	currentTextField:null,
	trackItemContainer:null,
	selectedColor:"rgb(255, 255, 236)",

	initialize:function() {
		this.parent();
		if (base.dictionary.currentLanguage()=='es') {
			var esDict = {
				'Tool':'Herramienta',
				'Selected tool':'Herramienta seleccionada',
				'this track does not contain any item':'esta pista no contiene ningún elemento',
				'Click on timeline outside any track to select current playback time.':'Haz clic en el fondo de la línea de tiempo para establecer el instante actual de reproducción',
				'Quick help':'Ayuda rápida',
				'item':'elemento',
				'items':'elementos',
				'from':'desde',
				'to':'hasta'
			};
			base.dictionary.addDictionary(esDict);
		}
	},

	getIndex:function() {
		return 10000;
	},

	getName:function() {
		return "es.upv.paella.editor.toolStatusPlugin";
	},

	getTabName:function() {
		return base.dictionary.translate("Tool");
	},

	getContent:function() {
		this.currentTextField = null;
		var elem = document.createElement('div');
		if (this.currentTrack) {
			var plugin = paella.pluginManager.getPlugin(this.currentTrack.getName());
			elem.innerHTML = "<h6>" + base.dictionary.translate("Tool") + ": " + base.dictionary.translate(this.currentTrack.getTrackName()) + "</h6>";
			var trackList = this.currentTrack.getTrackItems();
			var trackContainer = document.createElement('div');
			trackContainer.className = "editorPluginToolStatus_trackItemList";
			this.trackItemContainer = trackContainer;
			plugin.buildToolTabContent(trackContainer);
			if (trackContainer.childNodes.length==0) {
				for (var i=0;i<trackList.length;++i) {
                    if (plugin.isSegment()) {
					    this.addTrackData(trackContainer,trackList[i]);
                    } else {
                        this.addTrackNoSegmentData(trackContainer,trackList[i]);
                    }
				}
			}
			elem.appendChild(trackContainer);
		}
		else {
			elem.innerHTML = "<h6>" + base.dictionary.translate("Tool") + ": " + base.dictionary.translate("Selection") + "</h6>";

		}

		this.addToolHelp(elem);

		return elem;
	},

	addTrackData:function(parent,track) {
		var trackData = document.createElement('div');
		//trackData.innerHTML = track.id + " s:" + track.s + ", e:" + track.e;
		var trackTime = document.createElement('div');
		var duration = Math.round((track.e - track.s) * 100) / 100;
		trackTime.innerHTML = base.dictionary.translate('from') + ' ' + paella.utils.timeParse.secondsToTime(track.s) + ' ' +
							  base.dictionary.translate('to') + ' ' + paella.utils.timeParse.secondsToTime(track.e) + ', ' +
							  duration + ' sec';
		trackData.appendChild(trackTime);
		if (track.content) {
			var content = paella.AntiXSS.htmlUnescape(track.content);
			this.addTrackContent(trackData,track.id,content,track.s,track.e);
		}
		parent.appendChild(trackData);
	},


	addTrackNoSegmentData:function(parent,track) {
		var trackData = document.createElement('div');
		//trackData.innerHTML = track.id + " s:" + track.s + ", e:" + track.e;
		var trackTime = document.createElement('div');
		var duration = Math.round((track.e - track.s) * 100) / 100;
		trackTime.innerHTML = base.dictionary.translate('at') + ' ' + paella.utils.timeParse.secondsToTime(track.s);
		trackData.appendChild(trackTime);
		if (track.content) {
			var content = paella.AntiXSS.htmlUnescape(track.content);
			this.addTrackContent(trackData,track.id,content,track.s,track.e);
		}
		parent.appendChild(trackData);
	},

	addTrackContent:function(parent,id,content,start,end) {
		var contentElem = null;
		var thisClass = this;
		if (this.currentTrack.allowEditContent()) {
			contentElem = document.createElement('input');
			contentElem.setAttribute('type', 'text');
			contentElem.setAttribute('id','trackContentEditor_' + id);
			contentElem.setAttribute('value',content);
			contentElem.trackData = {id:id,content:content,s:start,e:end};
			contentElem.plugin = this.currentTrack;
			$(contentElem).change(function(event) {
				this.plugin.onTrackContentChanged(this.trackData.id,$(this).val());
				paella.editor.instance.bottomBar.timeline.rebuildTrack(this.plugin.getName());
			});
			$(contentElem).click(function(event) {
				thisClass.onFocusChanged(this,this.plugin,this.trackData);
			});
			$(contentElem).focus(function(event) {
				thisClass.onFocusChanged(this,this.plugin,this.trackData);
			});

			var selectedTrackItemId = -1;
			try {
				selectedTrackItemId = this.currentTrack.trackInfo.trackData.id;
			}
			catch (e) { }
//paella.editor.instance.bottomBar.timeline.currentTrackList.currentTrack.trackInfo.trackData.id;
			if (selectedTrackItemId==id) {
				this.currentTextField = contentElem;
				this.currentTextField.style.backgroundColor = this.selectedColor;
			}
		}
		else {
			contentElem = document.createElement('input');
			contentElem.setAttribute('type', 'text');
			contentElem.setAttribute('id',id);
			contentElem.setAttribute('disabled','disabled');
			contentElem.setAttribute('style','color:rgb(119, 119, 119)');
			contentElem.setAttribute('value',content);
		}


		parent.appendChild(contentElem);
	},

	onFocusChanged:function(field,plugin,trackData) {
		if (this.currentTextField) {
			this.currentTextField.style.backgroundColor = "#fff";
		}
		field.style.backgroundColor = this.selectedColor;
		paella.editor.instance.bottomBar.timeline.focusTrackListItem(plugin.getName(),trackData.id);
		this.currentTextField = field;

		// Set the timeline position at the end of this track item
		var time = trackData.e;
		$(document).trigger(paella.events.seekToTime,{time:time});
	},

	onLoadFinished:function() {
		if (this.currentTextField) {
			this.trackItemContainer.scrollTop = $(this.currentTextField).position().top;
		}
	},

	addToolHelp:function(parent) {
		var helpText = "";
		if (this.currentTrack) {
			helpText = this.currentTrack.contextHelpString();
		}
		else {
			helpText = base.dictionary.translate("Click on timeline outside any track to select current playback time.");
		}

		if (helpText!="") {
			var helpElem = document.createElement('div');
			helpElem.className = "editorPluginToolStatusHelp";
			parent.appendChild(helpElem);
			helpElem.innerHTML = '<strong>' + base.dictionary.translate('Quick help') + ': </strong>' + helpText;
		}
	},

	onTrackSelected:function(newTrack) {
		this.currentTrack = newTrack;
	}
});

new paella.editor.ToolStatusPlugin();


/*


Class ("paella.editor.CaptionsPlugin",paella.editor.TrackPlugin,{
	tracks:[],
	selectedTrackItem:null,

	setup:function() {
		if (base.dictionary.currentLanguage()=="es") {
			var esDict = {
				'Captions':'Subtítulos',
				'Create':'Crear',
				'Delete':'Borrar'
			};
			base.dictionary.addDictionary(esDict);
		}
	},

	getTrackItems:function() {
		for (var i=0;i<this.tracks.length;++i) {
			this.tracks[i].name = this.tracks[i].content;
		}
		return this.tracks;
	},

	getTools:function() {
		return [
			{name:'create',label:base.dictionary.translate('Create'),hint:base.dictionary.translate('Create a new caption in the current position')},
			{name:'delete',label:base.dictionary.translate('Delete'),hint:base.dictionary.translate('Delete selected caption')}
		];
	},

	getTrackItemIndex:function(item) {
//		return this.tracks.indexOf(item);
		for(var i=0;i<this.tracks.length;++i) {
			if (item.id==this.tracks[i].id) {
				return i;
			}
		}
		return -1;
	},

	onToolSelected:function(toolName) {
		if (this.selectedTrackItem && toolName=='delete' && this.selectedTrackItem) {
			this.tracks.splice(this.getTrackItemIndex(this.selectedTrackItem),1);
			return true;
		}
		else if (toolName=='create') {
			var start = paella.player.videoContainer.currentTime();
			var end = start + 60;
			var id = this.getTrackUniqueId();
			this.tracks.push({id:id,s:start,e:end,content:base.dictionary.translate('Caption')});
			return true;
		}
	},

	getTrackUniqueId:function() {
		var newId = -1;
		if (this.tracks.length==0) return 1;
		for (var i=0;i<this.tracks.length;++i) {
			if (newId<=this.tracks[i].id) {
				newId = this.tracks[i].id + 1;
			}
		}
		return newId;
	},

	getName:function() {
		return "es.upv.paella.editor.trackCaptions";
	},

	getTrackName:function() {
		return base.dictionary.translate("Captions");
	},

	getColor:function() {
		return 'rgb(212, 212, 224)';
	},

	getTextColor:function() {
		return 'rgb(90,90,90)';
	},

	onTrackChanged:function(id,start,end) {
		var item = this.getTrackItem(id);
		if (item) {
			item.s = start;
			item.e = end;
			this.selectedTrackItem = item;
		}
	},

	onTrackContentChanged:function(id,content) {
		var item = this.getTrackItem(id);
		if (item) {
			item.content = content;
			item.name = content;
		}
	},

	allowEditContent:function() {
		return false;
	},

	getTrackItem:function(id) {
		for (var i=0;i<this.tracks.length;++i) {
			if (this.tracks[i].id==id) return this.tracks[i];
		}
	},

	contextHelpString:function() {
		if (base.dictionary.currentLanguage()=="es") {
			return "Utiliza esta herramienta para crear, borrar y editar subtítulos. Para crear un subtítulo, selecciona el instante de tiempo haciendo clic en el fondo de la línea de tiempo, y pulsa el botón 'Crear'. Utiliza esta pestaña para editar el texto de los subtítulos";
		}
		else {
			return "Use this tool to create, delete and edit video captions. To create a caption, select the time instant clicking the timeline's background and press 'create' button. Use this tab to edit the caption text.";
		}
	}
});

paella.editor.captionsPlugin = new paella.editor.CaptionsPlugin();

*/

/*** File: plugins/es.upv.paella.extendedTabAdapterPlugin/adapter.js ***/
Class ("paella.plugins.extendedTabAdapterPlugin",paella.ButtonPlugin,{
	currentUrl:null,
	currentMaster:null,
	currentSlave:null,
	availableMasters:[],
	availableSlaves:[],
	showWidthRes:null,

	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "extendedTabAdapterPlugin"; },
	getIndex:function() { return 2030; },
	getMinWindowSize:function() { return 550; },
	getName:function() { return "es.upv.paella.extendedTabAdapterPlugin"; },
	getDefaultToolTip:function() { return base.dictionary.translate("Extended Tab Adapter"); },
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },
	
	buildContent:function(domElement) {
		domElement.appendChild(paella.extendedAdapter.bottomContainer);
	}
});


new paella.plugins.extendedTabAdapterPlugin();
/*** File: plugins/es.upv.paella.footprintsPlugin/footprints.js ***/
Class ("paella.plugins.FootPrintsPlugin",paella.ButtonPlugin,{
	INTERVAL_LENGTH:5,
	inPosition:0,
	outPosition:0,
	canvas: null,
	footPrintsTimer: null,
	footPrintsData: {},

	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "footPrints"; },
	getIndex:function() { return 590; },
	getDefaultToolTip:function() { return base.dictionary.translate("Show statistics"); },
	getName:function() { return "es.upv.paella.footprintsPlugin"; },
	getButtonType:function() { return paella.ButtonPlugin.type.timeLineButton; },


	setup:function(){
		var thisClass = this;
		paella.events.bind(paella.events.timeUpdate, function(event) { thisClass.onTimeUpdate(); });

		switch(this.config.skin) {
		case 'custom':
			this.fillStyle = this.config.fillStyle;
			this.strokeStyle = this.config.strokeStyle;
			break;

		case 'dark':
			this.fillStyle = '#727272';
			this.strokeStyle = '#424242';
			break;

		case 'light':
			this.fillStyle = '#d8d8d8';
			this.strokeStyle = '#ffffff';
			break;

		default:
			this.fillStyle = '#d8d8d8';
			this.strokeStyle = '#ffffff';
			break;
		}

	},

	checkEnabled:function(onSuccess) {
		onSuccess(!paella.player.isLiveStream());
	},

	buildContent:function(domElement) {
		var container = document.createElement('div');
		container.className = 'footPrintsContainer';

		this.canvas = document.createElement('canvas');
		this.canvas.id = 'footPrintsCanvas';
		this.canvas.className = 'footPrintsCanvas';
		container.appendChild(this.canvas);


		domElement.appendChild(container);
	},

    onTimeUpdate:function() {
		var videoCurrentTime = Math.round(paella.player.videoContainer.currentTime() + paella.player.videoContainer.trimStart());
		if (this.inPosition <= videoCurrentTime && videoCurrentTime <= this.inPosition + this.INTERVAL_LENGTH) {
			this.outPosition = videoCurrentTime;
			if (this.inPosition + this.INTERVAL_LENGTH === this.outPosition) {
				this.trackFootPrint(this.inPosition, this.outPosition);
				this.inPosition = this.outPosition;
			}
		}
		else {
			this.trackFootPrint(this.inPosition, this.outPosition);
			this.inPosition = videoCurrentTime;
			this.outPosition = videoCurrentTime;
		}
    },

    trackFootPrint:function(inPosition, outPosition) {
    	var data = {"in": inPosition, "out": outPosition};
		paella.data.write('footprints',{id:paella.initDelegate.getId()}, data);
    },

	willShowContent:function() {
		var thisClass = this;
		this.loadFootprints();
		this.footPrintsTimer = new base.Timer(function(timer) {
			thisClass.loadFootprints();
			},5000);
		this.footPrintsTimer.repeat = true;
	},

	didHideContent:function() {
		if (this.footPrintsTimer!=null) {
			this.footPrintsTimer.cancel();
			this.footPrintsTimer = null;
		}
	},

    loadFootprints:function () {
	    var thisClass = this;
		paella.data.read('footprints',{id:paella.initDelegate.getId()},function(data,status) {
			var footPrintsData = {};
			var duration = Math.floor(paella.player.videoContainer.duration());
			var trimStart = Math.floor(paella.player.videoContainer.trimStart());

            var lastPosition = -1;
            var lastViews = 0;
			for (var i = 0; i < data.length; i++) {
				position = data[i].position - trimStart;
				if (position < duration){
					views = data[i].views;

					if (position - 1 != lastPosition){
						for (var j = lastPosition + 1; j < position; j++) {
							footPrintsData[j] = lastViews;
						}
					}
					footPrintsData[position] = views;
					lastPosition = position;
					lastViews = views;
				}
			}
			thisClass.drawFootPrints(footPrintsData);
		});
    },

	drawFootPrints:function(footPrintsData) {
		if (this.canvas) {
			var duration = Object.keys(footPrintsData).length;
			var ctx = this.canvas.getContext("2d");
			var h = 20;
			var i;
			for (i = 0; i<duration; ++i) {
				if (footPrintsData[i] > h) { h = footPrintsData[i]; }
			}

			this.canvas.setAttribute("width", duration);
			this.canvas.setAttribute("height", h);
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			ctx.fillStyle = this.fillStyle; //'#faa166'; //'#9ED4EE';
			ctx.strokeStyle = this.strokeStyle; //'#fa8533'; //"#0000FF";
			ctx.lineWidth = 2;

			ctx.webkitImageSmoothingEnabled = false;
			ctx.mozImageSmoothingEnabled = false;

			for (i = 0; i<duration-1; ++i) {
				ctx.beginPath();
				ctx.moveTo(i, h);
				ctx.lineTo(i, h-footPrintsData[i]);
				ctx.lineTo(i+1, h-footPrintsData[i+1]);
				ctx.lineTo(i+1, h);
				ctx.closePath();
				ctx.fill();

				ctx.beginPath();
				ctx.moveTo(i, h-footPrintsData[i]);
				ctx.lineTo(i+1, h-footPrintsData[i+1]);
				ctx.closePath();
				ctx.stroke();
			}
		}
	}
});

paella.plugins.footPrintsPlugin = new paella.plugins.FootPrintsPlugin();

/*** File: plugins/es.upv.paella.frameControlPlugin/framecontrol.js ***/
Class ("paella.plugins.FrameControlPlugin",paella.ButtonPlugin,{
	frames:null,
	highResFrames:null,
	currentFrame:null,
	navButtons:null,
	buttons: [],
	contx:null,
	_img:null,
	_searchTimer: null,
	_searchTimerTime: 250,
	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "frameControl"; },
	getIndex:function() { return 510; },
	getMinWindowSize:function() { return 200; },
	getName:function() { return "es.upv.paella.frameControlPlugin"; },
	getButtonType:function() { return paella.ButtonPlugin.type.timeLineButton; },
	getDefaultToolTip:function() { return base.dictionary.translate("Navigate by slides"); },
	checkEnabled:function(onSuccess) {
		if (paella.initDelegate.initParams.videoLoader.frameList==null) onSuccess(false);
		else if (paella.initDelegate.initParams.videoLoader.frameList.length===0) onSuccess(false);
		else if (Object.keys(paella.initDelegate.initParams.videoLoader.frameList).length==0) onSuccess(false);
		else onSuccess(true);
	},

	setup:function() {
		var thisClass = this;
		var oldClassName;
		var blockCounter = 1;
		var correctJump = 0;
		var selectedItem = -1;
		var jumpAtItem;
    	Keys = {Tab:9,Return:13,Esc:27,End:35,Home:36,Left:37,Up:38,Right:39,Down:40};

        $(this.button).keyup(function(event) {
        	var visibleItems = Math.floor(thisClass.contx.offsetWidth/100);
        	var rest = thisClass.buttons.length%visibleItems;
        	var blocks = Math.floor(thisClass.buttons.length/visibleItems);

        	if (thisClass.isPopUpOpen()){
		    	if (event.keyCode == Keys.Left) {
		           if(selectedItem > 0){
				        thisClass.buttons[selectedItem].className = oldClassName;

					    selectedItem--;

					    if(blockCounter > blocks) correctJump = visibleItems - rest;
	            		jumpAtItem = ((visibleItems)*(blockCounter-1))-1-correctJump;

	            		if(selectedItem == jumpAtItem && selectedItem != 0){
				            thisClass.navButtons.left.scrollContainer.scrollLeft -= visibleItems*105;
							--blockCounter;
	            		}

	            		if(this.hiResFrame)thisClass.removeHiResFrame();
						if (!base.userAgent.browser.IsMobileVersion) {
							thisClass.buttons[selectedItem].frameControl.onMouseOver(null,thisClass.buttons[selectedItem].frameData);
						}
					    
					    oldClassName = thisClass.buttons[selectedItem].className;
					    thisClass.buttons[selectedItem].className = 'frameControlItem selected';
		           	}
	            }
	            else if (event.keyCode == Keys.Right) {
	            	if(selectedItem<thisClass.buttons.length-1){
	            		if(selectedItem >= 0){
	            			thisClass.buttons[selectedItem].className = oldClassName;
	            		}

	            		selectedItem++;

	            		if (blockCounter == 1) correctJump = 0;
	            		jumpAtItem = (visibleItems)*blockCounter-correctJump;

	            		if(selectedItem == jumpAtItem){
				        	thisClass.navButtons.left.scrollContainer.scrollLeft += visibleItems*105;
		            		++blockCounter;
	            		}

	            		if(this.hiResFrame)thisClass.removeHiResFrame();
						if (!base.userAgent.browser.IsMobileVersion) {
							thisClass.buttons[selectedItem].frameControl.onMouseOver(null,thisClass.buttons[selectedItem].frameData);
						}
	            		
	               		oldClassName = thisClass.buttons[selectedItem].className;
	               		thisClass.buttons[selectedItem].className = 'frameControlItem selected';
	            	}
	            }
	            else if (event.keyCode == Keys.Return) {
	            	thisClass.buttons[selectedItem].frameControl.onClick(null,thisClass.buttons[selectedItem].frameData);
	            	oldClassName = 'frameControlItem current';
	            }
	            else if (event.keyCode == Keys.Esc){
	            	thisClass.removeHiResFrame();
	            }
            }
        });
    },

	buildContent:function(domElement) {
		var thisClass = this;
		this.frames = [];
		var container = document.createElement('div');
		container.className = 'frameControlContainer';

		thisClass.contx = container;

		var content = document.createElement('div');
		content.className = 'frameControlContent';

		this.navButtons = {
			left:document.createElement('div'),
			right:document.createElement('div')
		};
		this.navButtons.left.className = 'frameControl navButton left';
		this.navButtons.right.className = 'frameControl navButton right';

		var frame = this.getFrame(null);

		domElement.appendChild(this.navButtons.left);
		domElement.appendChild(container);
		container.appendChild(content);
		domElement.appendChild(this.navButtons.right);

		this.navButtons.left.scrollContainer = container;
		$(this.navButtons.left).click(function(event) {
			this.scrollContainer.scrollLeft -= 100;
		});

		this.navButtons.right.scrollContainer = container;
		$(this.navButtons.right).click(function(event) {
			this.scrollContainer.scrollLeft += 100;
		});

		content.appendChild(frame);

		var itemWidth = $(frame).outerWidth(true);
		content.innerHTML = '';
		$(window).mousemove(function(event) {
			if ($(content).offset().top>event.pageY || !$(content).is(":visible") ||
				($(content).offset().top + $(content).height())<event.pageY)
			{
				This.removeHiResFrame();
			}
		});

		var frames = paella.initDelegate.initParams.videoLoader.frameList;
		var numFrames;
		if (frames) {
			var framesKeys = Object.keys(frames);
			numFrames = framesKeys.length;

			framesKeys.map(function(i){return Number(i);})
			.sort(function(a, b){return a-b;})
			.forEach(function(key){
				var frameItem = thisClass.getFrame(frames[key]);
				content.appendChild(frameItem,'frameContrlItem_' + numFrames);
				thisClass.frames.push(frameItem);
			});
		}

		$(content).css({width:(numFrames * itemWidth) + 'px'});

		var This = this;
		paella.events.bind(paella.events.setTrim,function(event,params) {
			This.isFrameVisible(params.trimEnabled,params.trimStart,params.trimEnd);
		});

		paella.events.bind(paella.events.timeupdate,function(event,params) { This.onTimeUpdate(params.currentTime); });
	},

	showHiResFrame:function(url) {
		var thisClass = this;
		
		var frameRoot = document.createElement("div");
		var frame = document.createElement("div");
		var hiResImage = document.createElement('img');
		thisClass._img = hiResImage;
        hiResImage.className = 'frameHiRes';
        hiResImage.setAttribute('src',url);
        hiResImage.setAttribute('style', 'width: 100%;');

		$(frame).append(hiResImage);
		$(frameRoot).append(frame);

        frameRoot.setAttribute('style', 'display: table;');
        frame.setAttribute('style', 'display: table-cell; vertical-align:middle;');
		overlayContainer = paella.player.videoContainer.overlayContainer;

		var streams = paella.initDelegate.initParams.videoLoader.streams;
		if (streams.length == 1){
			overlayContainer.addElement(frameRoot, overlayContainer.getMasterRect());
		}
		else if (streams.length >= 2){
			overlayContainer.addElement(frameRoot, overlayContainer.getSlaveRect());
		}
		overlayContainer.enableBackgroundMode();
		this.hiResFrame = frameRoot;
	},

	removeHiResFrame:function() {
		var thisClass = this;
		overlayContainer = paella.player.videoContainer.overlayContainer;
		if (this.hiResFrame) {
			overlayContainer.removeElement(this.hiResFrame);
		}
		overlayContainer.disableBackgroundMode();
		thisClass._img = null;
	},

	isFrameVisible:function(trimEnabled,trimStart,trimEnd) {
		var i;
		if (!trimEnabled) {
			for (i = 0; i<this.frames.length;++i) {
				$(this.frames[i]).show();
			}
		}
		else {
			for (i = 0; i<this.frames.length; ++i) {
				var frameElem = this.frames[i];
				var frameData = frameElem.frameData;
				if (frameData.time<trimStart) {
					if (this.frames.length>i+1 && this.frames[i+1].frameData.time>trimStart) {
						$(frameElem).show();
					}
					else {
						$(frameElem).hide();
					}
				}
				else if (frameData.time>trimEnd) {
					$(frameElem).hide();
				}
				else {
					$(frameElem).show();
				}
			}
		}
	},

	getFrame:function(frameData,id) {
		var frame = document.createElement('div');
		frame.className = 'frameControlItem';
		if (id) frame.id = id;
		if (frameData) {

			this.buttons.push(frame);

			frame.frameData = frameData;
			frame.frameControl = this;
			image = frameData.thumb ? frameData.thumb:frameData.url;
			var labelTime = paella.utils.timeParse.secondsToTime(frameData.time);
			frame.innerHTML = '<img src="' + image + '" alt="" class="frameControlImage" title="'+labelTime+'" aria-label="'+labelTime+'"></img>';
			if (!base.userAgent.browser.IsMobileVersion) {
				$(frame).mouseover(function(event) {
					this.frameControl.onMouseOver(event,this.frameData);
				});
			}
			
			$(frame).mouseout(function(event) {
				this.frameControl.onMouseOut(event,this.frameData);
			});
			$(frame).click(function(event) {
				this.frameControl.onClick(event,this.frameData);
			});
		}
		return frame;
	},

	onMouseOver:function(event,frameData) {
		var thisClass = this;
		var frames = paella.initDelegate.initParams.videoLoader.frameList;
		var frame = frames[frameData.time];
		if (frame) {
			var image = frame.url;
			if(thisClass._img){
				thisClass._img.setAttribute('src',image);
			}
			else{
				this.showHiResFrame(image);
			}
		}
		
		if(thisClass._searchTimer != null){
			thisClass._searchTimer.cancel();
		}
	},

	onMouseOut:function(event,frameData) {
		var thisClass = this;
		thisClass._searchTimer = new base.Timer(function(timer) {
									thisClass.removeHiResFrame();
								}, thisClass._searchTimerTime);
	},

	onClick:function(event,frameData) {
		paella.player.videoContainer.seekToTime(frameData.time + 1);
	},

	onTimeUpdate:function(currentTime) {
		var frame = null;
		for (var i = 0; i<this.frames.length; ++i) {
			if (this.frames[i].frameData && this.frames[i].frameData.time<=currentTime) {
				frame = this.frames[i];
			}
			else {
				break;
			}
		}
		if (this.currentFrame!=frame) {
			//this.navButtons.left.scrollContainer.scrollLeft += 100;

			if (this.currentFrame) this.currentFrame.className = 'frameControlItem';
			this.currentFrame = frame;
			this.currentFrame.className = 'frameControlItem current';
		}
	}
});

paella.plugins.frameControlPlugin = new paella.plugins.FrameControlPlugin();

/*** File: plugins/es.upv.paella.fullScreenButtonPlugin/fullscreenbutton.js ***/
Class ("paella.plugins.FullScreenPlugin",paella.ButtonPlugin, {
	_reload:null,

	getIndex:function() { return 551; },
	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "showFullScreenButton"; },
	getName:function() { return "es.upv.paella.fullScreenButtonPlugin"; },
	checkEnabled:function(onSuccess) {
		var enabled = paella.player.checkFullScreenCapability();
		if (base.userAgent.browser.IsMobileVersion) {
			enabled = paella.player.videoContainer.isMonostream && (enabled);
		}
		onSuccess(enabled);
	},
	getDefaultToolTip:function() { return base.dictionary.translate("Go Fullscreen"); },

	setup:function() {
		var thisClass = this;

		this._reload = this.config.reloadOnFullscreen ? this.config.reloadOnFullscreen.enabled:false;
		this._keepUserQuality = this.config.reloadOnFullscreen ? this.config.reloadOnFullscreen.keepUserSelection:true;
		paella.events.bind(paella.events.enterFullscreen, function(event) { thisClass.onEnterFullscreen(); });
		paella.events.bind(paella.events.exitFullscreen, function(event) { thisClass.onExitFullscreen(); });
	},

	action:function(button) {
		var self = this;
		if (paella.player.isFullScreen()) {
			paella.player.exitFullScreen();
		}
		else {
			if( (base.userAgent.browser.IsMobileVersion || base.userAgent.browser.Explorer) && (window.location !== window.parent.location) ) {
				var url = window.location.href;
				//PAUSE IFRAME
				paella.player.pause();
				var sec = paella.player.videoContainer.currentTime();
				var obj = self.secondsToHours(sec);
				url_new_params = "time="+obj.h+"h"+obj.m+"m"+obj.s+"s&autoplay=true";
				url = url + (url.indexOf("?")?"&":"?") + url_new_params;
				window.open(url);
				return;
			}
			paella.player.goFullScreen();
		}
		setTimeout(function() {
			if(self._reload) {
				paella.player.reloadVideos();
			}
		}, 1000);
	},

	secondsToHours:function(sec_numb) {
		var hours   = Math.floor(sec_numb / 3600);
		var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
		var seconds =  Math.floor(sec_numb - (hours * 3600) - (minutes * 60));
		var obj = {};

		if (hours < 10) {hours = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}
		obj.h = hours;
		obj.m = minutes;
		obj.s = seconds;
		return obj;
	},

	onEnterFullscreen: function() {
		this.setToolTip(base.dictionary.translate("Exit Fullscreen"));
		this.button.className = this.getButtonItemClass(true);
	},

	onExitFullscreen: function() {
		this.setToolTip(base.dictionary.translate("Go Fullscreen"));
		this.button.className = this.getButtonItemClass(false);
	},

	getButtonItemClass:function(selected) {
		return 'buttonPlugin '+this.getAlignment() +' '+ this.getSubclass() + ((selected) ? ' active':'');
	}
});

paella.plugins.fullScreenPlugin = new paella.plugins.FullScreenPlugin();

/*** File: plugins/es.upv.paella.helpPlugin/help.js ***/
Class ("paella.plugins.HelpPlugin",paella.ButtonPlugin, {

	getIndex:function() { return 509; },
	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "helpButton"; },
	getName:function() { return "es.upv.paella.helpPlugin"; },
	getMinWindowSize:function() { return 650; },

	getDefaultToolTip:function() { return base.dictionary.translate("Show help") + ' (' + base.dictionary.translate("Paella version:") + ' ' + paella.version + ')'; },


	checkEnabled:function(onSuccess) { 
		var availableLangs = (this.config && this.config.langs) || [];
		onSuccess(availableLangs.length>0); 
	},

	action:function(button) {
		var mylang = base.dictionary.currentLanguage();
		
		var availableLangs = (this.config && this.config.langs) || [];
		var idx = availableLangs.indexOf(mylang);
		if (idx < 0) { idx = 0; }
						
		//paella.messageBox.showFrame("http://paellaplayer.upv.es/?page=usage");
		paella.messageBox.showFrame("resources/style/help/help_" + availableLangs[idx] + ".html");
	}
	
});

paella.plugins.helpPlugin = new paella.plugins.HelpPlugin();

/*** File: plugins/es.upv.paella.liveStramingIndicatorPlugin/live_stream_indicator.js ***/
Class ("paella.LiveStreamIndicator",paella.VideoOverlayButtonPlugin,{
    isEditorVisible:function() {
        return paella.editor.instance!=null;
    },
    getIndex:function() {return 10;},

    getSubclass:function() {
        return "liveIndicator";
    },

    getAlignment:function() {
        return 'right';
    },
    getDefaultToolTip:function() { return base.dictionary.translate("This video is a live stream"); },

    checkEnabled:function(onSuccess) {
        onSuccess(paella.player.isLiveStream());
    },

    setup:function() {
        var thisClass = this;
    },

    action:function(button) {
        paella.messageBox.showMessage(base.dictionary.translate("Live streaming mode: This is a live video, so, some capabilities of the player are disabled"));
    },

    getName:function() {
        return "es.upv.paella.liveStramingIndicatorPlugin";
    }
});

paella.plugins.liveStreamIndicator = new paella.LiveStreamIndicator();

/*** File: plugins/es.upv.paella.multipleQualitiesPlugin/qualities.js ***/
Class ("paella.plugins.MultipleQualitiesPlugin",paella.ButtonPlugin,{
	currentUrl:null,
	currentMaster:null,
	currentSlave:null,
	availableMasters:[],
	availableSlaves:[],
	showWidthRes:null,
	_domElement:null,

	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "showMultipleQualitiesPlugin"; },
	getIndex:function() { return 2030; },
	getMinWindowSize:function() { return 550; },
	getName:function() { return "es.upv.paella.multipleQualitiesPlugin"; },
	getDefaultToolTip:function() { return base.dictionary.translate("Change video quality"); },
		
	checkEnabled:function(onSuccess) { 	
		var key, j;
		this.currentMaster = paella.player.videoContainer.currentMasterVideoData;
		this.currentSlave = paella.player.videoContainer.currentSlaveVideoData;

		var minVerticalRes = parseInt(this.config.minVerticalRes);
		var maxVerticalRes = parseInt(this.config.maxVerticalRes);

		// Search for the resolutions
		var allMasterSources = paella.player.videoContainer.masterVideoData.sources;
		
		for (key in allMasterSources){
			for (j =0; j < allMasterSources[key].length; ++j ){
				if ((allMasterSources[key][j].type == this.currentMaster.type)){
					if ( (isNaN(minVerticalRes)==false) && (parseInt(allMasterSources[key][j].res.h) < minVerticalRes) ) {
						continue;
					}
					if ( (isNaN(maxVerticalRes)==false) && (parseInt(allMasterSources[key][j].res.h) > maxVerticalRes) ) {
						continue;
					}
					this.availableMasters.push(allMasterSources[key][j]);
				}
			}
		}
		if (this.currentSlave){
			var allSlaveSources = paella.player.videoContainer.slaveVideoData.sources;
			for (key in allSlaveSources){
				for (j =0; j < allSlaveSources[key].length; ++j ){
					if ((allSlaveSources[key][j].type == this.currentSlave.type)){
						if ( (isNaN(minVerticalRes)==false) && (parseInt(allSlaveSources[key][j].res.h) < minVerticalRes) ) {
							continue;
						}
						if ( (isNaN(maxVerticalRes)==false) && (parseInt(allSlaveSources[key][j].res.h) > maxVerticalRes) ) {
							continue;
						}
						this.availableSlaves.push(allSlaveSources[key][j]);
					}
				}
			}
		}
		
		// Sort the available resolutions
		function sortfunc(a,b){
			var ia = parseInt(a.res.h);
			var ib = parseInt(b.res.h);
			
			return ((ia < ib) ? -1 : ((ia > ib) ? 1 : 0));
		}
		this.availableMasters.sort(sortfunc);
		this.availableSlaves.sort(sortfunc);		
		
		var isenabled = (this.availableMasters.length > 1 || this.availableSlaves.length > 1);
		onSuccess(isenabled);
	},		
		
	setup:function() {
		var self = this;
		//RELOAD EVENT
		paella.events.bind(paella.events.singleVideoReady,function(event,params) {
			self.setQualityLabel();
		});

		if (base.dictionary.currentLanguage()=="es") {
			var esDict = {
				'Presenter':'Presentador',
				'Slide':'Diapositiva'
			};
			base.dictionary.addDictionary(esDict);
		}
		this.setQualityLabel();

		//config
		self.showWidthRes = (self.config.showWidthRes !== undefined) ? self.config.showWidthRes : true;
	},
	

	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },
	
	buildContent:function(domElement) {
		var self = this;
		self._domElement = domElement;
		var w, h,d,e,b=0;
		var percen1, percen2, reso2, act_percen;
		percen1=100/this.availableMasters.length;
		percen2=100/this.availableSlaves.length;

		if(this.availableMasters.length >= this.availableSlaves.length){
			act_percen= percen2;
			for(var i=0;i<this.availableMasters.length;i++){
				w = this.availableMasters[i].res.w;
				h = this.availableMasters[i].res.h;
				if(this.availableSlaves.length > 0){
					if(percen1 * (i+1) < act_percen){
						d = this.availableSlaves[b].res.w;
						e = this.availableSlaves[b].res.h;
						reso2 = d+"x"+e;
					}else{
						act_percen = percen2 + act_percen;
						d = this.availableSlaves[b].res.w;
						e = this.availableSlaves[b].res.h;
						reso2 = d+"x"+e;
						b++;
					}
				}
				if(self.showWidthRes)
					domElement.appendChild(this.getItemButton(w+"x"+h,w+"x"+h, reso2));
				else
					domElement.appendChild(this.getItemButton(h+"p",w+"x"+h, reso2));
			}
		}
		else{
			act_percen= percen1;
			for(var z=0;z<this.availableSlaves.length;z++){
				w = this.availableSlaves[z].res.w;
				h = this.availableSlaves[z].res.h;
				if(this.availableMasters.length > 0){
					if(percen2 * (z+1) < act_percen){
						d = this.availableMasters[b].res.w;
						e = this.availableMasters[b].res.h;
						reso2 = d+"x"+e;
					}else{
						act_percen = percen1 + act_percen;
						d = this.availableMasters[b].res.w;
						e = this.availableMasters[b].res.h;
						reso2 = d+"x"+e;
						b++;
					}
				}
				if(self.showWidthRes)
					domElement.appendChild(this.getItemButton(w+"x"+h,w+"x"+h, reso2));
				else
					domElement.appendChild(this.getItemButton(h+"p",w+"x"+h, reso2));
			}
		}
		
	},

	getItemButton:function(label,reso, reso2) {
		var elem = document.createElement('div');
		var current = paella.player.videoContainer.currentMasterVideoData.res.w+"x"+paella.player.videoContainer.currentMasterVideoData.res.h;
		if(label == current){
			elem.className = this.getButtonItemClass(label,true);
		}
		else {
			elem.className = this.getButtonItemClass(label,false);
		}
		elem.id = label + '_button';
		elem.innerHTML = label;
		elem.data = {
			label:label,
			reso:reso,
			reso2:reso2,
			plugin:this
		};
		$(elem).click(function(event) {
			this.data.plugin.onItemClick(this,this.data.label,this.data.reso,this.data.reso2);
		});
		return elem;
	},

	onItemClick:function(button,label,reso, reso2) {
		var self=this;
		paella.player.controls.hidePopUp(this.getName());
		paella.player.reloadVideos(reso, reso2);
		this.setQualityLabel();

		var arr = self._domElement.children;
		for(var i=0; i < arr.length; i++){
			arr[i].className = self.getButtonItemClass(i,false);
		}
		button.className = self.getButtonItemClass(i,true);
	},
	
	setQualityLabel:function() {
		var res = paella.player.videoContainer.currentMasterVideoData.res;
		this.setText(res.h + "p");
	},

	getButtonItemClass:function(profileName,selected) {
		return 'multipleQualityItem ' + profileName  + ((selected) ? ' selected':'');
	}
});


paella.plugins.multipleQualitiesPlugin = new paella.plugins.MultipleQualitiesPlugin();


		

/*** File: plugins/es.upv.paella.playPauseButtonPlugin/playbutton.js ***/
//paella.plugins.PlayPauseButtonPlugin = Class.create(paella.ButtonPlugin, {
Class ("paella.plugins.PlayPauseButtonPlugin",paella.ButtonPlugin, {
	playSubclass:'playButton',
	pauseSubclass:'pauseButton',

	getAlignment:function() { return 'left'; },
	getSubclass:function() { return this.playSubclass; },
	getName:function() { return "es.upv.paella.playPauseButtonPlugin"; },
	getDefaultToolTip:function() { return base.dictionary.translate("Play"); },
	getIndex:function() {return 110;},

	checkEnabled:function(onSuccess) {
		onSuccess(!paella.player.isLiveStream());
	},

	setup:function() {
		var This = this;
		if (paella.player.playing()) {
			this.changeSubclass(This.pauseSubclass);
		}
		paella.events.bind(paella.events.play,function(event) { This.changeSubclass(This.pauseSubclass); This.setToolTip(paella.dictionary.translate("Pause"));});
		paella.events.bind(paella.events.pause,function(event) { This.changeSubclass(This.playSubclass); This.setToolTip(paella.dictionary.translate("Play"));});
	},

	action:function(button) {
		if (paella.player.videoContainer.paused()) {
			paella.player.play();
		}
		else {
			paella.player.pause();
		}
	}
});

paella.plugins.playPauseButtonPlugn = new paella.plugins.PlayPauseButtonPlugin();


/*** File: plugins/es.upv.paella.playPauseButtonPlugin/playbutton_onscreen.js ***/

//paella.plugins.PlayButtonOnScreen = Class.create(paella.EventDrivenPlugin,{
Class ("paella.plugins.PlayButtonOnScreen",paella.EventDrivenPlugin,{
	containerId:'paella_plugin_PlayButtonOnScreen',
	container:null,
	enabled:true,
	isPlaying:false,
	showIcon:true,
	firstPlay:false,

	checkEnabled:function(onSuccess) {
		onSuccess(!paella.player.isLiveStream());
	},

	getIndex:function() {
		return 1010;
	},

	getName:function() {
		return "es.upv.paella.playButtonOnScreenPlugin";
	},


	setup:function() {
		var thisClass = this;
		this.container = document.createElement('div');
		this.container.className = "playButtonOnScreen";
		this.container.id = this.containerId;
		this.container.style.width = "100%";
		this.container.style.height = "100%";		
		paella.player.videoContainer.domElement.appendChild(this.container);
		$(this.container).click(function(event){thisClass.onPlayButtonClick();});

		var icon = document.createElement('canvas');
		icon.className = "playButtonOnScreenIcon";
		this.container.appendChild(icon);

		function repaintCanvas(){
			var width = jQuery(thisClass.container).innerWidth();
			var height = jQuery(thisClass.container).innerHeight();

			icon.width = width;
			icon.height = height;

			var iconSize = (width<height) ? width/3 : height/3;

			var ctx = icon.getContext('2d');
			// Play Icon size: 300x300
			ctx.translate((width-iconSize)/2, (height-iconSize)/2);

			ctx.beginPath();
			ctx.arc(iconSize/2, iconSize/2 ,iconSize/2, 0, 2*Math.PI, true);
			ctx.closePath();

			ctx.strokeStyle = 'white';
			ctx.lineWidth = 10;
			ctx.stroke();
			ctx.fillStyle = '#8f8f8f';
			ctx.fill();

			ctx.beginPath();
			ctx.moveTo(iconSize/3, iconSize/4);
			ctx.lineTo(3*iconSize/4, iconSize/2);
			ctx.lineTo(iconSize/3, 3*iconSize/4);
			ctx.lineTo(iconSize/3, iconSize/4);
/*
			ctx.moveTo(100, 70);
			ctx.lineTo(250, 150);
			ctx.lineTo(100, 230);
			ctx.lineTo(100, 70);
*/
			ctx.closePath();
			ctx.fillStyle = 'white';
			ctx.fill();

			ctx.stroke();
		}
		paella.events.bind(paella.events.resize,repaintCanvas);
		repaintCanvas();
	},

	getEvents:function() {
		return [paella.events.endVideo,paella.events.play,paella.events.pause,paella.events.showEditor,paella.events.hideEditor];
	},

	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.endVideo:
				this.endVideo();
				break;
			case paella.events.play:
				this.play();
				break;
			case paella.events.pause:
				this.pause();
				break;
			case paella.events.showEditor:
				this.showEditor();
				break;
			case paella.events.hideEditor:
				this.hideEditor();
				break;
		}
	},

	onPlayButtonClick:function() {
		this.firstPlay = true;
		this.checkStatus();
	},

	endVideo:function() {
		this.isPlaying = false;
		this.checkStatus();
	},

	play:function() {
		this.isPlaying = true;
		this.showIcon = false;
		this.checkStatus();
	},

	pause:function() {
		this.isPlaying = false;
		this.showIcon = false;
		this.checkStatus();
	},

	showEditor:function() {
		this.enabled = false;
		this.checkStatus();
	},

	hideEditor:function() {
		this.enabled = true;
		this.checkStatus();
	},
	
	checkStatus:function() {
		if ((this.enabled && this.isPlaying) || !this.enabled || !this.showIcon) {
			$(this.container).hide();
		}
		else {
			$(this.container).show();
		}
	}	
});

new paella.plugins.PlayButtonOnScreen();

/*** File: plugins/es.upv.paella.playbackRatePlugin/playback_rate.js ***/
Class ("paella.plugins.PlaybackRate",paella.ButtonPlugin,{
	buttonItems:null,
	buttons: [],
	selected_button: null,
	defaultRate:null,
	_domElement:null,
	available_rates: null,

	getAlignment:function() { return 'left'; },
	getSubclass:function() { return "showPlaybackRateButton"; },
	getIndex:function() { return 140; },
	getMinWindowSize:function() { return 200; },
	getName:function() { return "es.upv.paella.playbackRatePlugin"; },
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },
	getDefaultToolTip:function() { return base.dictionary.translate("Set playback rate"); },		
	checkEnabled:function(onSuccess) {
		var enabled = (!base.userAgent.browser.IsMobileVersion && dynamic_cast("paella.Html5Video",paella.player.videoContainer.masterVideo())!=null);		
		onSuccess(enabled);
	},

	setup:function() {
		this.defaultRate = 1.0;
		this.available_rates = this.config.availableRates || [0.75, 1, 1.25, 1.5];
    },

	buildContent:function(domElement) {
		var This = this;
		This._domElement = domElement;
		this.buttonItems = {};
		this.available_rates.forEach(function(rate){
			domElement.appendChild(This.getItemButton(rate+"x", rate));	
		});
	},
	
	getItemButton:function(label,rate) {
		var elem = document.createElement('div');
		if(rate == 1.0){
			elem.className = this.getButtonItemClass(label,true);
		}
		else{
			elem.className = this.getButtonItemClass(label,false);
		}
		elem.id = label + '_button';
		elem.innerHTML = label;
		elem.data = {
			label:label,
			rate:rate,
			plugin:this
		};
		$(elem).click(function(event) {
			this.data.plugin.onItemClick(this,this.data.label,this.data.rate);
		});
		return elem;
	},
	
	onItemClick:function(button,label,rate) {
		var self = this;
		//paella.player.videoContainer.setPlaybackRate(rate);
		paella.events.trigger(paella.events.setPlaybackRate, rate);
		this.setText(label);
		paella.player.controls.hidePopUp(this.getName());


		var arr = self._domElement.children;
		for(var i=0; i < arr.length; i++){
			arr[i].className = self.getButtonItemClass(i,false);
		}
		button.className = self.getButtonItemClass(i,true);
	},
	
	getText:function() {
		return "1x";
	},

	getProfileItemButton:function(profile,profileData) {
		var elem = document.createElement('div');
		elem.className = this.getButtonItemClass(profile,false);
		elem.id = profile + '_button';
		
		elem.data = {
			profile:profile,
			profileData:profileData,
			plugin:this
		};
		$(elem).click(function(event) {
			this.data.plugin.onItemClick(this,this.data.profile,this.data.profileData);
		});
		return elem;
	},

	getButtonItemClass:function(profileName,selected) {
		return 'playbackRateItem ' + profileName  + ((selected) ? ' selected':'');
	}
});

paella.plugins.playbackRate = new paella.plugins.PlaybackRate();

/*** File: plugins/es.upv.paella.search.CaptionsSearchPlugIn/captionsSearch.js ***/
/////////////////////////////////////////////////
// Caption Search
/////////////////////////////////////////////////
Class ("paella.plugins.CaptionsSearchPlugIn", paella.SearchServicePlugIn, {
	getName: function() { return "es.upv.paella.search.captionsSearchPlugin"; },

	search: function(text, next) {
		paella.captions.search(text, next);
	}	
});

new paella.plugins.CaptionsSearchPlugIn();
/*** File: plugins/es.upv.paella.searchPlugin/search.js ***/
Class ("paella.plugins.SearchPlugin", paella.ButtonPlugin,{
	_open: false,
	_sortDefault: 'time', // score || time
	_colorSearch: false, // true || false
	_localImages: null,
	_searchTimer: null,
	_searchTimerTime: 1500,
	_searchBody:null,


	getAlignment:function() { return 'right'; },
	getSubclass:function() { return 'searchButton'; },
	getName:function() { return "es.upv.paella.searchPlugin"; },
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },	
	getDefaultToolTip:function() { return base.dictionary.translate("Search"); },
	getIndex:function() {return 510;},

	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	setup:function() {
		var self = this;
		$('.searchButton').click(function(event){
			if(self._open){
				self._open = false;
			}
			else {
				self._open = true;
				setTimeout(function(){
   					 $("#searchBarInput").focus();
				}, 0);
				}
		});
		//GET THE FRAME LIST
		self._localImages = paella.initDelegate.initParams.videoLoader.frameList;

		//config
		self._colorSearch = self.config.colorSearch || false;
		self._sortDefault = self.config.sortType || "time";
		
		paella.events.bind(paella.events.controlBarWillHide, function(evt) { if(self._open)paella.player.controls.cancelHideBar(); });
	},

	prettyTime:function(seconds){
		// TIME FORMAT
		var hou = Math.floor(seconds / 3600)%24;
		hou = ("00"+hou).slice(hou.toString().length);

		var min = Math.floor(seconds / 60)%60;
		min = ("00"+min).slice(min.toString().length);

		var sec = Math.floor(seconds % 60);
		sec = ("00"+sec).slice(sec.toString().length);
		var timestr = (hou+":"+min+":"+sec);

		return timestr;
	},

	search:function(text,cb){
 		paella.searchService.search(text, cb);
	},

	getPreviewImage:function(time){
		var thisClass = this;
		var keys = Object.keys(thisClass._localImages);

		keys.push(time);

		keys.sort(function(a,b){
			return parseInt(a)-parseInt(b);
		});

		var n = keys.indexOf(time)-1;
		n = (n > 0) ? n : 0;

		var i = keys[n];
		i=parseInt(i);

		return thisClass._localImages[i].url;
	},

	createLoadingElement:function(parent){
		var loadingResults = document.createElement('div');
		loadingResults.className = "loader";

		var htmlLoader = "<svg version=\"1.1\" id=\"loader-1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"40px\" height=\"40px\" viewBox=\"0 0 50 50\" style=\"enable-background:new 0 0 50 50;\" xml:space=\"preserve\">"+
   		"<path fill=\"#000\" d=\"M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z\">"+
    	"<animateTransform attributeType=\"xml\""+
      	"attributeName=\"transform\""+
      	"type=\"rotate\""+
      	"from=\"0 25 25\""+
      	"to=\"360 25 25\""+
      	"dur=\"0.6s\""+
      	"repeatCount=\"indefinite\"/>"+
    	"</path>"+
  		"</svg>";
		loadingResults.innerHTML = htmlLoader;
		parent.appendChild(loadingResults);
		var sBodyText = document.createElement('p');
		sBodyText.className = 'sBodyText';
		sBodyText.innerHTML = base.dictionary.translate("Searching") + "...";
		parent.appendChild(sBodyText);
	},

	createNotResultsFound:function(parent){
		var noResults = document.createElement('div');
		noResults.className = "noResults";
		noResults.innerHTML = base.dictionary.translate("Sorry! No results found.");
		parent.appendChild(noResults);
	},

	doSearch: function(txt, searchBody) {
		var thisClass = this;
		$(searchBody).empty();

		//LOADING CONTAINER
		thisClass.createLoadingElement(searchBody);
	
		thisClass.search(txt, function(err, results){

		$(searchBody).empty();
		//BUILD SEARCH RESULTS
		if(!err){
			if(results.length == 0){ // 0 RESULTS FOUND
				thisClass.createNotResultsFound(searchBody);
			}
			else {
				for(var i=0; i<results.length; i++){ // FILL THE BODY CONTAINER WITH RESULTS

		        	//SEARCH SORT TYPE (TIME oR SCoRE)
		        	if(thisClass._sortDefault == 'score') {
			        	results.sort(function(a,b){
							return b.score - a.score;
						});
			        }
					if(thisClass._sortDefault == 'time') {
			        	results.sort(function(a,b){
							return a.time - b.time;
						});
			    	}

					var sBodyInnerContainer = document.createElement('div');
		        	sBodyInnerContainer.className = 'sBodyInnerContainer';
		        	
		        	//COLOR
		        	if(thisClass._colorSearch){ 

		        		if(results[i].score <= 0.3) {$(sBodyInnerContainer).addClass('redScore');}

		        		if(results[i].score >= 0.7) {$(sBodyInnerContainer).addClass('greenScore');}
		        	}

		        	var TimePicContainer = document.createElement('div');
		        	TimePicContainer.className = 'TimePicContainer';


		        	var sBodyPicture = document.createElement('img');
		        	sBodyPicture.className = 'sBodyPicture';
		        	sBodyPicture.src = thisClass.getPreviewImage(results[i].time);

		        	
		        	var sBodyText = document.createElement('p');
		        	sBodyText.className = 'sBodyText';
		        	sBodyText.innerHTML = "<span class='timeSpan'>"+thisClass.prettyTime(results[i].time)+"</span>"+results[i].content;


		        	TimePicContainer.appendChild(sBodyPicture);
		        	

		        	sBodyInnerContainer.appendChild(TimePicContainer);
		        	sBodyInnerContainer.appendChild(sBodyText);
		        	

		        	searchBody.appendChild(sBodyInnerContainer);
		        	//ADD SECS TO DOM FOR EASY HANDLE
		        	sBodyInnerContainer.setAttribute('sec',results[i].time);

		        	//jQuery Binds for the search
		        	$(sBodyInnerContainer).hover(
		        		function(){ 
		        			$(this).css('background-color','#faa166');	           		
		        		},
		        		function(){ 
		        			$(this).removeAttr('style');
		        		}
		        	);

		        	$(sBodyInnerContainer).click(function(){ 
		        		var sec = $(this).attr("sec");
		        		paella.player.videoContainer.seekToTime(sec);
						paella.player.play();
		        	});
				}
			}
		}
	    });
	},

	buildContent:function(domElement) {
		var thisClass = this;
		var myUrl = null;

		//SEARCH CONTAINER
		var searchPluginContainer = document.createElement('div');
        searchPluginContainer.className = 'searchPluginContainer';
	        
	        //SEARCH BODY
	        var searchBody = document.createElement('div');
	        searchBody.className = 'searchBody';
	        searchPluginContainer.appendChild(searchBody);
			
			thisClass._searchBody = searchBody;


	    //SEARCH BAR
	    var searchBar = document.createElement('div');
        searchBar.className = 'searchBar';
        searchPluginContainer.appendChild(searchBar);

	        //INPUT
	        var input = document.createElement("input");
	        input.className = "searchBarInput";
	        input.type = "text";
	        input.id ="searchBarInput";
	        input.name = "searchString";
	        input.placeholder = base.dictionary.translate("Search");
	        searchBar.appendChild(input);

	        $(input).change(function(){
	        	var text = $(input).val();
				if(thisClass._searchTimer != null){
					thisClass._searchTimer.cancel();
				}
				if(text!=""){
		        	thisClass.doSearch(text, searchBody);
				}
			});

			$(input).keyup(function(event){
				if(event.keyCode != 13){ //IF no ENTER PRESSED SETUP THE TIMER
					var text = $(input).val();
					if(thisClass._searchTimer != null){
						thisClass._searchTimer.cancel();
					}
					if(text!=""){
						thisClass._searchTimer = new base.Timer(function(timer) {
							thisClass.doSearch(text, searchBody);
						}, thisClass._searchTimerTime);
					}
					else {
						$(thisClass._searchBody).empty();
					}
				}			
			});
			
			$(input).focus(function(){
				paella.keyManager.enabled = false;
			});
			
			$(input).focusout(function(){
				paella.keyManager.enabled = true;
			});
			
			

        domElement.appendChild(searchPluginContainer);

    },

});

paella.plugins.searchPlugin = new paella.plugins.SearchPlugin();
/*** File: plugins/es.upv.paella.showEditorPlugin/show_editor.js ***/
Class ("paella.ShowEditorPlugin",paella.VideoOverlayButtonPlugin,{
	isEditorVisible:function() {
		return paella.editor.instance!=null;
	},
	getIndex:function() {return 10;},

	getSubclass:function() {
		return "showEditorButton";
	},

	getAlignment:function() {
		return 'right';
	},
	getDefaultToolTip:function() { return base.dictionary.translate("Enter editor mode"); },

	checkEnabled:function(onSuccess) {
		onSuccess(paella.editor && paella.player.config.editor && paella.player.config.editor.enabled && !base.userAgent.browser.IsMobileVersion &&
			(paella.initDelegate.initParams.accessControl.permissions.canWrite || this.config.alwaysVisible) && !paella.player.isLiveStream());
	},

	setup:function() {
		var thisClass = this;

		paella.events.bind(paella.events.hideEditor,function(event) { thisClass.onHideEditor(); });
		paella.events.bind(paella.events.showEditor,function(event) { thisClass.onShowEditor(); });
	},

	action:function(button) {
		var editorPage = this.config.editorPage ? this.config.editorPage: '';
		var openEditorInIframe = this.config.openEditorInIframe ? this.config.openEditorInIframe: false;
		if (window!=window.top && !openEditorInIframe){
			window.open(editorPage + "?id=" + paella.player.videoIdentifier, '_top');
		}
		else {
			paella.events.trigger(paella.events.showEditor);
		}
	},

	onHideEditor:function() {
		this.showButton();
	},

	onShowEditor:function() {
		this.hideButton();
	},

	getName:function() {
		return "es.upv.paella.showEditorPlugin";
	}
});

paella.plugins.showEditorPlugin = new paella.ShowEditorPlugin();

/*** File: plugins/es.upv.paella.socialPlugin/social.js ***/
Class ("paella.plugins.SocialPlugin",paella.ButtonPlugin,{
	buttonItems: null,
	socialMedia: null,
	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "showSocialPluginButton"; },
	getIndex:function() { return 560; },
	getMinWindowSize:function() { return 600; },
	getName:function() { return "es.upv.paella.socialPlugin"; },
	checkEnabled:function(onSuccess) { onSuccess(true); },
	getDefaultToolTip:function() { return base.dictionary.translate("Share this video"); },
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },

	buttons: [],
	selected_button: null,


    initialize:function() {
        this.parent();
        if (base.dictionary.currentLanguage()=='es') {
            var esDict = {
                'Custom size:': 'Tamaño personalizado:',
                'Choose your embed size. Copy the text and paste it in your html page.': 'Elija el tamaño del video a embeber. Copie el texto y péguelo en su página html.',
                'Width:':'Ancho:',
                'Height:':'Alto:'
            };
            base.dictionary.addDictionary(esDict);
        }
    },

	setup:function() {
		var thisClass = this;

    	Keys = {Tab:9,Return:13,Esc:27,End:35,Home:36,Left:37,Up:38,Right:39,Down:40};

        $(this.button).keyup(function(event) {
        	if(thisClass.isPopUpOpen()) {
		    	if (event.keyCode == Keys.Up) {
		           if(thisClass.selected_button>0){
			            if(thisClass.selected_button<thisClass.buttons.length)
				            thisClass.buttons[thisClass.selected_button].className = 'socialItemButton '+thisClass.buttons[thisClass.selected_button].data.mediaData;

					    thisClass.selected_button--;
					    thisClass.buttons[thisClass.selected_button].className = thisClass.buttons[thisClass.selected_button].className+' selected';
		           	}
	            }
	            else if (event.keyCode == Keys.Down) {
	            	if(thisClass.selected_button<thisClass.buttons.length-1){
	            		if(thisClass.selected_button>=0)
	            			thisClass.buttons[thisClass.selected_button].className = 'socialItemButton '+thisClass.buttons[thisClass.selected_button].data.mediaData;

	            		thisClass.selected_button++;
	               		thisClass.buttons[thisClass.selected_button].className = thisClass.buttons[thisClass.selected_button].className+' selected';
	            	}
	            }
	            else if (event.keyCode == Keys.Return) {
	                thisClass.onItemClick(thisClass.buttons[thisClass.selected_button].data.mediaData);
	            }
        	}
        });
    },

	buildContent:function(domElement) {
		var thisClass = this;
		this.buttonItems = {};
		socialMedia = ['facebook','twitter', 'embed'];
		socialMedia.forEach(function(mediaData) {
		  var buttonItem = thisClass.getSocialMediaItemButton(mediaData);
		  thisClass.buttonItems[socialMedia.indexOf(mediaData)] = buttonItem;
		  domElement.appendChild(buttonItem);
		  thisClass.buttons.push(buttonItem);
		});
		this.selected_button = thisClass.buttons.length;
	},

	getSocialMediaItemButton:function(mediaData) {
		var elem = document.createElement('div');
		elem.className = 'socialItemButton ' + mediaData;
		elem.id = mediaData + '_button';
		elem.data = {
			mediaData:mediaData,
			plugin:this
		};
		$(elem).click(function(event) {
			this.data.plugin.onItemClick(this.data.mediaData);
		});
		return elem;
	},

	onItemClick:function(mediaData) {
		var url = this.getVideoUrl();
		switch (mediaData) {
			case ('twitter'):
				window.open('http://twitter.com/home?status=' + url);
				break;
			case ('facebook'):
				window.open('http://www.facebook.com/sharer.php?u=' + url);
				break;
			case ('embed'):
				this.embedPress();
				break;
		}
		paella.player.controls.hidePopUp(this.getName());
	},

	getVideoUrl:function() {
		var url = document.location.href;
		return url;
	},

    embedPress:function() {
        var host = document.location.protocol + "//" +document.location.host;
        var pathname = document.location.pathname;

        var p = pathname.split("/");
        if (p.length > 0){p[p.length-1] = "embed.html";}
		var id = paella.initDelegate.getId();
        var url = host+p.join("/")+"?id="+id;
        //var paused = paella.player.videoContainer.paused();
        //$(document).trigger(paella.events.pause);


        var divSelectSize="<div style='display:inline-block;'> " +
            "    <div class='embedSizeButton' style='width:110px; height:73px;'> <span style='display:flex; align-items:center; justify-content:center; width:100%; height:100%;'> 620x349 </span></div>" +
            "    <div class='embedSizeButton' style='width:100px; height:65px;'> <span style='display:flex; align-items:center; justify-content:center; width:100%; height:100%;'> 540x304 </span></div>" +
            "    <div class='embedSizeButton' style='width:90px;  height:58px;'> <span style='display:flex; align-items:center; justify-content:center; width:100%; height:100%;'> 460x259 </span></div>" +
            "    <div class='embedSizeButton' style='width:80px;  height:50px;'> <span style='display:flex; align-items:center; justify-content:center; width:100%; height:100%;'> 380x214 </span></div>" +
            "    <div class='embedSizeButton' style='width:70px;  height:42px;'> <span style='display:flex; align-items:center; justify-content:center; width:100%; height:100%;'> 300x169 </span></div>" +
            "</div><div style='display:inline-block; vertical-align:bottom; margin-left:10px;'>"+
            "    <div>"+base.dictionary.translate("Custom size:")+"</div>" +
            "    <div>"+base.dictionary.translate("Width:")+" <input id='social_embed_width-input' class='embedSizeInput' maxlength='4' type='text' name='Costum width min 300px' alt='Costum width min 300px' title='Costum width min 300px' value=''></div>" +
            "    <div>"+base.dictionary.translate("Height:")+" <input id='social_embed_height-input' class='embedSizeInput' maxlength='4' type='text' name='Costum width min 300px' alt='Costum width min 300px' title='Costum width min 300px' value=''></div>" +
            "</div>";


        var divEmbed = "<div id='embedContent' style='text-align:left; font-size:14px; color:black;'><div id=''>"+divSelectSize+"</div> <div id=''>"+base.dictionary.translate("Choose your embed size. Copy the text and paste it in your html page.")+"</div> <div id=''><textarea id='social_embed-textarea' class='social_embed-textarea' rows='4' cols='1' style='font-size:12px; width:95%; overflow:auto; margin-top:5px; color:black;'></textarea></div>  </div>";


        paella.messageBox.showMessage(divEmbed, {
            closeButton:true,
            width:'750px',
            height:'210px',
            onClose:function() {
            //      if (paused == false) {$(document).trigger(paella.events.play);}
            }
        });
        var w_e = $('#social_embed_width-input')[0];
        var h_e = $('#social_embed_height-input')[0];
        w_e.onkeyup = function(event){
            var width = parseInt(w_e.value);
            var height = parseInt(h_e.value);
            if (isNaN(width)){
            	w_e.value="";
            }
            else{
                if (width<300){
                    $("#social_embed-textarea")[0].value = "Embed width too low. The minimum value is a width of 300.";
                }
                else{
                    if (isNaN(height)){
                        height = (width/(16/9)).toFixed();
                        h_e.value = height;
                    }
                    $("#social_embed-textarea")[0].value = '<iframe allowfullscreen src="'+url+'" style="border:0px #FFFFFF none;" name="Paella Player" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" width="'+width+'" height="'+height+'"></iframe>';
                }
            }
        };
        var embs = $(".embedSizeButton");
        for (var i=0; i< embs.length; i=i+1){
            var e = embs[i];
            e.onclick=function(event){
                var value = event.target? event.target.textContent: event.toElement.textContent;
                if (value) {
                    var size = value.split("x");

                    w_e.value = size[0];
                    h_e.value = size[1];
                    $("#social_embed-textarea")[0].value = '<iframe allowfullscreen src="'+url+'" style="border:0px #FFFFFF none;" name="Paella Player" scrolling="no" frameborder="0" marginheight="0px" marginwidth="0px" width="'+size[0]+'" height="'+size[1]+'"></iframe>';
                }
            };
        }
    }



});


paella.plugins.socialPlugin = new paella.plugins.SocialPlugin();

/*** File: plugins/es.upv.paella.test.tabBarExamplePlugin/tabbar_example.js ***/
var MyTabBarExamplePlugin = Class.create(paella.TabBarPlugin,{
	getSubclass:function() { return "test"; },
	getTabName:function() { return "TabBar Example"; },
	getName:function() { return "es.upv.paella.test.tabBarExamplePlugin"; },

	buildContent:function(domElement) {
		domElement.innerHTML = "<p>This is a Paella Extended tab bar plugin</p>";
	}
});

new MyTabBarExamplePlugin();

/*** File: plugins/es.upv.paella.test.videoLoadPlugin/videoload_test.js ***/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Loader Publish Plugin
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
Class ("paella.plugins.VideoLoadTestPlugin",paella.EventDrivenPlugin,{
	startTime: 0,
	endTime: 0,

	initialize:function() {
		this.parent();
		this.startTime = Date.now();

        if (base.dictionary.currentLanguage()=='es') {
                var esDict = {
                        'Video loaded in {0} seconds':'Video cargado en {0} segundos',
                };
                base.dictionary.addDictionary(esDict);
        }		
	},


	getName:function() { return 'es.upv.paella.test.videoLoadPlugin'; },

	checkEnabled:function(onSuccess) {
		onSuccess(true);
	},

	getEvents:function() {
		return [paella.events.loadComplete];
	},

	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.loadComplete:
				this.onLoadComplete();
				break;
		}
	},

	onLoadComplete:function() {
		this.endTime = Date.now();

		var bench = (this.endTime - this.startTime)/1000.0;
		this.showOverlayMessage(base.dictionary.translate("Video loaded in {0} seconds").replace(/\{0\}/g,bench));
	},


	showOverlayMessage:function(message) {
		var overlayContainer = paella.player.videoContainer.overlayContainer;
		var rect = {left:40, top:50, width:/*1200*/430, height:80};

		var root = document.createElement("div");
		root.className = 'videoLoadTestOverlay';

		var button = document.createElement("div");
		button.className ="btn";
		button.innerHTML = "X";
		button.onclick = function(){overlayContainer.removeElement(root);};

		var element = document.createElement("div");
		element.className = 'videoLoadTest';
		element.innerHTML = message;

		element.appendChild(button);
		root.appendChild(element);

		overlayContainer.addElement(root, rect);
	}
});

paella.plugins.videoLoadTestPlugin = new paella.plugins.VideoLoadTestPlugin();

/*** File: plugins/es.upv.paella.themeChooser/themechooser.js ***/
Class ("paella.plugins.ThemeChooserPlugin", paella.ButtonPlugin,{
	currentUrl:null,
	currentMaster:null,
	currentSlave:null,
	availableMasters:[],
	availableSlaves:[],
	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "themeChooserPlugin"; },
	getIndex:function() { return 2030; },
	getMinWindowSize:function() { return 600; },
	getName:function() { return "es.upv.paella.themeChooserPlugin"; },	
	getDefaultToolTip:function() { return base.dictionary.translate("Change theme"); },	
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },

	checkEnabled:function(onSuccess) { 
		if ( paella.player.config.skin && paella.player.config.skin.available
			&& (paella.player.config.skin.available instanceof Array) 
			&& (paella.player.config.skin.available.length >0)) {
			
			onSuccess(true);			
		}
		else {
			onSuccess(false);
		}
	},
	
	buildContent:function(domElement) {
		var This = this;
		paella.player.config.skin.available.forEach(function(item){
			var elem = document.createElement('div');
			elem.className = "themebutton";
			elem.innerHTML = item.replace('-',' ').replace('_',' ');
			$(elem).click(function(event) {
				paella.utils.skin.set(item);
				paella.player.controls.hidePopUp(This.getName());
			});
			
			domElement.appendChild(elem);			
		});
	}
});


paella.plugins.themeChooserPlugin = new paella.plugins.ThemeChooserPlugin();


		

/*** File: plugins/es.upv.paella.translectures.CaptionsPlugIn/translectures.js ***/

paella.plugins.translectures = {};

Class ("paella.captions.translectures.Caption", paella.captions.Caption, {
	initialize: function(id, format, url, lang, editURL, next) {
		this.parent(id, format, url, lang, next);
		this._captionsProvider = "translecturesCaptionsProvider";
		this._editURL = editURL;
	},
	
	canEdit: function(next) {
		// next(err, canEdit)
		next(false, ((this._editURL != undefined)&&(this._editURL != "")));
	},
	
	goToEdit: function() {		
		var permissions = paella.player.auth.permissions();
		
		if (permissions.isAnonymous == true) {
			this.askForAnonymousOrLoginEdit();
		}
		else {
			this.doEdit();
		}		
	},
		
	doEdit: function() {
		window.location.href = this._editURL;		
	},
	doLoginAndEdit: function() {
		paella.player.auth.login(this._editURL);
	},
	
	askForAnonymousOrLoginEdit: function() {
		var self = this;

		var messageBoxElem = document.createElement('div');
		messageBoxElem.className = "translecturesCaptionsMessageBox";

		var messageBoxTitle = document.createElement('div');
		messageBoxTitle.className = "title";
		messageBoxTitle.innerHTML = base.dictionary.translate("You are trying to modify the transcriptions, but you are not Logged in!");		
		messageBoxElem.appendChild(messageBoxTitle);

		var messageBoxAuthContainer = document.createElement('div');
		messageBoxAuthContainer.className = "authMethodsContainer";
		messageBoxElem.appendChild(messageBoxAuthContainer);

		// Anonymous edit
		var messageBoxAuth = document.createElement('div');
		messageBoxAuth.className = "authMethod";
		messageBoxAuthContainer.appendChild(messageBoxAuth);

		var messageBoxAuthLink = document.createElement('a');
		messageBoxAuthLink.href = "#";
		messageBoxAuthLink.style.color = "#004488";
		messageBoxAuth.appendChild(messageBoxAuthLink);

		var messageBoxAuthLinkImg = document.createElement('img');
		messageBoxAuthLinkImg.src = "resources/style/caption_mlangs_anonymous.png";
		messageBoxAuthLinkImg.alt = "Anonymous";
		messageBoxAuthLinkImg.style.height = "100px";
		messageBoxAuthLink.appendChild(messageBoxAuthLinkImg);

		var messageBoxAuthLinkText = document.createElement('p');
		messageBoxAuthLinkText.innerHTML = base.dictionary.translate("Continue editing the transcriptions anonymously");
		messageBoxAuthLink.appendChild(messageBoxAuthLinkText);

		$(messageBoxAuthLink).click(function() {
			self.doEdit();
		});

		// Auth edit
		messageBoxAuth = document.createElement('div');
		messageBoxAuth.className = "authMethod";
		messageBoxAuthContainer.appendChild(messageBoxAuth);

		messageBoxAuthLink = document.createElement('a');
		messageBoxAuthLink.href = "#";
		messageBoxAuthLink.style.color = "#004488";
		messageBoxAuth.appendChild(messageBoxAuthLink);

		messageBoxAuthLinkImg = document.createElement('img');
		messageBoxAuthLinkImg.src = "resources/style/caption_mlangs_lock.png";
		messageBoxAuthLinkImg.alt = "Login";
		messageBoxAuthLinkImg.style.height = "100px";
		messageBoxAuthLink.appendChild(messageBoxAuthLinkImg);

		messageBoxAuthLinkText = document.createElement('p');
		messageBoxAuthLinkText.innerHTML = base.dictionary.translate("Log in and edit the transcriptions");
		messageBoxAuthLink.appendChild(messageBoxAuthLinkText);


		$(messageBoxAuthLink).click(function() {
			self.doLoginAndEdit();
		});

		// Show UI		
		paella.messageBox.showElement(messageBoxElem);
	}
});



Class ("paella.plugins.translectures.CaptionsPlugIn", paella.EventDrivenPlugin, {
		
	getName:function() { return "es.upv.paella.translecture.captionsPlugin"; },
	getEvents:function() { return []; },
	onEvent:function(eventType,params) {},

	checkEnabled: function(onSuccess) {
		var self = this;
		var video_id = paella.player.videoIdentifier;
				
		if ((this.config.tLServer == undefined) || (this.config.tLdb == undefined)){
			base.log.warning(this.getName() + " plugin not configured!");
			onSuccess(false);
		}
		else {
			var langs_url = (this.config.tLServer + "/langs?db=${tLdb}&id=${videoId}").replace(/\$\{videoId\}/ig, video_id).replace(/\$\{tLdb\}/ig, this.config.tLdb);
			base.ajax.get({url: langs_url},
				function(data, contentType, returnCode, dataRaw) {					
					if (data.scode == 0) {
						data.langs.forEach(function(l){
							var l_get_url = (self.config.tLServer + "/dfxp?format=1&pol=0&db=${tLdb}&id=${videoId}&lang=${tl.lang.code}")
								.replace(/\$\{videoId\}/ig, video_id)
								.replace(/\$\{tLdb\}/ig, self.config.tLdb)
								.replace(/\$\{tl.lang.code\}/ig, l.code);
														
							var l_edit_url;							
							if (self.config.tLEdit) {
								l_edit_url = self.config.tLEdit
									.replace(/\$\{videoId\}/ig, video_id)
									.replace(/\$\{tLdb\}/ig, self.config.tLdb)
									.replace(/\$\{tl.lang.code\}/ig, l.code);
							}
							
							var l_txt = l.value;
				            switch(l.type){
						    	case 0:
						    		l_txt += " (" + paella.dictionary.translate("Auto") + ")";
						    		break;
						    	case 1:
						    		l_txt += " (" + paella.dictionary.translate("Under review") + ")";
						    		break;
						    }
														
							var c = new paella.captions.translectures.Caption(l.code , "dfxp", l_get_url, {code: l.code, txt: l_txt}, l_edit_url);
							paella.captions.addCaptions(c);
						});
						onSuccess(false);
					}
					else {
						base.log.debug("Error getting available captions from translectures: " + langs_url);
						onSuccess(false);
					}
				},						
				function(data, contentType, returnCode) {
					base.log.debug("Error getting available captions from translectures: " + langs_url);
					onSuccess(false);
				}
			);			
		}
	}	
});


new paella.plugins.translectures.CaptionsPlugIn();
/*** File: plugins/es.upv.paella.usertracking.elasticsearchSaverPlugin/elasticsearchSaverPlugin.js ***/
new (Class (paella.userTracking.SaverPlugIn, {
	type:'userTrackingSaverPlugIn',
	getName: function() {return "es.upv.paella.usertracking.elasticsearchSaverPlugin";},
	
	checkEnabled: function(onSuccess) {
		this._url = this.config.url;
		this._index = this.config.index || "paellaplayer";
		this._type = this.config.type || "usertracking";
		
		var enabled = true;
		if (this._url == undefined){
			enabled = false;
			base.log.debug("No ElasticSearch URL found in config file. Disabling ElasticSearch PlugIn");
		}
		
		onSuccess(enabled);
	},
	
	log: function(event, params) {	
		var p = params;
		if (typeof(p) != "object") {
			p = {value: p};
		}
		var log = {
			date: new Date(),
			video: paella.initDelegate.getId(),
			playing: !paella.player.videoContainer.paused(),
			time: parseInt(paella.player.videoContainer.currentTime() + paella.player.videoContainer.trimStart()),
			event: event,
			params: p
		};		
		
		paella.ajax.post({url:this._url+ "/"+ this._index + "/" + this._type + "/", params:JSON.stringify(log) });
	}
}))();
/*** File: plugins/es.upv.paella.usertracking.googleAnalyticsSaverPlugIn/usertracking_googleanalytics_saver.js ***/


new (Class (paella.userTracking.SaverPlugIn,{
	getName:function() { return "es.upv.paella.usertracking.GoogleAnalyticsSaverPlugin"; },
		
	checkEnabled:function(onSuccess) {
		var trackingID = this.config.trackingID;
		var domain = this.config.domain || "auto";
		if (trackingID){
			base.log.debug("Google Analitycs Enabled");
			/* jshint ignore:start */
				(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
				(i[r].q=i[r].q||[]).push(arguments);},i[r].l=1*new Date();a=s.createElement(o),
				m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
				})(window,document,'script','//www.google-analytics.com/analytics.js','__gaTracker');
			/* jshint ignore:end */
			__gaTracker('create', trackingID, domain);
			__gaTracker('send', 'pageview');
			onSuccess(true);
		}		
		else {
			base.log.debug("No Google Tracking ID found in config file. Disabling Google Analitycs PlugIn");
			onSuccess(false);
		}				
	},


	log: function(event, params) {
		if ((this.config.category === undefined) || (this.config.category ===true)) {
			var category = this.config.category || "PaellaPlayer";
			var action = event;
			var label =  "";
			
			try {
				label = JSON.stringify(params);
			}
			catch(e) {}
			
			__gaTracker('send', 'event', category, action, label);
		}
	}
	
}))();







/*** File: plugins/es.upv.paella.viewModePlugin/viewmode.js ***/
Class ("paella.plugins.ViewModePlugin",paella.ButtonPlugin,{
	buttonItems:null,
	buttons: [],
	selected_button: null,
	active_profiles: null,

	getAlignment:function() { return 'right'; },
	getSubclass:function() { return "showViewModeButton"; },
	getIndex:function() { return 540; },
	getMinWindowSize:function() { return 300; },
	getName:function() { return "es.upv.paella.viewModePlugin"; },
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },
	getDefaultToolTip:function() { return base.dictionary.translate("Change video layout"); },		
	checkEnabled:function(onSuccess) {
		this.active_profiles = this.config.activeProfiles;
		onSuccess(!paella.player.videoContainer.isMonostream);
	},

	setup:function() {
		var thisClass = this;

    	Keys = {Tab:9,Return:13,Esc:27,End:35,Home:36,Left:37,Up:38,Right:39,Down:40};

        $(this.button).keyup(function(event) {
        	if (thisClass.isPopUpOpen()){
		    	if (event.keyCode == Keys.Up) {
		           if(thisClass.selected_button>0){
			            if(thisClass.selected_button<thisClass.buttons.length)
				            thisClass.buttons[thisClass.selected_button].className = 'viewModeItemButton '+thisClass.buttons[thisClass.selected_button].data.profile;

					    thisClass.selected_button--;
					    thisClass.buttons[thisClass.selected_button].className = thisClass.buttons[thisClass.selected_button].className+' selected';
		           	}
	            }
	            else if (event.keyCode == Keys.Down) {
	            	if( thisClass.selected_button < thisClass.buttons.length-1){
	            		if(thisClass.selected_button>=0)
	            			thisClass.buttons[thisClass.selected_button].className = 'viewModeItemButton '+thisClass.buttons[thisClass.selected_button].data.profile;

	            		thisClass.selected_button++;
	               		thisClass.buttons[thisClass.selected_button].className = thisClass.buttons[thisClass.selected_button].className+' selected';
	            	}
	            }
	            else if (event.keyCode == Keys.Return) {
	                thisClass.onItemClick(thisClass.buttons[thisClass.selected_button],thisClass.buttons[thisClass.selected_button].data.profile,thisClass.buttons[thisClass.selected_button].data.profile);
	            }
        	}
        });
    },

	buildContent:function(domElement) {
		var thisClass = this;
		this.buttonItems = {};
		paella.Profiles.loadProfileList(function(profiles) {
			Object.keys(profiles).forEach(function(profile) {
				if (profiles[profile].hidden) return;
				if (thisClass.active_profiles) {
					var active = false;
					thisClass.active_profiles.forEach(function(ap) {
						if (ap == profile) {active = true;}
					});
					if (active == false) {
						return;
					}
				}
				
				
				// START - BLACKBOARD DEPENDENCY
				var n = paella.player.videoContainer.sourceData[0].sources;
				if(profile=="s_p_blackboard2" && n.hasOwnProperty("image")==false) { return; }
				// END - BLACKBOARD DEPENDENCY
				var profileData = profiles[profile];
				var buttonItem = thisClass.getProfileItemButton(profile, profileData);
				thisClass.buttonItems[profile] = buttonItem;
				domElement.appendChild(buttonItem);
				thisClass.buttons.push(buttonItem);
				if(paella.player.selectedProfile == profile){
					thisClass.buttonItems[profile].className = thisClass.getButtonItemClass(profile, true);
				}
			});
			thisClass.selected_button = thisClass.buttons.length;
		});
	},

	getProfileItemButton:function(profile,profileData) {
		var elem = document.createElement('div');
		elem.className = this.getButtonItemClass(profile,false);
		elem.id = profile + '_button';
		elem.data = {
			profile:profile,
			profileData:profileData,
			plugin:this
		};
		$(elem).click(function(event) {
			this.data.plugin.onItemClick(this,this.data.profile,this.data.profileData);
		});
		return elem;
	},

	onItemClick:function(button,profile,profileData) {
		var thisClass = this;
		var ButtonItem = this.buttonItems[profile];
		
		n = this.buttonItems;
		arr = Object.keys(n);
		arr.forEach(function(i){
			thisClass.buttonItems[i].className = thisClass.getButtonItemClass(i,false);
		});

		if (ButtonItem) {
			ButtonItem.className = thisClass.getButtonItemClass(profile,true);
			paella.player.setProfile(profile);
		}
		paella.player.controls.hidePopUp(this.getName());
	},

	getButtonItemClass:function(profileName,selected) {
		return 'viewModeItemButton ' + profileName  + ((selected) ? ' selected':'');
	}
});

paella.plugins.viewModePlugin = new paella.plugins.ViewModePlugin();

/*** File: plugins/es.upv.paella.volumeRangePlugin/volumeRange.js ***/

Class ("paella.plugins.VolumeRangePlugin", paella.ButtonPlugin,{
	getAlignment:function() { return 'left'; },
	getSubclass:function() { return 'volumeRangeButton'; },
	getName:function() { return "es.upv.paella.volumeRangePlugin"; },
	getButtonType:function() { return paella.ButtonPlugin.type.popUpButton; },	
	getDefaultToolTip:function() { return base.dictionary.translate("Volume"); },
	getIndex:function() {return 120;},

	_showMasterVolume: null,
	_showSlaveVolume: null,
	_tempMasterVolume: 0,
	_tempSlaveVolume: 0,
	_inputMaster: null,
	_inputSlave: null,
	_control_NotMyselfEvent: true,
	_storedValue: false,

	checkEnabled:function(onSuccess) {
		var enabled = false;
		if (!base.userAgent.browser.IsMobileVersion) {
			this._showMasterVolume = (this.config.showMasterVolume !== undefined) ? this.config.showMasterVolume : true;
			this._showSlaveVolume = ((this.config.showSlaveVolume !== undefined) && (!paella.player.videoContainer.isMonostream)) ? this.config.showSlaveVolume : false;
						
			if (this._showMasterVolume || this._showSlaveVolume) {
				enabled = true;
			}
		}	
		onSuccess(enabled);
	},
	
	setup:function() {
		var self = this;
		//STORE VALUES
		paella.events.bind(paella.events.videoUnloaded,function(event,params) {self.storeVolume();});
		//RECOVER VALUES
		paella.events.bind(paella.events.singleVideoReady,function(event,params) {self.loadStoredVolume(params);});
				
		paella.events.bind(paella.events.setVolume, function(evt,par){ self.updateVolumeOnEvent(par);});
	},
	
	updateVolumeOnEvent:function(volume){
		var thisClass = this;
		
		if(thisClass._control_NotMyselfEvent){
			if(thisClass._inputMaster){
				thisClass._inputMaster.value = volume.master;
			}
		
			if(thisClass._inputSlave){
				thisClass._inputSlave.value = volume.slave;
			}
		}
		else {thisClass._control_NotMyselfEvent = true;}			
	},

	storeVolume:function(){
		this._storedValue = true;
		if(paella.player.videoContainer.slaveVideo()){
			this._tempSlaveVolume = paella.player.videoContainer.slaveVideo().volume();
		}
		if(paella.player.videoContainer.masterVideo()){
			this._tempMasterVolume = paella.player.videoContainer.masterVideo().volume();
		}
	},

	loadStoredVolume:function(params){
		if (this._storedValue == false) {
			this.storeVolume();
		}
		
		if((params.sender.identifier == "playerContainer_videoContainer_1") && this._tempSlaveVolume || this._tempMasterVolume){
			paella.player.videoContainer.setVolume({ master:this._tempMasterVolume, slave:this._tempSlaveVolume });
		}
		this._storedValue = false;
	},

	buildContent:function(domElement) {
		var thisClass = this;

		var videoRangeContainer = document.createElement('div');
        videoRangeContainer.className = 'videoRangeContainer';


        if (this._showMasterVolume) {
			var rangeMaster = document.createElement('div');
			rangeMaster.className = "range";
			var rangeImageMaster = document.createElement('div');
			rangeImageMaster.className = "image master";
			var rangeInputMaster = document.createElement('input');
			thisClass._inputMaster = rangeInputMaster;
			rangeInputMaster.type = "range";
			rangeInputMaster.min = 0;
			rangeInputMaster.max = 1;
			rangeInputMaster.step = 0.01;
			rangeInputMaster.value = this.getMasterVolume();
			
		var updateMasterVolume = function() {
				var slaveVideo = paella.player.videoContainer.slaveVideo();
				var slaveVolume = 0;
				if (slaveVideo) { slaveVolume = slaveVideo.volume(); }
			
				var masterVolume = $(rangeInputMaster).val();
				thisClass._control_NotMyselfEvent = false;
				paella.player.videoContainer.setVolume({ master:masterVolume, slave:slaveVolume });
			};
			$(rangeInputMaster).bind('input', function (e) { updateMasterVolume(); });
			$(rangeInputMaster).change(function() { updateMasterVolume(); });
			
			rangeMaster.appendChild(rangeImageMaster);
			rangeMaster.appendChild(rangeInputMaster);
			videoRangeContainer.appendChild(rangeMaster);			
		}
				
        

        if (!paella.player.videoContainer.isMonostream && this._showSlaveVolume) {
			var rangeSlave = document.createElement('div');
			rangeSlave.className = "range";
			var rangeImageSlave = document.createElement('div');
			rangeImageSlave.className = "image slave";
			var rangeInputSlave = document.createElement('input');
			thisClass._inputSlave = rangeInputSlave;
			rangeInputSlave.type = "range";
			rangeInputSlave.min = 0;
			rangeInputSlave.max = 1;
			rangeInputSlave.step = 0.01;
			rangeInputSlave.value = this.getSlaveVolume();
			
		var updateSlaveVolume = function() {
				var masterVideo = paella.player.videoContainer.masterVideo();
				var masterVolume = 0;
				if (masterVideo) { masterVolume = masterVideo.volume(); }
				
				var slaveVolume = $(rangeInputSlave).val(); 
				thisClass._control_NotMyselfEvent = false;
				paella.player.videoContainer.setVolume({ master:masterVolume, slave:slaveVolume });
			};
			$(rangeInputSlave).bind('input', function (e) { updateSlaveVolume(); });
			$(rangeInputSlave).change(function() { updateSlaveVolume(); });
									
			rangeSlave.appendChild(rangeImageSlave);
			rangeSlave.appendChild(rangeInputSlave);
			videoRangeContainer.appendChild(rangeSlave);
		}

							
		paella.events.bind(paella.events.setVolume, function(event,params) {
			if (this._showMasterVolume) {
				rangeInputMaster.value = params.master;
			}
			if (!paella.player.videoContainer.isMonostream && this._showMasterVolume) {
				rangeInputSlave.value = params.slave;
			}
			thisClass.updateClass();
		});
		
		
		
		domElement.appendChild(videoRangeContainer);
		thisClass.updateClass();
	},
	
	getMasterVolume : function() {
		var masterVideo = paella.player.videoContainer.masterVideo();
	
		if (masterVideo) {	
			return masterVideo.volume();
		}
		return 0;
	},

	getSlaveVolume : function() {
		var slaveVideo = paella.player.videoContainer.slaveVideo();
		
		if (slaveVideo) {	
			return slaveVideo.volume();
		}
		return 0;
	},
	
	updateClass: function() {
		var volume; 
		var selected = '';
		
		if (this._showMasterVolume && this._showSlaveVolume) {
			selected = "med";
		}
		else {
			if (this._showMasterVolume) {
				volume = paella.player.videoContainer.masterVideo().volume();
			}
			if (this._showSlaveVolume) {
				volume = paella.player.videoContainer.slaveVideo().volume();				
			}
			
			if (volume === undefined) { selected = 'med'; }
			else if (volume == 0) { selected = 'mute'; }
			else if (volume < 0.33) { selected = 'min'; }
			else if (volume < 0.66) { selected = 'med'; }
			else { selected = 'max'; }
		} 
						
		this.button.className = ['buttonPlugin', this.getAlignment(), this.getSubclass(), selected].join(' ');		
	}
});

paella.plugins.volumeRangePlugin = new paella.plugins.VolumeRangePlugin();


/*** File: plugins/es.upv.paella.windowTitlePlugin/window_title.js ***/
Class ("paella.plugins.WindowTitlePlugin",paella.EventDrivenPlugin,{
	_initDone:false,

	getName:function() {
		return "es.upv.paella.windowTitlePlugin";
	},

	getEvents:function() {
		return [
			paella.events.singleVideoReady
		];
	},

	onEvent:function(eventType,params) {
		switch (eventType) {
			case paella.events.singleVideoReady:
				if (!this._initDone) this.loadTitle();
				break;
		}
	},

	loadTitle:function() {
		var title = paella.player.videoLoader.getMetadata() && paella.player.videoLoader.getMetadata().title;
		document.title = title || document.title;
		this._initDone = true;
	}
});

paella.plugins.windowTitlePlugin = new paella.plugins.WindowTitlePlugin();

/*** File: plugins/es.upv.paella.zoomPlugin/zp.js ***/
Class ("paella.ZoomPlugin", paella.EventDrivenPlugin,{
	_zImages:null,
	_imageNumber:null,
	_isActivated:false,
	_isCreated:false,
	_keys:null,
	_ant:null,
	_next:null,
	_videoLength:null,
	_compChanged:false,
	_restartPlugin:false,
	_actualImage: null,
	_zoomIncr: null,
	_maxZoom: null,
	_minZoom: null,
	_dragMode: false,
	_mouseDownPosition: null,

	getIndex:function(){return 20;},

	getAlignment:function(){
		return 'right';
	},
	getSubclass:function() { return "zoomButton"; },

	getDefaultToolTip:function() { return base.dictionary.translate("Zoom");},

	getEvents:function() {
		return[
			paella.events.timeUpdate,
			paella.events.setComposition,
			paella.events.loadPlugins,
			paella.events.play
		];
    },

    onEvent:function(event, params){
    	var self = this;
    	switch(event){
    		case paella.events.timeUpdate: this.imageUpdate(event,params); break;
    		case paella.events.setComposition: this.compositionChanged(event,params); break;
    		case paella.events.loadPlugins: this.loadPlugin(event,params); break;
			case paella.events.play: this.exitPhotoMode(); break;
    	}
    },
	checkEnabled:function(onSuccess) {
		if (paella.player.videoContainer.sourceData.length<2) {
			onSuccess(false);
			return;
		}

		// CHECK IF THE VIDEO HAS HIRESIMAGES
		var n = paella.player.videoContainer.sourceData[0].sources;

		if(n.hasOwnProperty("image"))onSuccess(true);
		else onSuccess(false);
	},

	setupIcons:function(){
		var self = this;
		var width = $('.zoomFrame').width();
		//ARROWS
		var arrowsLeft = document.createElement("div");
		arrowsLeft.className = "arrowsLeft";
		arrowsLeft.style.display = 'none';

		var arrowsRight = document.createElement("div");
		arrowsRight.className = "arrowsRight";
		arrowsRight.style.display = 'none';
		arrowsRight.style.left = (width-24)+'px';

		$(arrowsLeft).click(function(){
			self.arrowCallLeft();
			event.stopPropagation();
		});
		$(arrowsRight).click(function(){
			self.arrowCallRight();
			event.stopPropagation();
		});

		//ICONS
		var iconsFrame = document.createElement("div");
		iconsFrame.className = "iconsFrame";

		var buttonZoomIn = document.createElement("button");
		buttonZoomIn.className = "zoomActionButton buttonZoomIn";
		buttonZoomIn.style.display = 'none';

		var buttonZoomOut = document.createElement("button");
		buttonZoomOut.className = "zoomActionButton buttonZoomOut";
		buttonZoomOut.style.display = 'none';

		var buttonSnapshot = document.createElement("button");
		buttonSnapshot.className = "zoomActionButton buttonSnapshot";
		buttonSnapshot.style.display = 'none';

		var buttonZoomOn = document.createElement("button");
		buttonZoomOn.className = "zoomActionButton buttonZoomOn";

		$(iconsFrame).append(buttonZoomOn);
		$(iconsFrame).append(buttonSnapshot);
		$(iconsFrame).append(buttonZoomIn);
		$(iconsFrame).append(buttonZoomOut);

		$(".newframe").append(iconsFrame);
		$(".newframe").append(arrowsLeft);
		$(".newframe").append(arrowsRight);

		$(buttonZoomOn).click(function(){
			if(self._isActivated){
				self.exitPhotoMode();
				$('.zoomActionButton.buttonZoomOn').removeClass("clicked");
			}
			else{
				self.enterPhotoMode();
				//clicked
				$('.zoomActionButton.buttonZoomOn').addClass("clicked");
			}
			event.stopPropagation();
		});

		$(buttonSnapshot).click(function(){
			if(self._actualImage != null)
			window.open(self._actualImage, "_blank");
			event.stopPropagation();
		});

		$(buttonZoomIn).click(function(){
			self.zoomIn();
			event.stopPropagation();
		});

		$(buttonZoomOut).click(function(){
			self.zoomOut();
			event.stopPropagation();
		});
	},
	
	enterPhotoMode:function() {
		var self = this;

		$( ".zoomFrame" ).show();
		$( ".zoomFrame").css('opacity','1');
		this._isActivated = true;
		// SHOW ZOOM ICONS
		$('.buttonSnapshot').show();
		$('.buttonZoomOut').show();
		$('.buttonZoomIn').show();
		//ARROWS
		$('.arrowsRight').show();
		$('.arrowsLeft').show();
		paella.player.pause();

		//UPDATE ARROWS
		if(self._imageNumber <= 1) $('.arrowsLeft').hide(); else if(this._isActivated) $('.arrowsLeft').show();
		if(self._imageNumber >= self._keys.length-2) $('.arrowsRight').hide(); else if(this._isActivated) $('.arrowsRight').show();
	},
	
	exitPhotoMode:function() {
		$( ".zoomFrame" ).hide();
		this._isActivated = false;
		// HIDE ZOOM ICONS
		$('.buttonSnapshot').hide();
		$('.buttonZoomOut').hide();
		$('.buttonZoomIn').hide();
		//ARROWS
		$('.arrowsRight').hide();
		$('.arrowsLeft').hide();
		$('.zoomActionButton.buttonZoomOn').removeClass("clicked");
	},

	setup:function() {
		var self = this;
		
		self._maxZoom = self.config.maxZoom || 500;
		self._minZoom = self.config.minZoom || 100;
		self._zoomIncr = self.config.zoomIncr || 10;


		//  BRING THE IMAGE ARRAY TO LOCAL
		this._zImages = {};
		this._zImages = paella.player.videoContainer.sourceData[0].sources.image[0].frames; // COPY TO LOCAL
		this._videoLength = paella.player.videoContainer.sourceData[0].sources.image[0].duration; // video duration in frames

		// SORT KEYS FOR SEARCH CLOSEST
		this._keys = Object.keys(this._zImages);
		this._keys = this._keys.sort(function(a, b){
			a = a.slice(6);
			b = b.slice(6);
			return parseInt(a)-parseInt(b); 
		});

		//NEXT
		this._next = 0;
		this._ant = 0;
	},

	loadPlugin:function(){
		var self = this;
		if(self._isCreated == false){
			self.createOverlay();
			self.setupIcons();
			$( ".zoomFrame" ).hide();
			self._isActivated = false;
			self._isCreated = true;
		}
	},

	imageUpdate:function(event,params) {

			var self = this;
			var sec = Math.round(params.currentTime);
			var src = $( ".zoomFrame" ).css('background-image');

			if($('.newframe').length>0){

				if(this._zImages.hasOwnProperty("frame_"+sec)) { // SWAP IMAGES WHEN PLAYING
					if(src == this._zImages["frame_"+sec]) return;
					else src = this._zImages["frame_"+sec]; 
					}

				else if(sec > this._next || sec < this._ant || self._compChanged) { 
					if(self._compChanged) self._compChanged = false;
					src = self.returnSrc(sec); 
					} // RELOAD IF OUT OF INTERVAL
					else return;

					$("#photo_01").attr('src',src).load();

					//PRELOAD NEXT IMAGE
					var image = new Image();
					image.onload = function(){
	    			$( ".zoomFrame" ).css('background-image', 'url(' + src + ')'); // UPDATING IMAGE
					};
					image.src = src;

					// OPEN NEW WINDOW WITH FULLSCREEN IMAGE
					self._actualImage = src;

					// UPDATE ARROWS
					if(self._imageNumber <= 1) $('.arrowsLeft').hide(); else if(this._isActivated) $('.arrowsLeft').show();
					if(self._imageNumber >= self._keys.length-2) $('.arrowsRight').hide(); else if(this._isActivated) $('.arrowsRight').show();
			}
		
	},

	returnSrc:function(sec){

		var ant = 0;
		for (i=0; i<this._keys.length; i++){
			var id = parseInt(this._keys[i].slice(6));
			var lastId = parseInt(this._keys[(this._keys.length-1)].slice(6));
			if(sec < id) {  // PREVIOUS IMAGE
				this._next = id; 
				this._ant = ant; 
				this._imageNumber = i-1;
				return this._zImages["frame_"+ant];} // return previous and keep next change
			else if(sec > lastId && sec < this._videoLength){ // LAST INTERVAL
					this._next = this._videoLength;
					this._ant = lastId;
					return this._zImages["frame_"+ant]; 
			}
				else ant = id;
		}
	},
	arrowCallLeft:function(){
		var self=this;
		if(self._imageNumber-1 >= 0){
			var frame = self._keys[self._imageNumber-1];
			self._imageNumber -= 1;
			paella.player.videoContainer.seekToTime(parseInt(frame.slice(6)));
		}
	},
	arrowCallRight:function(){
		var self=this;
		if(self._imageNumber+1 <= self._keys.length){
			var frame = self._keys[self._imageNumber+1];
			self._imageNumber += 1;
			paella.player.videoContainer.seekToTime(parseInt(frame.slice(6)));
		}
	},

	createOverlay:function(){
			var self = this;

			var newframe = document.createElement("div");
			newframe.className = "newframe";
			
			overlayContainer = paella.player.videoContainer.overlayContainer;
			overlayContainer.addElement(newframe, overlayContainer.getMasterRect());

			var zoomframe = document.createElement("div");
			zoomframe.className = "zoomFrame";	
      		newframe.insertBefore(zoomframe,newframe.firstChild);
			$(zoomframe).click(function(event) {
				event.stopPropagation();
			});


      		// BINDS JQUERY
      		$(zoomframe).bind('mousewheel', function(e){
        		if(e.originalEvent.wheelDelta /120 > 0) {
            		self.zoomIn();
        		}
        		else{
            		self.zoomOut();
        		}
        	});

        	//BIND MOUSE HOVER ( IN - OUT )
        	//$(zoomframe).mouseleave(function() {
   			// $('.zoomFrame').css('opacity','0');
  			//});
  			//$(zoomframe).mouseenter(function() {
   			// $('.zoomFrame').css('opacity','1');
  			//});

  			//BIND MOVEMENT
			$(zoomframe).mousedown(function(event) {
				self.mouseDown(event.clientX,event.clientY);
			});
			
			$(zoomframe).mouseup(function(event) {
				self.mouseUp();
			});
			
			$(zoomframe).mouseleave(function(event) {
				self.mouseLeave();
			});
			
  			$(zoomframe).mousemove(function(event){
  				self.mouseMove(event.clientX,event.clientY);
  			});

	},

	mouseDown:function(x,y) {
		this._dragMode = true;
		this._mouseDownPosition = { x:x, y:y };
	},
	
	mouseUp:function() {
		this._dragMode = false;
	},
	
	mouseLeave:function() {
		this._dragMode = false;
	},
	
	mouseMove:function(x,y){
		if (this._dragMode) {
			var p = $(".zoomFrame")[0];
			var pos = this._backgroundPosition ? this._backgroundPosition:{left:0,top:0};

			var width = $('.zoomFrame').width();
			var height = $('.zoomFrame').height();
			
			var px = this._mouseDownPosition.x - x;
			var py = this._mouseDownPosition.y - y;
			
			var positionx = pos.left + px;
			var positiony = pos.top + py;
			positionx = positionx>=0 ? positionx:0;
			positionx = positionx<=100 ? positionx:100;
			positiony = positiony>=0 ? positiony:0;
			positiony = positiony<=100 ? positiony:100;

			$('.zoomFrame').css('background-position',positionx+"% "+positiony+"%");
			this._backgroundPosition = { left:positionx, top:positiony };
			this._mouseDownPosition.x = x;
			this._mouseDownPosition.y = y;
		}
	},

	zoomIn:function(){
		var self = this;

		z = $('.zoomFrame').css('background-size');
		z = z.split(" ");
		z = parseInt(z[0]);

		if(z < self._maxZoom){
			$('.zoomFrame').css('background-size',z+self._zoomIncr+"% auto");
		}	
	},

	zoomOut:function(){
		var self = this;

		z = $('.zoomFrame').css('background-size');
		z = z.split(" ");
		z = parseInt(z[0]);

		if(z > self._minZoom){
			$('.zoomFrame').css('background-size',z-self._zoomIncr+"% auto");
		}	
	},

	imageUpdateOnPause:function(params) {
			var self = this;
			var sec = Math.round(params);
			var src = $( ".zoomFrame" ).css('background-image');

			if($('.newframe').length>0 && src != self._actualImage){

				if(this._zImages.hasOwnProperty("frame_"+sec)) { // SWAP IMAGES WHEN PLAYING
					if(src == this._zImages["frame_"+sec]) return;
					else src = this._zImages["frame_"+sec]; 
					}

				else { 
					if(self._compChanged) self._compChanged = false;
					src = self.returnSrc(sec); 
					}

					$("#photo_01").attr('src',src).load();

					//PRELOAD NEXT IMAGE
					var image = new Image();
					image.onload = function(){
	    			$( ".zoomFrame" ).css('background-image', 'url(' + src + ')'); // UPDATING IMAGE
					};
					image.src = src;

					// OPEN NEW WINDOW WITH FULLSCREEN IMAGE
					self._actualImage = src;

			}
	},

	compositionChanged:function(event,params){
		var self = this;
		$( ".newframe" ).remove();// REMOVE PLUGIN
		self._isCreated = false;
		if(paella.player.videoContainer.getMasterVideoRect().visible){
			self.loadPlugin();
			// IF IS PAUSED ON COMPOSITION CHANGED
			if(paella.player.paused()){
			var currentTime = paella.player.videoContainer.currentTime();
			self.imageUpdateOnPause(currentTime);
			}
		}
		self._compChanged = true;

	},

	getName:function() { 
		return "es.upv.paella.zoomPlugin";
	}
});

paella.plugins.zoomPlugin = new paella.ZoomPlugin();
paella.version = "4.2.1 - build: d2d7340";
