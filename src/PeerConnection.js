'use strict';
 
/** 
 * @const 
 */
var peerConnectionConfiguration  = {
	'iceServers': [
		{'url': 'stun:stun.l.google.com:19302'}
	]
};

/** 
 * @const 
 */
var peerConnectionOptional  = {
	optional: [{DtlsSrtpKeyAgreement: true}]
};

/** 
 * @const 
 */
var mediaConstraints = {  
		mandatory: {
			OfferToReceiveAudio: false,
			OfferToReceiveVideo: false
		}
};

/** 
 * @const 
 */
var dataChannelConfiguration = {
   	ordered: false,
   	negotiated: true,
   	id: 666
};

/**
 * @constructor
 */
function PeerConnection(){
	this.connection = new RTCPeerConnection(peerConnectionConfiguration, peerConnectionOptional);
	this.connection.signalingChannel = new SignalingChannel(this);
	this.connection.isConnected = false;
	this.connection.onicecandidate = function (evt) {
		trace('--RTCPeerConnection.onicecandidate');
    	if (!this.isConnected) {
	    	if (evt.target.iceGatheringState == 'complete') {  
	    		trace('ICE candidates gathered, sending local description to peer');
	   			this.signalingChannel.send(this.localDescription);	
	   		}
    	}
    	else {
    		this.signalingChannel.send({'candidate': evt.candidate});
    	}
	};
	this.connection.onnegotiationneeded = function (evt) {trace('--RTCPeerConnection.onnegotiationneeded');};
	this.connection.onsignalingstatechange = function (evt) {trace('--RTCPeerConnection.onsignalingstatechange: ' + this.signalingState);};
	this.connection.onaddstream = function (evt) {trace('--RTCPeerConnection.onaddstream');};
	this.connection.onremovestream = function (evt) {trace('--RTCPeerConnection.onremovestream');};
	this.connection.oniceconnectionstatechange = function (evt) {trace('--RTCPeerConnection.oniceconnectionstatechange: ' + this.iceConnectionState);};
	this.connection.onicegatheringstatechange = function (evt) {trace('--RTCPeerConnection.onicegatheringstatechange: ' + iceGatheringState);};

	this.dataChannel = this.connection.createDataChannel('dc', dataChannelConfiguration);
	this.dataChannel.connection = this.connection;
	this.dataChannel.onopen = function (event) {
		trace('--RTCDataChannel.onopen');
		this.connection.isConnected = true;
	  	this.send('Hello World from ' +  /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(/a=candidate:.*/.exec(this.connection.localDescription.sdp)[0])[0] + ' (' + navigator.userAgent + ')');
	};
	this.dataChannel.onerror = function(event){trace('--RTCDataChannel.onerror');};
	this.dataChannel.onclose = function(event){trace('--RTCDataChannel.onclose');};
	this.dataChannel.onmessage = function (event) {
		trace('--RTCDataChannel.onmessage');
	  	document.getElementById('from-data-channel').value = event.data;
	};
}

PeerConnection.prototype.offerConnection = function() {
	var that = this;
	this.connection.createOffer(function(offer) {
		trace('Creating offer SDP and setting as local description');
		that.connection.setLocalDescription(offer, function(){
		}, logError);
	}, logError, mediaConstraints);
};

PeerConnection.prototype.addIceCandidate = function(sdp) {
	this.connection.addIceCandidate(new RTCIceCandidate(sdp.candidate));	
};

PeerConnection.prototype.evaluateConnection = function(sdp) {
	var that = this;
	this.connection.setRemoteDescription(new RTCSessionDescription(sdp), function () {
		trace('Setting remote rescription to received SDP');
		if (that.connection.remoteDescription.type == 'offer') {
			trace('Received SDP was a offer');
			that.connection.createAnswer(function (answer) {
				trace('Creating answer SDP and setting as local description');
				that.connection.setLocalDescription(answer, function () {
        		}, logError);
			}, logError, mediaConstraints);
		}
   	}, logError);			
};

/**
 * @constructor
 */
function SignalingChannel(connection) {
   	this.peerConnection = connection;
}
SignalingChannel.prototype.send = function(message) {
	document.getElementById('to-signaling-channel').value = JSON.stringify(message);
	document.getElementById('from-signaling-channel').value = ''
};
SignalingChannel.prototype.onmessage = function(message) {
	var data = JSON.parse(message);
	if (data.sdp) this.peerConnection.evaluateConnection(data);
	if (data.candidate) this.peerConnection.addIceCandidate(data);
};

var logError = function(error) {
	console.error(error);
};


	
