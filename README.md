# data-channel-template
minimal WebRTC data channel with manual (ctrl+c / ctrl+v) signalling channel.
don't forget to examine the javascript console.

alice: create offer => bob: receive offer & generate answer => alice: receive answer => data channel opens

tested in: chrome 41.0, firefox 36.0 (some erratic behavior of iceGatheringState), opera 27.0.