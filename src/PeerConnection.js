'use strict';
 
/** 
 * @const 
 * @private
 */
var configuration  = {
	'iceServers': [
		{'url': 'stun:stun.l.google.com:19302'}
	]
};

/** 
 * @const 
 * @private
 */
var mediaConstraints = {  
		mandatory: {
			OfferToReceiveAudio: false,
			OfferToReceiveVideo: false
		}
};

/** 
 * @const 
 * @private
 */
var dataChannelConfiguration = {
   	ordered: false,
   	negotiated: true,
   	id: 666
};

/**
 * @constructor
 * @protected 
 */
function PeerConnection(){

	this.connection = new RTCPeerConnection(configuration, {optional: [{DtlsSrtpKeyAgreement: true}]});
	//this.signalingChannel = new SignalingChannel(this);
	this.connection.signalingChannel = new SignalingChannel(this);
	this.connection.isConnected = false;
	this.dataChannel = this.connection.createDataChannel('dc', dataChannelConfiguration);
	this.dataChannel.connection = this.connection;

	this.connection.onicecandidate = function (evt) {
    	if (!this.isConnected) {
	    	if (evt.target.iceGatheringState == 'complete') {  
	   			this.signalingChannel.send(this.localDescription);	
	   		}
    	}
    	else {
    		this.signalingChannel.send({'candidate': evt.candidate});
    	}
	};
	this.dataChannel.onmessage = function (event) {
	  	var data = event.data;
	  	document.getElementById('from-data-channel').value = data;
	};
	this.dataChannel.onopen = function (event) {
		this.connection.isConnected = true;
	  	console.log('data channel opened')
	  	this.send('Hello World from ' + navigator.userAgent);
	};
	this.dataChannel.onclose = function(){console.warn('data channel closed')};
	this.dataChannel.onerror = function(){console.error('data channel error')};
}

PeerConnection.prototype.offerConnection = function() {
	var that = this;
	this.connection.createOffer(function(offer) {
		that.connection.setLocalDescription(offer, function(){
		}, that.logError);
	}, this.logError, mediaConstraints);
};

PeerConnection.prototype.addIce = function(sdp) {
	this.connection.addIceCandidate(new RTCIceCandidate(sdp.candidate));	
};

PeerConnection.prototype.evaluateConnection = function(sdp) {
	var that = this;
	this.connection.setRemoteDescription(new RTCSessionDescription(sdp), function () {
		if (that.connection.remoteDescription.type == 'offer') {
			that.connection.createAnswer(function (answer) {
				that.connection.setLocalDescription(answer, function () {
        		}, that.logError);
			}, this.logError, mediaConstraints);
		}
   	}, this.logError);			
};

PeerConnection.prototype.fakeSignal = function(data) {
	this.connection.signalingChannel.onmessage(data);
	document.getElementById('from-signaling-channel').value = ''
};

PeerConnection.prototype.logState = function() {
	document.getElementById('info').value = 'connection.iceConnectionState: ' + this.connection.iceConnectionState + '\nconnection.iceGatheringState: ' + this.connection.iceGatheringState + '\nconnection.signalingState: ' + this.connection.signalingState + '\nconnection.canTrickleIceCandidates: ' + this.connection.canTrickleIceCandidates + '\ndataChannel.readyState: ' + this.dataChannel.readyState;
};

PeerConnection.prototype.logError = function(error) {
  	console.error(error);
};

/**
 * @constructor
 * @protected 
 */
function SignalingChannel(connection) {
   	this.peerConnection = connection;
}
SignalingChannel.prototype.send = function(message) {
	var data = JSON.stringify(message);
	document.getElementById('to-signaling-channel').value = data
	document.getElementById('from-signaling-channel').value = ''
};
SignalingChannel.prototype.onmessage = function(message) {
	var data = JSON.parse(message);
	if (data.sdp) this.peerConnection.evaluateConnection(data);
	if (data.candidate) this.peerConnection.addIce(data);
};




