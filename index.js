/*
Ti - Heroes Over Legends, et al. (Heroes Over All)
Official Discord Bot, No. 1

(C) Copyright 2021+ Austen-Dale. All Rights Reserved

No duplication, no modification, no nothing. Fah Q.

*/

//Main Imports
const Discord = require("discord.js");
const { MessageEmbed } = require('discord.js');
const config = require("./config.json"); //Only contains the token, and nothing but.
const fs = require('fs');
const path = require('path');
const TailingReadableStream = require('tailing-stream');
const { spawn } = require('child_process');

//Important Initialization
const directoryPathOne = path.join(__dirname, '/../data');
const directoryPathTwo = path.join(directoryPathOne, 'User_Data');

//Constants
const prefix = "!";
const guildMembers = [
    'Gods', 
    'Austenthefirst',
    'Overdrawn',
    'Staryx',
    'Pink',
    'Fish',
    'Budock',
    'Morenos',
    'Morena',
    'Krayse',
    'Demeter',
    'Benazz',
    'Monsoon',
    'Khoz',
    'Ftw',
    'Ygg',
    'Confidor',
    'Fylakris',
    'Jinzo',
    'Cross',
    'Bryte',
    'Spectre',
    'Maniacmanik',
    'Vertam',
    'Okhand'
];



//State
var lastDataPacket = []
var lastLineFull = "NA";
var lastLine = "NA";
var lastSent = "NA";
var lastGuildie = 'NA';
var lastIdRead = '';
var lastIdSent = '';
var dataPacketNo = 0;
var lowestScore = 99990;
var lowestEarner = 'TiBot';
var amIBusy = false;
var lastPlayerInteractedWith = '';
var lastPlayerInvited = '';
var lastPlayerToMessageMe = '';
var restarting = false;

if (lowestEarner === "TiBot") {
    openLogFile()
}

function determineMessageType(str) {
    //console.log('Determining Message Type!');
    //console.log(lastLineFull);
    var messageType = str.split(' ')[1];;
    if (messageType === '(User)'){ 
        messageType = str.split(' ')[2];
        if (messageType[0] !== '(') {
            messageType = "(Guild)";
            console.log('overridetype')
        }
    } else {
        messageType = str.split(' ')[1];
    }
    //console.log('Message type determined to BE: ' + messageType)
    return messageType;
}

function determineChannel(str) {
    let msgType = determineMessageType(str);
    //console.log('Determining channel for the msgType ' + msgType);
    var channelId = '';

    switch (msgType){
        case '(System)':
            channelId = '889290227204636692';
        break;

        case '(User)':
            channelId = '';
        break;

        case '(tosser)':
            channelId = '';
        break;

        case '(help)':
            channelId = '889904568488566784';
        break;

        case '(sanctuary)':
            channelId = '889904568488566784';
        break;

        case '(aebros)':
            channelId = '889904568488566784';
        break;

        case '(Tell)':
            channelId = '888177162568470580';
        break;

        case '(Say)':
            channelId = '888177162568470580';
        break;

        case '(Guild)':
            channelId = '890617783258324992';
        break;

        default:
        break;

    }

    return channelId;
} 

// --> Main entry
fs.readdir(directoryPathTwo, function(err, files) {
    if (err) { throw err; }
    todaysFile = getNewestFile(files, directoryPathTwo)
    console.log('TiBot reading from ' + todaysFile)

    let finalBoss = path.join(directoryPathTwo, todaysFile);
    const stream = TailingReadableStream.createReadStream(finalBoss, { timeout: 0 });
    const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })

    // && lastIdRead !== lastIdSent was removed from the following entry IF statement in the interval
    // This function reiterates every 250 ms and checks if there has been a new message.
    setInterval(() => {

        if (lastDataPacket.length > 0 && dataPacketNo > 1 && !amIBusy) {
            console.log('Found full DataPacket...');
            console.dir(lastDataPacket);

            lastDataPacket.forEach(function(v, i) {

                let wasChatLogClosed = ((v.indexOf('Chat Log Closed') > -1) || ((v.indexOf("Left the") > -1) && (v.indexOf("Server") > -1)));

                if (wasChatLogClosed) {
                    relaunchGame();
                }

                var determinedChannel = determineChannel(v)

                if (determinedChannel.length > 1) {
                    var determinedType = determineMessageType(v)

                    console.log('determinedMessageType is ' + determinedType)
                    client.channels.fetch(determinedChannel).then((channel) => {
                        if (determinedType == "(System)") {
                            if (checkIfGuildMemberWasKilled(v)) {
                                lastGuildie = checkIfGuildMemberWasKilled(v);
                                console.log('Trying to send to channel ID ' + determinedChannel);
                                let split = v.split(" "); //Split data stream up by SPACES
                                let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                                let joined = split.join(" "); // Reconstruct the array with a space as the seperator
                                console.log(v);
                                console.log(splice);
                                console.log(joined);
                                channel.send({embeds: [prepareEmbed(joined)]})
                                lastSent = joined;   
                                lastIdSent = lastIdRead;
                                console.log('Just attempted to send message ID ' + lastIdSent);
                            } else {
                                console.log('Not a guildie, ignoring')
                            }
                        } else if (determinedType === "(Tell)"){
                            // gonna handle party invites, yo

                            console.log('Attempting to parse tell request...');
                            console.log(v)

                            let split = v.split(" "); //Split data stream up by SPACES
                            let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                            let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                            
                            let splitTell = joined.split(":");
                            let sender = splitTell[0];

                            let msg = splitTell[1];
                            let msgSplit = msg.split(" ").filter(n => n);

                            console.dir(msgSplit);

                            var toInvite = ''

                            switch (msgSplit.length) {
                                case 2:
                                    toInvite = msgSplit[1];
                                break;

                                case 1:
                                    toInvite = sender;
                                break;

                                default:
                                break;
                            }

                            let finalInvite = toInvite.replace(" ", "-");
                            sendInGameInvite(finalInvite);                         
                            lastPlayerInvited = finalInvite;   
                            lastPlayerToMessageMe = sender;

                        } else if (determinedType === "(Say)"){

                            let split = v.split(" "); //Split data stream up by SPACES
                            let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                            let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                            
                            let isInCombat = (joined.indexOf('combat mode') > -1);
                            let isAlreadyInPt = (joined.indexOf('already in') > -1);
                            let isNowOffline = (joined.indexOf('offline') > -1);
                            let isNowOnline = (joined.indexOf('online') > -1);
                            let isSelfInvite = (lastPlayerInvited == lastPlayerToMessageMe);


                            if (isInCombat) {
                                if (!isSelfInvite) {
                                    sendInGameTellMessage(lastPlayerInvited,`${lastPlayerToMessageMe}-asked-me-to-send-you-a-party-invite-but-you-seem-to-be-in-combat-mode.`)
                                } else {
                                    sendInGameTellMessage(lastPlayerInvited,'Drop-combat-noob');
                                }
                            }

                            if (isAlreadyInPt) {
                                if (isSelfInvite) {
                                    sendInGameTellMessage(lastPlayerInvited,'We-seem-to-already-be-in-a-party.-Did-you-mean-to-invite-someone-else?');
                                } else {
                                    sendInGameTellMessage(lastPlayerInvited,'We-seem-to-already-be-in-a-party.-Did-you-mean-to-invite-someone-else?');
                                }
                            }

                        } if (determinedType === "(aebros)"){
                          
                            
                            console.log('Attempting to parse aebros msg...');
                            console.log(v)

                            let split = v.split(" "); //Split data stream up by SPACES
                            let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                            let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator

                            let type = determineMessageType(v);
                            let type2 = type.replace("(","[");
                            let type3 = type2.replace(")","]");

                            if (v.indexOf(":") > -1) {
                                let splitTell = joined.split(":");
                                let sender = splitTell[0];
                                let realSender = sender.split(" ")[1]
    
                                let msg = splitTell[1];
    
                                console.dir(msg);
                                console.dir(realSender);
    
                                if (msg == "!pt") {
                                    sendInGameInvite(realSender)
                                }
                                
                            }
                            
                            channel.send(`${joined}`);
                            lastSent = `${type3} ${joined}`;   
                            lastIdSent = lastIdRead;
                            console.log('Just attempted to send message ID ' + lastIdSent);

                        } else {
                            let split = v.split(" "); //Split data stream up by SPACES
                            let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                            let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator

                            console.log(joined);
                            let isNowOffline = (joined.indexOf('offline') > -1);
                            let isNowOnline = (joined.indexOf('online') > -1);
                            console.log(`${isNowOffline} ${isNowOnline}`);
                            let type = determineMessageType(v);
                            let type2 = type.replace("(","[");
                            let type3 = type2.replace(")","]");
                            console.log(`${type} ${type2} ${type3}`);
                            var name = split[0];

                            if (name === "Pink") {
                                name = "Pink-Fish";
                            }

                            if (isNowOnline) {
                                sendInGameInvite(name)
                            }
                            if (determinedType === "(Guild)" || isNowOffline || isNowOnline) {
                                channel.send(`${joined}`);
                                lastSent = `${type3} ${joined}`;   
                                lastIdSent = lastIdRead;
                                console.log('Just attempted to send message ID ' + lastIdSent);
                            }

                        }
                    })
                }
            });
            lastDataPacket = [];
        } else {
            if (dataPacketNo === 1) {
                let lastLine = lastDataPacket[(lastDataPacket.length-1)]
                let wasChatLogClosed = ((lastLine.indexOf('Chat Log Closed') > -1) || ((lastLine.indexOf("Left the") > -1) && (lastLine.indexOf("Server") > -1)));

                if (wasChatLogClosed) {
                    relaunchGame();
                    dataPacketNo++
                    lastDataPacket = [];
                }
                
            }
        }
    }, 250);
    
    stream.on('data', async buffer => {
        console.log(' '); //Print blank line, acts as a spacer
        console.log(buffer.toString().trim()); //What's in the data buffer?
        if (buffer.toString().length > 1) { 
            lastDataPacket = [];
            dataPacketNo++;
            lastLineFull = buffer.toString();
            let lines = lastLineFull.split('\r\n');
            console.log('Going over ' + lines.length + ' lines...');

            lines.forEach(function(v, i) { 
                console.log('Iterating over line: ' + v);
                let split = v.split(" "); //Split data stream up by SPACES
                if (split.length > 1) {
                    let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                    let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                    lastLine = v;
                    lastIdRead = splice[0];
                    lastDataPacket.push(v);
                }
            });
            //if (hasLeft === false) {

            //}
            console.log('Finished DataPacket:');
            console.dir(lastDataPacket);
        }
    });


    // Ping Pong Function
    client.on('messageCreate', async message => {

        var dscrdMsg = message;

        if (message.author.bot) return;
        if (!message.content.startsWith(prefix) && message.channelId !== "890617783258324992") return;
    
        const attachment = message.attachments.first()
        const commandBody = message.content.slice(prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();
        let whereFrom = message.channelId;
        let whoFrom = message.author.tag.split('#')[0];

        if (message.channel.type === 'GUILD_TEXT') {
            client.channels.fetch(whereFrom).then((channel) => {
//                console.log('Lowest Score: ' + lowestScore);
//                console.log('Time Taken: ' + timeTaken);
                if (command === "ping") {
                    const timeTaken = Date.now() - message.createdTimestamp;
                    if (timeTaken < lowestScore) {
                        lowestScore = timeTaken;
                        lowestEarner = whoFrom;
                        createLogFile();
                    }
                    channel.send(`Pong! This message had a latency of ${timeTaken}ms. (Best Score: ${lowestScore}ms from ${lowestEarner})`)
                }   

                if (command === "invite" || command === 'expel') {
                    console.log(command + ' COMMAND RECEIVED FOR ' + commandBody)

                    if (!amIBusy) {

                        amIBusy = true;

                        const pythonProcess = spawn('python',["entertext.py", command, args]);
                        channel.send(`${args} will be sent a party invitation.`)

                        pythonProcess.on('close', (code) => {
                            amIBusy = false;
                        })
                    }
                    else {
                        channel.send(`Do you mind, ${message.member.displayName}? Can't you see I'm busy?`);
                    }
                }

                if (message.channelId == "890617783258324992") {

                    console.log('message received in guild chat');

                    if (command === "guild" && !amIBusy) {
                        console.log(command + ' COMMAND RECEIVED FOR ' + commandBody)

                        let split = commandBody.split(" ");
                        let splice = split.splice(0,1); // Remove the first 2 elements of the array, which is the ID and channel
                        let joined = split.join("-", split); // Reconstruct the array with a space as the seperator
                        console.dir(split)
    
                        let comment = "["+message.member.displayName+ ']-' + joined;

                        let finalComment = comment.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '');

                        dscrdMsg.reply('Please wait...')
                        .then(msg => {
                            setTimeout(function(){
                                 msg.delete()
                                 dscrdMsg.delete();
                            }, 1000)
                        })

                        amIBusy = true;
    
                        const pythonProcess = spawn('python',["entertext.py", command, finalComment]);
    
                        pythonProcess.on('close', (code) => {
                            amIBusy = false;
                        })
                    } else {
                        console.log('No Command Received');

                        if (!command !== "guild") {
                            dscrdMsg.reply('Please use the !guild prefix. Self destructing...')
                            .then(msg => {
                                setTimeout(function(){
                                     msg.delete()
                                     dscrdMsg.delete();
                                }, 2500)});
                        } else {
                            channel.send(`Do you mind, ${message.member.displayName}? Can't you see I'm busy?`);
                        }
                    }

                }

                if (command === "guild" && message.channelId != "890617783258324992") {
                    channel.send(`Hey ${message.member.displayName}, that's not a valid command in this channel. Try` + 
                    message.guild.channels.cache.get('890617783258324992').toString());
                }

                if (command === "send") {
                    console.log(command + ' COMMAND RECEIVED FOR ' + commandBody)

                    let towhere = args[0]
                    let towhat = args[1];
                    let sendargs = `${towhere} ${towhat}`
                    
                    const pythonProcess = spawn('python',["entertext.py", sendargs]);

                }

            })
        }
    });
    
    client.login(config.BOT_TOKEN);
});

async function sendInGameTellMessage(player,message) {
    console.log(player + ' TELL RECEIVED TO SEND ' + message)

    if (!amIBusy) {
        let split = message.split(" ");
        let splice = split.splice(0,1); // Remove the first 2 elements of the array, which is the ID and channel
        let joined = split.join("-", split); // Reconstruct the array with a space as the seperator
        console.dir(split)

        amIBusy = true;


        let tellString = `t-${player}:`


        const tellProcess = spawn('python',["entertext.py", tellString, message]);

        tellProcess.on('close', (code) => {
            amIBusy = false;
            return code;
        })
    } else {

    }
}

async function sendInGameInvite(player) {
    console.log('INVITE REQUESTED FOR' + player)

    if (!amIBusy) {
        amIBusy = true;

        let inviteProcess = spawn('python',["entertext.py", 'invite', player]);

        inviteProcess.on('close', (code) => {
            amIBusy = false;
            return code;
        })
    } else {

    } 
}

async function relaunchGame() {
    console.log('GAME RESTART REQUESTED')

    if (!amIBusy && !restarting) {
        console.log('PROCEEDING WITH RESTART...');
        amIBusy = true;
        restarting = true;

        let relaunchProcess = spawn('python',["loginscript.py"]);

        relaunchProcess.on('close', (code) => {
            setTimeout(function () {
                process.exit();
            }, 75000);
        })
    } else {
        console.log('NOT PROCEEDING WITH RESTART!!!')
    } 
}

// TO DO
/*
- Add chatlogs to physical file instead of lastLine so it can handle being restarted
- Auto-login python script using image recognition....? 
- Guild member spreadsheet or at least text file?
*/

function prepareEmbed(str) {

    let isContainsColon = str.indexOf(':');
    let IsSplit = (isContainsColon > -1) ? str.split(':') : str;
    let lineEcho = (IsSplit.length === 2) ? IsSplit[1] : IsSplit;
    let isSimplePing = (lineEcho.indexOf(lastGuildie) > -1) ? false : true;
    let finalLineEcho = (isSimplePing) ? 'Am I Online? Yup!' : lineEcho;
    let displayGuildie = (lastGuildie === 'Gods') ? 'The Gods' : lastGuildie;

    console.log('Preparing embed for: ' + str);

    const embed = new MessageEmbed()
        .setColor('#CEFF00') //Volt
        .setDescription(' ')
        .setTimestamp()
        .setAuthor('TiBot says...', 'https://austendale.ca/tibot.png','https://austendale.ca')
        .setFooter("Thanks for listening.")
        .addFields(
            { name: 'Who?', value: displayGuildie, inline: true},
            { name: 'What?', value: finalLineEcho, inline: true}
        )
    if (lastGuildie === 'Gods') {
        embed.setTitle('The Spawn Rate Has Changed!');
    } else if (isSimplePing) {
        embed.setTitle("System Status Check");
    } else {
        embed.setTitle('A Guild Member Was Mentioned In-Game!');
    }

    return embed;
}

// Could be sped up
function checkIfGuildMemberWasKilled(str) {
    let stringArr = str.split(" ");
    let isSystem = stringArr.indexOf("System");
    let WasFound = false;

    stringArr.forEach(function (v, i) {
        //console.log('Currently searching for ' + v);
        let currentlySearching = v;
        guildMembers.forEach(function (v, i) {
            //console.log('Comparing ' + v + ' against ' + currentlySearching)
            if (currentlySearching.includes(v)) {
                WasFound = v;
            }
        });
    });

    return WasFound;
}

function createLogFile() {
    fs.writeFile('tibot.log',`${lowestScore} by ${lowestEarner}`, function (err) {
        if (err) throw err;
        console.log('File is created successfully.');
      });
}

function openLogFile() {
    fs.readFile('tibot.log', 'utf8' , (err, data) => {
        if (err) {
          console.error(err)
          return
        }
        try {
//           console.log('DataFile CONTAINS');
//           console.dir(data);
            let split = data.split('by');
//           console.dir(split[0]);
            lowestScore = data[0] | lowestScore;
            lowestEarner = data[1] | lowestEarner;
            console.log('lowestScore set to ' + lowestScore);
            console.log('lowestEarner set to ' + lowestEarner);
        }
        catch {
            console.log('TiBotError');
        }

      })      
}

//Perfect
function getLeadingZeros(str) {
    if (str < 10) {
        return "0" + str;

    } else { return str }
}

//Perfect
function getNewestFile(files, path) {
    var out = [];
    files.forEach(function(file) {
        var stats = fs.statSync(path + "/" +file);
        if(stats.isFile()) {
            out.push({"file":file, "mtime": stats.mtime.getTime()});
        }
    });
    out.sort(function(a,b) {
        return b.mtime - a.mtime;
    })
    return (out.length>0) ? out[0].file : "";
}

process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});

