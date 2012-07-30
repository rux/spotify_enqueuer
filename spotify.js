Songs = new Meteor.Collection("songs");
Results = new Meteor.Collection(null); // null means local collection, not synced

function addSpotifySong(spotifySongId) {
  Meteor.http.get("http://ws.spotify.com/lookup/1/.json",
    {params: {"uri": spotifySongId}},
    function (error, result) {
      console.log(result);
      var res = result.data.track;
      if (Songs.findOne({name:res.name}) ) {
        console.log("updating votes");
        Songs.update( {name: res.name }, { $inc: {votes:1}});
      } else {
        Songs.insert( {name:res.name, votes:1, track: res} );
      }
    }
  );
}


if (Meteor.is_client) {
  Template.hello.greeting = function () {
    return "Welcome to spotify voting.";
  };

  Template.hello.songs = function () {
    return Songs.find({}, {sort: {votes: -1, name: 1}});
  };

  Template.hello.search_results = function() {
    var results = Results.find();
    if (results.count() === 0) {
      return false;
    }
    return results;
  };

  Template.hello.events = {
    'click #add' : function () {
      Results.remove({});
      if (q.value) {
        Meteor.http.get("http://ws.spotify.com/search/1/track.json",
          {params: {"q": q.value}},
          function (error, result) {
            console.log(result);
            if (result.data.info.num_results == 1) {
              console.log("single result");
              var singleResult = result.data.tracks[0];
              addSpotifySong(singleResult.href);
            } else if (result.data.info.num_results > 1) {
              console.log(result.data.info.num_results + " results for " + q.value);
              var tracks = result.data.tracks;
              for (var track in tracks) {
                song = tracks[track];
                Results.insert( {name: song.name, track:song, is_search_result:true});
              }
            } else {
              alert("No track by that name");
            }
          }
        );
      }
    },

    'click #clear': function()  {
      Songs.remove({});
    }

  };


  Template.song.events = {
    'click .song' : function () {
      Songs.update(this._id, {$inc: {votes:1} });
    },
    'click .enqueue' : function() {
      addSpotifySong(this.track.href);
      Results.remove({});
    }
  };

  Template.song.popularity_percent = function() {
    return parseInt(this.track.popularity * 100, 10);
  };
  Template.song.popularity_percent_inverse = function() {
    return parseInt(100 - this.track.popularity * 100, 10);
  };




}

if (Meteor.is_server) {
  Meteor.startup(function () {


        // code to run on server at startup
  });
}