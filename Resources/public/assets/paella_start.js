"use strict"

// startsWith function
if ( typeof String.prototype.startsWith != 'function' ) {
  String.prototype.startsWith = function( str ) {
    return this.substring( 0, str.length ) === str;
  }
};

var MyAccessControl = Class.create(paella.AccessControl,{
  _read: undefined,
  _write: undefined,
  _userData: undefined,

  userData:function() {
    var self = this;
    return new Promise((resolve, reject)=>{
      if (self._userData) {
        resolve(self._userData);
      }
      else {
        var user_info = {"name": "Annonymous", "email" : "mailto:annonymous@example.com", "platform":"Unknown"}
        //Check if the user comes from Openedx/Moodle
        var params = decodeURIComponent(window.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
        if (params.email && params.username){
          user_info.name = params.username
          user_info.email = "mailto:" + params.email
          user_info.platform = "Openedx/Moodle"
        }
        //If not comes from Openedx/Moodle check if the user is logged in Pumukit
        else if (window.username !== "" && window.useremail !== "") {
          user_info.name = window.username
          user_info.email = "mailto:" + window.useremail
          user_info.platform = "Pumukit"
        }
        self._userData = {
          name: user_info.name,
          email: user_info.email,
          platform: user_info.platform,
          avatar: paella.utils.folders.resources() + '/images/default_avatar.png'
        };
      }
      resolve(self._userData);
    });
  },

});
Class("paella.MyInitDelegate", paella.InitDelegate, {
  getId: function() {
    var id = base.parameters.get("id")
    if(!id)
    id = base.parameters.get("videoId")
    if(!id)
    id = window.location.pathname.match(/\/(\w+)$/)[1];
    return  id || "noid"
  }
});
var MyVideoLoader = Class.create(paella.DefaultVideoLoader, {
  ref2IntRe:/.*;time=T(\d*?):(\d*?):(\d*?):(\d*?)F1000/i,

  ref2Int:function(ref) {
    var match = this.ref2IntRe.exec(ref);
    return parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
  },

  loadVideo:function(videoId, onSuccess) {
    if (videoId) {
      var that = this;
      var repo_url = '/paellarepository/' + videoId
      var secret = paella.utils.parameters.get('secret')
      if(secret)
      repo_url = '/secret/paellarepository/' + secret
      repo_url += window.location.search
      $.get(repo_url)
      .done(function(data){
        var This = that;
        if (data.streams) {
          data.streams.forEach(function(stream) {
            This.loadStream(stream);
          });
        }
        if (data.frameList) {
          that.loadFrameData(data);
        }
        if (data.captions) {
          that.loadCaptions(data.captions);
        }
        if (data.blackboard) {
          that.loadBlackboard(data.streams[0],data.blackboard);
        }
        that.streams = data.streams;
        that.frameList = data.frameList;
        that.metadata = data.metadata;
        that.loadStatus = that.streams.length>0;
        onSuccess();
      })
      .fail(function(data){
        console.log("error loading mediapackage");
      });
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
          source.forEach(function(sourceItem) {
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
  }
});

function loadPaella(containerId, videoId) {
  var initDelegate = new paella.MyInitDelegate({configUrl: "/paella/config.json?id=" + videoId,videoLoader:new MyVideoLoader()});
  initPaellaEngage(containerId,initDelegate);
}

paella.dataDelegates.UserDataDelegate = Class.create(paella.DataDelegate,{
  initialize:function() {
  },

  read:function(context, params, onSuccess) {
    var value = {
      userName:"userName",
      name: "Name",
      lastname: "Lastname",
      avatar:"plugins/silhouette32.png"
    };

    if (typeof(onSuccess)=='function') { onSuccess(value,true); }
  }

});
