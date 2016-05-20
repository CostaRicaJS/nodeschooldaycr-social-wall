'use strict';


let notificationsChannel;
const Twitter = require('twit');
const request = require('request');
let stream;
let twitter;
let youtubeKey;
let managers;

let hashTags = process.env.HASHTAGS ? process.env.HASHTAGS.split(',') : ['javascript', 'nodejs'];
let youtubeKeywords = hashTags.join('|');

let instagram = require('instagram-node').instagram();

function setupInstagramSubscriptions(options, server) {

  instagram.use({
    client_id: options.client_id,
    client_secret: options.client_secret
  });

  const tag = hashTags[0];

  instagram.add_tag_subscription(
    'love',
    'http://nodeschooldaycr16.costaricajs.co/api/v1/publish/photo',
    {
      verify_token: options.verify_token
    },
    (err, result, remaining, limit) => {
      console.log(err);
    }
  );

  instagram.subscriptions(function(err, subscriptions, remaining, limit){
    console.log(subscriptions);
  });

  server.expose('instagram', instagram);

}

function setupNotificationsChannel() {

  notificationsChannel.on('connection', (socket)=> {

    console.log(' *** onConnection to ---> ', 'notification Id: ', socket.id);

    socket.emit('identification',
      {
        status: 'ok',
        type: 'identification',
        id: socket.id
      }
    );

    socket.on('disconnect', function () {

      console.log(' *** onDisconnect to ---> ', 'notification');

    });

    socket.on('addToRoom', function (roomName) {

      socket.join(roomName);

      console.log(' *** onAddToRoom ---> ', roomName);

    });

    socket.on('removeFromRoom', function (roomName) {

      socket.leave(roomName);

      console.log(' *** onRemoveFromRoom ---> ', roomName);

    });

    socket.on('connect_error', function (error) {

      socket.leave(roomName);

      console.log(' *** onRemoveFromRoom ---> ', roomName);

    });

  });
}

function activate(utils, options, server) {

  managers = utils;

  notificationsChannel = managers.io.of('/notifications');

  setupNotificationsChannel();

  twitter = new Twitter(options.twitter);

  //stream = twitter.stream('statuses/filter', { track: 'mario' });
  stream = twitter.stream('statuses/filter', {track: hashTags});

  stream.on('tweet', function (tweet) {
    const lightTweet = {
      text: tweet.text
    };
    notificationsChannel.emit('tweet', tweet);
  });

  youtubeKey = options.youtube.auth.key;

  fetchYoutube();
  //setInterval(fetchYoutube, 1000 * 60 * 10);

  setupInstagramSubscriptions(options.instagram, server);

}

function fetchYoutube() {

  managers.youtube.search.list({
    part: 'id,snippet',
    q: youtubeKeywords,
    key: youtubeKey
  }, function (err, data) {
    if (err) {
      console.error('Error: ' + err);
    } else {
      console.log('youtube fetch');
      notificationsChannel.emit('youtube', data);
    }

  });
}

const channels = {
  activate: activate
};

module.exports = channels;
