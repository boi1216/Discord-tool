const chalk = require("chalk")
const readline = require("readline-sync")
const fs = require("fs")
const path = require("path")
const {Client, Intents} = require("discord.js-selfbot")
const request = require("request")
var Cookie = require('request-cookies').Cookie;
const prompt = require("prompt")

const serverCache = []
const modules = []


var tokens = []
var validTokens = []
var tokenFormat
var serversLoaded = 0
var selectedServer
var debugMode = true
var logger
var tokenManager
var inviter
var settings
var settingsData

console.reset = function () {
  return process.stdout.write('\033c');
}

class Main{

constructor() {
  console.reset()
  process.title = "DM Tool (Mr Z)"
  //this.loadSettings()
  this.loadTokens()
  let gui = new GUI()
  logger = new Logger()
  inviter = new Inviter()
  tokenManager = new TokenManager()
  settings = new Settings()
}

loadTokens() {
  if(!fs.existsSync("tokens.txt")){
    fs.writeFileSync("tokens.txt", "")
  }else {
    var tokens = fs.readFileSync("tokens.txt").toString().split("\n")
    tokens.forEach(token => {
         var atmpt = token.split(":")
         if(atmpt[0] == null && atmpt[1] == null && atmpt[2] == null){
         tokenFormat = "token"
    }else { 
       var email = atmpt[0]
       if(!email.match(
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
       )){
        if(token.length < 59 || token.length > 62){
            logger.debug("Invalid token, skipping")
          }else {
            validTokens.push(token)
        }
       }else{
            if(!atmpt[2].length < 59 || !atmpt[2].length > 62){
               validTokens.push(token)
            }
       }
    }
    })
    process.title = "DM Tool (Mr Z) - " + validTokens.length + " tokens loaded | Mode: Idle"
  }
}


loadSettings() {
if(!fs.existsSync("settings.json")){
	fs.writeFileSync("settings.json", JSON.stringify(settings))
}else {
	try{
		settings = JSON.parse(fs.readFileSync("settings.json"))
	}catch(e){
		console.log("Settings file corrupted, replacing with new one...")
		fs.unlinkSync("settings.json")
		loadSettings()
	}
  }}
}
module.exports = Main

var currentMode

class Settings {

    constructor() {
      if(!fs.existsSync("settings.json")){
        console.log(JSON.stringify(this.baseSettings))
        fs.writeFileSync("settings.json", JSON.stringify({
        'inviter-delay': 100,
        'inviter-tokens': 'all',
        'inviter-bypass': false,
        'inviter-rbypass': false,
        'inviter-rbypass-channel': null,
        'inviter-rbypass-message': null,
        'inviter-rbypass-rposition': 1
      }))
      }else{
        try {
          settingsData = JSON.parse(fs.readFileSync("settings.json"))
        }catch(e) {
          console.log("Settings corrupted, replacing...")
          fs.unlinkSync("settings.json")
          fs.writeFileSync("settings.json", JSON.stringify({
        'inviter-delay': 100,
        'inviter-tokens': 'all',
        'inviter-bypass': false,
        'inviter-rbypass': false,
        'inviter-rbypass-channel': null,
        'inviter-rbypass-message': null,
        'inviter-rbypass-rposition': 1
      }))
        }
      }
    }

    getAll() {
      return settingsData
    }

    getValue(value) {
      return settingsData[value]
    }

    updateValue(key, newValue) {
      if(newValue != true && newValue != false){
        newValue = newValue.replace(/(\r\n|\n|\r)/gm, "");
      }
      settingsData[key] = newValue
      fs.writeFileSync('settings.json', JSON.stringify(settingsData))
    }

    boolToStat(bool) {
      if(bool == true){
        return chalk.green("ON")
      }else{
        return chalk.red("OFF")
      }
    }

    statOpposite(bool){
      if(bool == true){
        return false
      }else {
        return true
      }
    }

    baseSettings() {
      return {
        'inviter-delay': 100,
        'inviter-tokens': 'all',
        'inviter-bypass': false,
        'inviter-rbypass': false,
        'inviter-rbypass-channel': null,
        'inviter-rbypass-message': null,
        'inviter-rbypass-rposition': 1
      }
    }

}

var skipEvents = 0


class GUI {

  constructor() {
        this.sendMain()
        this.read()
  }

  sendMain() {
      console.clear()
      console.log(chalk.red("[1]") + chalk.white(" Token manager"))
      console.log(chalk.red("[2]") + chalk.white(" Inviter"))
      console.log(chalk.red("[3]") + chalk.white(" User scraper"))
      console.log(chalk.red("[4]") + chalk.white(" Mass DM"))
      console.log(chalk.red("[5]") + chalk.white(" Exit (CTRL+C)"))
      currentMode = "main"
  }

  read() {
        const readlineModule = require('readline');
        readlineModule.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.on('data', (data) => {
          if(currentMode == "in-prompt-ivmsc"){
            skipEvents = data.length
            if(!isNaN(data)){
               settings.updateValue('inviter-delay', data.toString())
            }
            this.sendIV()
            process.stdin.setRawMode(true)
            
          }else if(currentMode == "in-prompt-ivtkn"){
            skipEvents = data.length
            if(isNaN(data)){
              if(data.includes("all")){
                settings.updateValue('inviter-tokens', 'all')
              }
            }else {
              settings.updateValue('inviter-tokens',data.toString().replace(/(\r\n|\n|\r)/gm, ""))
            }
            this.sendIV()
            process.stdin.setRawMode(true)
          }else if(currentMode == "in-prompt-ivrbp-c"){
            skipEvents = data.length
            if(data.toString().length > 15 && !isNaN(data)){
              settings.updateValue('inviter-rbypass-channel',data.toString().replace(/(\r\n|\n|\r)/gm, ""))
            }
             process.stdin.setRawMode(true)
             this.sendIVrbp()
          }else if(currentMode == "in-prompt-ivrbp-m"){
            skipEvents = data.length
            if(data.toString().length > 16 && !isNaN(data)){
              settings.updateValue('inviter-rbypass-message', data.toString().replace(/(\r\n|\n|\r)/gm, ""))
            }
            process.stdin.setRawMode(true)
            this.sendIVrbp()
          }else if(currentMode == "in-prompt-ivrbp-r"){
            skipEvents = data.length
            if(data.toString().length >= 1 && data.toString().length < 5 && !isNaN(data)){
              settings.updateValue('inviter-rbypass-rposition', data.toString().replace(/(\r\n|\n|\r)/gm, ""))
            }
            process.stdin.setRawMode(true)
            this.sendIVrbp()
          }else if(currentMode == "in-prompt-ivlnk"){
           skipEvents = data.length
         //  console.log("Link selected: " + data.toString())
           inviter.startInviting(data.toString(), validTokens)
             console.clear()

          }
        })
        process.stdin.on('keypress', (charater, key) => {
        if(key['name'] == "c" && key['ctrl'] == true){
          process.exit(1)
        }
        if(currentMode == "main"){
           if(charater == 1){
            this.sendTM()
           }else if(charater == 5){
            process.exit(1)
           }else if(charater == 2){
              this.sendIV()
           }
        }else if(currentMode == "tm"){
           if(charater == 1){
            console.clear()
            logger.log("Checking started...")
            currentMode = "checking"
            var invalid = tokenManager.checkLive(validTokens)
           }else if(charater == 4){
             this.sendMain()
           }
        }else if(currentMode == "tm-exit"){
           if(charater == "x"){
                this.sendTM()
           }
           
        }else if(currentMode == "iv"){
           if(!skipEvents){
           if(charater == 1){
              console.clear()
             //inviter.startInviting("https://discord.gg/VXHNKCUs", validTokens)
             currentMode = "in-prompt-ivlnk"
             console.log("Invite link (or just code): ")
             process.stdin.setRawMode(false)
           }else if(charater == 6){
              this.sendMain()
           }else if(charater == 4){
              currentMode = "in-prompt-ivmsc"
              console.clear()
              console.log("Delay in milliseconds (100-5000): ")
              process.stdin.setRawMode(false) 
            }else if(charater == 5){
              currentMode = "in-prompt-ivtkn"
              console.clear()
              console.log("Amount of tokens to use (1-" + validTokens.length + " | all):")
              process.stdin.setRawMode(false)
            }else if(charater == 3){
              settings.updateValue('inviter-bypass', settings.statOpposite(settings.getValue('inviter-bypass')))
              this.sendIV()
            }else if(charater == 2){
              this.sendIVrbp()
            }
          }else{
            skipEvents = false
          }
        }else if(currentMode == "inviting-fn"){
          if(charater == "x"){
             this.sendIV()
          }
        }else if(currentMode == "iv-rbp"){
          if(skipEvents <= 0){
            skipEvents = 0
          if(charater == 5){
            this.sendIV()
          }else if(charater == 1){
            settings.updateValue('inviter-rbypass', settings.statOpposite(settings.getValue('inviter-rbypass')))
            this.sendIVrbp()
          }else if(charater == 2){
            currentMode = "in-prompt-ivrbp-c"
            console.clear()
            console.log("Channel ID:")
            process.stdin.setRawMode(false)
          }else if(charater == 3){
            currentMode = "in-prompt-ivrbp-m"
            console.clear()
            console.log("Message ID:")
            process.stdin.setRawMode(false)
          }else if(charater == 4){
            currentMode = "in-prompt-ivrbp-r"
            console.clear()
            console.log("Position:")
            process.stdin.setRawMode(false)
          }
          }else{
            skipEvents--
          }
        }
     })
  }

  sendTM() {
    currentMode = "tm"
    console.clear()
    console.log(chalk.red("[1]") + chalk.white(" Live checker"))
    console.log(chalk.red("[2]") + chalk.white(" Name/Picture changer"))
    console.log(chalk.red("[3]") + chalk.white(" Stats (DM's sent, joined guilds)"))
    console.log(chalk.red("[4]") + chalk.white(" Back"))
  }

  sendIV(){
    currentMode = "iv"
    console.clear()
    console.log(chalk.red("[1]") + chalk.white(" Start inviting"))
    console.log(chalk.red("[2]") + chalk.white(" Reaction bypass"))
    console.log(chalk.red("[3]") + chalk.white(" Complete steps bypass: ") + settings.boolToStat(settings.getValue('inviter-bypass')))
    console.log(chalk.red("[4]") + chalk.white(" Delay: " + settings.getValue('inviter-delay') + "ms"))
    console.log(chalk.red("[5]") + chalk.white(" Tokens used: " + settings.getValue('inviter-tokens')))
    console.log(chalk.red("[6]") + chalk.white(" Back"))
  }

  sendIVrbp(){
    currentMode = "iv-rbp"
    console.clear()
    console.log(chalk.red("[1]") + chalk.white(" Status: ") + settings.boolToStat(settings.getValue('inviter-rbypass')))
    console.log(chalk.red("[2]") + chalk.white(" Channel ID: ") + chalk.yellow(settings.getValue('inviter-rbypass-channel')))
    console.log(chalk.red("[3]") + chalk.white(" Message ID: ") + chalk.yellow(settings.getValue('inviter-rbypass-message')))
    console.log(chalk.red("[4]") + chalk.white(" Reaction position: " + chalk.yellow(settings.getValue('inviter-rbypass-rposition'))))
    console.log(chalk.red("[5]") + chalk.white(" Back"))
  }
}

class Network {

}

class TokenManager {
   
   async checkLive(tokens) {
      var invalid = []
      var checked = 0
      var live = 0
      var dead = 0
      tokens.forEach(token  => {
      token = token.replace(/(\r\n|\n|\r)/gm, "");
      return new Promise((resolve, reject) => {
        request({
          url: encodeURI("https://discord.com/api/v9/channels/929649266362666666/messages/123/reactions/🎉/@me"),
          method: 'PUT',
          headers: {
            'Authorization': token,
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36`,
            'Connection': 'keep-alive',
            'Accept-Encoding': '',
            'Accept-Language': 'en-US,en;q=0.8'
          }
        }, (err, res, body) => {
          if(err){
            return
          }

          if(JSON.parse(body)['code'] == 10003){
             logger.log(chalk.green("LIVE: ") + chalk.white(token))
             live++
          }else if (JSON.parse(body)['code'] == 0 || JSON.parse(body)['code'] == 40002){
             logger.log(chalk.red("DEAD: ") + chalk.white(token))
             invalid.push(token)
             dead++
          }
          checked++
          process.title = "Status: Checking | Dead: " + dead + " | Live: " + live + " | Checked: " + checked + "/" + tokens.length
          if(checked == tokens.length){
             currentMode = "tm-exit"
             logger.log(chalk.green((tokens.length - invalid.length) + "/" + tokens.length +  " tokens is valid"))
             logger.log("Press X to exit")
            
          }

          //hacky fix to avoid rate limit
          var waitTill = new Date(new Date().getTime() + 1 * 630);
          while(waitTill > new Date()){}
        })
      })
   })
    }
}

class Inviter{
    
    async startInviting(link, tokens) {
      var __dcfduid
      var __sdcfduid
      var fingerprint

      currentMode = "inviting"
      var toHandle = tokens.length
      for(var token of tokens){
      token = token.replace(/(\r\n|\n|\r)/gm, "");

      await this.getCookies().then(cookies => {
        __dcfduid = cookies['__dcfduid']
        __sdcfduid = cookies['__sdcfduid']
      })
      await this.getFingerprint().then(fp => {
        fingerprint = fp
      })

      if(__dcfduid == null || __sdcfduid == null){
        console.log("ERROR: No cookies")
      }
      if(fingerprint == null){
        console.log("ERROR: No fingerprint")
      }
     
      request({
          url: encodeURI("https://discord.com/api/v9/invites/VXHNKCUs"),
          method: 'POST',
          headers: 
            this.baseHeaders(fingerprint, token, __dcfduid, __sdcfduid),
            json: {}
         }, (err, res, body) => {
             if(body == 'error code: 1015'){
              console.log(chalk.red("Connection rate limited! Rotating..."))
             }
             console.log(body)
             if(body['code'] == 40002){
                console.log(chalk.red("[ERROR] Failed to join " + link + ", token requires verification ") + chalk.white("[TOKEN: " + token + "]"))
             }else if(body['guild'] != null){
                currentMode = "inviting-fn"
                console.log(chalk.green("[INFO] Guild joined succesfully  ") + chalk.white("[TOKEN: " + token + "]"))
             if(settings.getValue('inviter-rbypass') == true){
              var channelID = settings.getValue('inviter-rbypass-channel')
              var messageID = settings.getValue('inviter-rbypass-message')
              var position = settings.getValue('inviter-rbypass-rposition')
              this.getChannel(channelID.toString(), token).then(result => {
                var parsed = JSON.parse(result)
                if(parsed['code'] == 10003){
                    console.log(chalk.red("Reaction bypass ERROR: " + parsed['message']))
                }

                this.getMessages(channelID, token).then(res => {
                  console.log(res)
                  var msgs = JSON.parse(res)
                  if(msgs['code'] != 0){
                  for(var msg of msgs) {
                    if(msg.id == messageID){
                       if(msg.reactions != null){
                          if(msg.reactions[position - 1]  != null){

                            this.bypassReaction(channelID, messageID, token).then(result => {
                              if(result == true){
                                console.log(chalk.green("[INFO] Reaction bypass SUCCESS ") + chalk.white("[Message ID: " + messageID + "]"))
                              }
                            })
                          }else{
                            console.log(chalk.red('Reaction bypass ERROR: Invalid position'))
                          }
                       }else{
                        console.log(chalk.red('Reaction bypass ERROR: No reactions'))
                       }
                      // console.log(msg)
                    }
                  }
                  }
                })


              })

             }
           }
       })


        
    }
  }

  async getChannel(channelID, token) {
   return new Promise((resolve, reject) => {

   request({
          url: encodeURI("https://discord.com/api/v9/channels/" + channelID),
          method: 'GET',
          headers: 
            {'Authorization': token}
         }, (err, res, body) => {
            //  console.log(body)
              resolve(body)
         })
    })
  }

  async getMessages(channelID, token) {
     return new Promise((resolve, reject) => {
     request({
          url: encodeURI("https://discord.com/api/v9/channels/" + channelID + "/messages"),
          method: 'GET',
          headers: 
            {'Authorization': token}
         }, (err, res, body) => {
            //  console.log(body)
              resolve(body)
         })
    })
  }

  bypassReaction(channelID, messageID, token) {
    return new Promise((resolve, reject) => {
     request({
          method: 'PUT',
          url: encodeURI("https://discord.com/api/v9/channels/" + channelID + "/messages/" + messageID + "/reactions/✅/@me"),
          headers: {
            'Authorization': token,
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36`,
            'Connection': 'keep-alive',
            'Accept-Encoding': '',
            'Accept-Language': 'en-US,en;q=0.8'
          }
         }, (err, res, body) => {
              if(!err){
                resolve(true)
              }
         })
    })
  }

  getFingerprint(token) {
      return new Promise((resolve, reject) => {
      request.get('https://discord.com/api/v9/experiments', function(err, response, body) {
          if(err){
            console.log(err)
          }
         // console.log(body)
          var parsed = JSON.parse(body)
          resolve(parsed['fingerprint'])
      })
     })
   }

   getCookies() {
       return new Promise((resolve, reject) => {
       request.get('http://discord.com', function(err, response, body) {
             var rawcookies = response.headers['set-cookie'];
             var __dcfduid
             var __sdcfduid
             var o = 0
             for (var i in rawcookies) {
                var cookie = new Cookie(rawcookies[i]);
                if(cookie.key == "__dcfduid"){
                   __dcfduid = cookie.value
                   o++
                }
                if(cookie.key == "__sdcfduid"){
                  __sdcfduid = cookie.value 
                    o++
                }
                if(o == 2){
                   resolve({__dcfduid, __sdcfduid})
                }
                
             }
        });
     })
   }

   baseHeaders(fingerprint, token, __dcfduid, __sdcfduid) {
      return {
          'Authorization': token,
          'accept': '*/*',
          'Connection': 'keep-alive',
        //  'accept-encoding': "gzip, deflate, en-GB",
          'accept-language': "en-GB",
          'content-type': "application/json",
          'X-Debug-Options': "bugReporterEnabled",
          'cache-control': "no-cache",
          'sec-ch-ua': "'Chromium';v='92', ' Not A;Brand';v='99', 'Google Chrome';v='92'",
          'sec-fetch-site': "same-origin",
          'x-context-properties': "eyJsb2NhdGlvbiI6IkpvaW4gR3VpbGQiLCJsb2NhdGlvbl9ndWlsZF9pZCI6Ijg4NTkwNzE3MjMwNTgwOTUxOSIsImxvY2F0aW9uX2NoYW5uZWxfaWQiOiI4ODU5MDcxNzIzMDU4MDk1MjUiLCJsb2NhdGlvbl9jaGFubmVsX3R5cGUiOjB9",
          'x-super-properties': "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRmlyZWZveCIsImRldmljZSI6IiIsInN5c3RlbV9sb2NhbGUiOiJlbi1VUyIsImJyb3dzZXJfdXNlcl9hZ2VudCI6Ik1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQ7IHJ2OjkzLjApIEdlY2tvLzIwMTAwMTAxIEZpcmVmb3gvOTMuMCIsImJyb3dzZXJfdmVyc2lvbiI6IjkzLjAiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6IiIsInJlZmVycmluZ19kb21haW4iOiIiLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6MTAwODA0LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "origin": "https://discord.com",
          "referer": "https://discord.com/channels/@me",
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.16 Chrome/91.0.4472.164 Electron/13.4.0 Safari/537.36",
          "te": "trailers",
          "fingerprint": fingerprint,
          'Cookie': "__dcfduid=" + __dcfduid + "; __sdcfduid=" + __sdcfduid + "; locale=us)"
      }
   }

   bypassGuild(guild) {

   }

   validateInvite() {
      //TODO: ONLY CHECK REGEX
   }
}

class MassDM{
   

   bypassMessage() {

   }


}

class Bypasser{

}

class Logger {

  debug(message) {
     console.log(chalk.red("[DEBUG] " + message))
  }

  log(message) {
    console.log("[INFO] " + message)
  }
}


