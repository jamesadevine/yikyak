var schedule = require('node-schedule');
var crypto = require('crypto');
var request = require('request');


module.exports = {
  init:function(uuid,mongoose){
    this.base_url = "https://us-east-api.yikyakapi.net/api/";
    this.user_agent = "Dalvik/1.6.0 (Linux; U; Android 4.3; Samsung Galaxy S4 - 4.3 - API 18 - 1080x1920 Build/JLS36G)";
    this.latitude =54.010394;
    this.longitude =-2.787729;

    this.YikYak = mongoose.model('YikYak',{
      "messageID":String,
       "message":String,
       "latitude":Number,
       "longitude":Number,
       "time":String,
       "numberOfLikes":Number,
       "type":String,
       "comments":Number,
       "posterID":String,
       "handle":{},
       "hidePin":String,
       "liked":Number,
       "gmt":Date,
       "reyaked":Number,
       "score":String,
       "readOnly":Number,
       "deliveryID":Number
    });
    //this.YikYak.remove().exec();

    this.get_key = "EF64523D2BD1FA21F18F5BC654DFC41B";
    this.post_key = "F7CAFA2F-FE67-4E03-A090-AC7FFF010729";
    this.user_id = '079C3CC8D0AA6F72CFE5EABF38F43737';
  },
  begin:function(){

    //this.get_yaks();

    var rule = new schedule.RecurrenceRule();

    rule.minute = [0,5,10,15,20,25,30,35,40,45,50,55];

    schedule.scheduleJob(rule, (function(self){
      return function(){
        console.log('getting yaks');
        self.get_yaks();
      };
    })(this));
  },

  register:function (uuid){
    var params = {
      "userID":this.uuid,
      "userLat":this.latitude,
      "userLong":this.longitude
    };
    this.get('registerUser',params);
  },

  get_yaks:function(){
    var params = {
      "userID":this.uuid,
      "userLat":this.latitude,
      "userLong":this.longitude
    };

    this.get('getMessages',params);

  },


  get_sign_request:function(page,params){
    var salt = String(new Date().getTime());

    var keys =[];

    for (var k in params){
      if (params.hasOwnProperty(k)){
        keys.push(k);
      }
    }

    keys.sort();
    var msg = "/api/"+page;

    if (keys.length>0)
        msg += "?";



    for (var i = 0; i < keys.length; i++){
      if(i === keys.length-1)
        msg+=keys[i]+"="+params[keys[i]];
      else
        msg+=keys[i]+"="+params[keys[i]]+"&";
    }

    console.log('IMPORTANT '+msg);


    msg+=salt;
    hash = crypto.createHmac('sha1', this.get_key).update(msg).digest('base64');

    console.log(hash,salt);

    return {hash:hash,salt:salt};
  },

  post_sign_request:function (page,params){
    var salt = String(new Date().getTime());

    var msg = "/api"+page;
    msg+=salt;
    hash = crypto.createHmac('sha1', this.post_key).update(msg).digest('base64');

    return {hash:hash,salt:salt};
  },

  get:function (page, params){

    var parent = this;

    var url = this.base_url + page+"?";

    console.log(url);

    var signed = this.get_sign_request(page, params);

    params.hash = signed.hash;
    params.salt = signed.salt;

    var headers = {
      "User-Agent": "Dalvik/1.6.0 (Linux; U; Android 4.3; Samsung Galaxy S4 - 4.3 - API 18 - 1080x1920 Build/JLS36G)",
      "Accept-Encoding": "gzip",
    };


    var keys =Object.keys(params);

    for (var i = 0; i < keys.length; i++){
      if(i === keys.length-1)
        url+=keys[i]+"="+params[keys[i]];
      else
        url+=keys[i]+"="+params[keys[i]]+"&";
    }

    console.log(url);

    request.get({url:url,headers:headers},function(e,r,body){
      var yaks = JSON.parse(body);

      for(var i=0;i<yaks.messages.length;i++)
        parent.storeYak(yaks.messages[i]);
    });

  },



  storeYak:function (yak){
    if(yak.gmt){
      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCSeconds(yak.gmt);
      yak.gmt = d;
    }
    this.YikYak.findOneAndUpdate({messageID:yak.messageID},yak, {upsert:true}, function(err, doc){

      if (err) console.log("Didn't work "+err);
    });
  },

  get_stored_yaks:function (callback){
    var query = this.YikYak.find({}).sort({'time': 'desc'}).limit(200);
    query.exec(function(err, yaks) {
      callback(yaks);
    });
  }
}