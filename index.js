/*
Ti - Heroes Over Legends, et al. (Heroes Over All)
Official Discord Bot, No. 1

(C) Copyright 2021+ Austen-Dale Patterson. All Rights Reserved

No duplication, no modification, no nothing. Fah Q.

*/

// TO DO
/*


Clean-up actionQueue system:

Move to push/pop array system. Iterating over each array item in order, when new data stream is received, add to end of array
After each line has been processed by the interval, remove it from the array to allow the next one to be processed



*/

//Main Imports
const Discord = require("discord.js");
const { MessageEmbed } = require('discord.js');
const config = require("./config.json"); //Only contains the token, and nothing but.
const fs = require('fs');
const path = require('path');
const TailingReadableStream = require('tailing-stream');
const { spawn, exec } = require('child_process');
let jsoning = require("jsoning");

//Important Initialization
const directoryPathOne = path.join(__dirname, '/../data');
const directoryPathTwo = path.join(directoryPathOne, 'User_Data');
const db = new jsoning("db.json");

//Constants
const prefix = "!";
var guildMembers = [
    'Gods', 
    'Austenthefirst',
    'Wysteria',
    'Overdrawn',
    'Staryx',
    'Pink Fish',
    'Budock',
    'Morenos',
    'Morena',
    'Krayse',
    'Benazz',
    'Confidor',
    'Fylakris',
    'Bryte',
    'Maniacmanik',
    'Okhand',
    'Gypsy',
    'Heir',
    'Fylakris',
    'Sketh',
    'Hambonerr',
    'Althyr',
    'Astriid',
    'Lord Beerus',
    'Bagrik',
    'Cross',
    'Vertam',
    'Soulless',
    'Peranaattori',
    'King Norco',
    'Kakarot',
    'King Tyr',
    'Nordic Seer',
    'Ivarital',
    'Paksot'
];


//State
var lastDataPacket = []

var dataPacketNo = 0;
var lowestScore = 99990;
var lowestEarner = 'TiBot';
var amIBusy = false;

var restarting = false;
var streamStatus = 'running'

var actionQueue = []; //for future use
var guildMessagesSent = 0;
var partyMessagesSent = 0;
var kotMode = false;
var messageBacklogGuild = []
var messageBacklogTell = []
var guildiesOnline = [];
var lastPlayerInvited = '';
var lastPlayerToAskForInvite = ''
var lastPlayerToMessageMe = '';
var lastPersonIMessaged = ''
var lastGuildMessageISent = ''
var lastPersonToGetLoot = ''
var lastLootToDrop = ''
var lastMobToDrop = ''
var lastInviteMethod = 'pm'
var lastLineFull = "NA";
var lastLine = "NA";
var lastSent = "NA";
var lastGuildie = 'NA';
var lastIdRead = '';
var lastIdSent = '';

if (lowestEarner === "TiBot") {
    openLogFile()
}

const pphChecker = setInterval(function() {
    console.log('===== PROCESSING POWER HOURS =====')
    processPPHs().then(resp => {
    })
}, 60000)

processPPHs()
const hmChecker = setInterval(function() {
    console.log('===== PROCESSING HENCHMEN =====')
    processHMs().then(resp => {
    })
}, 120000)
processHMs()
/*
const backlogCheckerGuild = setInterval(function() {
    let arrTwo = []

    messageBacklogGuild.forEach(function(v, i) {
        arrTwo.push(asyncGuild(arr[i],i))
        messageBacklogGuild.splice(i,1)
    })

    Promise.all(arrTwo).then(resp => {
    })
}, 350)

const backlogCheckerTell = setInterval(function() {
    let arrTwo = []

    messageBacklogTell.forEach(function(v, i) {
        arrTwo.push(asyncTell(guildie,arr[i],i))
        messageBacklogTell.splice(i,1)
    })

    Promise.all(arrTwo).then(resp => {
    }).then(resp => {
    })
}, 350)*/


const chattyChecker = setInterval(function() {
    if (guildMessagesSent < 5 &&  guildiesOnline.length > 0 && partyMessagesSent > 3) {
        let silenceBreak = breakTheSilence();
        console.log('>>> SILENCE BREAK <<<')
        console.log('>> ' + silenceBreak)
        if (silenceBreak.indexOf('!joke') > -1) {
            console.log('BREAKING THE SILENCE WITH A JOKE')
            let giveMeAJoke = require('give-me-a-joke')
            giveMeAJoke.getRandomDadJoke(function(joke) {
                let lines = joke.split('\r\n');
                var greeting = ''
                if (guildiesOnline.length == 1) {
                    greeting = `you're`
                } else if (guildiesOnline.length == 2) {
                    greeting = 'you both are' 
                } else {
                    greeting = `everyone's`
                }
                lines.forEach(function(v, i) {
                    let line = (i == 0) ? `Since ${greeting} so quiet, I'll tell a joke... ${v.trim()}` : v.trim()
                    setTimeout(function() {
                        console.log('BROKE THE SILENCE, BITCH!')
                        sendInGameGuildMessage(line);
                    }, i * 2250)
                })
                console.log(joke)
            });
        } else {
            sendInGameGuildMessage(breakTheSilence()).then(resp => {
                console.log('BROKE THE SILENCE, BITCH!')
            })
        }
    } else {
        console.log('The silence does not need breaking, for there is no silence.')
        if (kotMode) {
            sendInGameGuildMessage('Reminder: Knight of Talazar mode enabled.')
        }
    }
    guildMessagesSent = 0;
    partyMessagesSent = 0;
}, 1800000)

const onlineChecker = setInterval(function() {
    checkWhoIsOnline().then(resp => {
        console.log('>>>> ONLINE CHECK <<<<<')
        let count = (resp.count) ? resp.count : 'No one :('
        console.log('>>> COUNT: ' + count)
        console.log('>>> WHO: ')
        let who = (resp.who) ? resp.who : 'No one :('
        console.dir(who)
        guildiesOnline = resp.who;
    })


}, 60000)

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

function determineIfBoss(str) {
    let isIcebane = (str.toLowerCase().indexOf('icebane') > -1)
    let isAnby = (str.toLowerCase().indexOf('devour the heart') > -1)
    let isRyonkah = (str.toLowerCase().indexOf('ryonkah') > -1)
    let isSpore = (str.toLowerCase().indexOf('spore') > -1)
    let isIndoel = (str.toLowerCase().indexOf('indoel') > -1)

    if (isIcebane || isAnby || isRyonkah || isSpore || isIndoel) {
        return true;
    } else {
        return false;
    }
}

function determineChannel(str) {
    let msgType = determineMessageType(str);
    //console.log('Determining channel for the msgType ' + msgType);
    var channelId = '';

    switch (msgType){
        case '(System)':
            if (determineIfBoss(str)) {
                channelId = '918250357329653832';
            } else {
                channelId = '889290227204636692';
            }
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
            channelId = '890617783258324992'; //
        break;

        case '(Party)':
            channelId = '888177162568470580'; //
        break;  

        case '()':
            console.log('EMPTY CHANNEL!!!')
            channelId = '888177162568470580'; //
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
    const client = new Discord.Client({ partials: ["CHANNEL"], intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_INVITES", "GUILD_MEMBERS", "GUILD_PRESENCES", "DIRECT_MESSAGES","DIRECT_MESSAGE_TYPING"] })

    client.on("ready", () => {
        client.user.setStatus('online')
        client.user.setActivity(null) 

        console.log('Updating guildies...')
        updateListOfGuildies().then(resp => {
            console.log('Supposedly updated guildies...')
        })

        setInterval(() => {

            if (lastDataPacket.length > 0 && lastDataPacket.length < 20 && dataPacketNo > 1 && !amIBusy && !restarting && actionQueue.length < 1) {
                console.log('Found full DataPacket...');
                console.dir(lastDataPacket);
                let handler = new streamHandler()
                handler.pause();              
                lastDataPacket.forEach(function(v, i) {
    
                    let wasChatLogClosed = ((v.indexOf('Chat Log Closed') > -1) || ((v.indexOf("Left the") > -1) && (v.indexOf("Server") > -1)));
    
                    if (wasChatLogClosed) {
                        client.user.setStatus('dnd')
                        client.user.setActivity('shit restart...', {type: "WATCHING"})
                        relaunchGame();
                    }
    
                    var determinedChannel = determineChannel(v)
    
                    if (determinedChannel.length > 1 && !amIBusy && !restarting) {
                        var determinedType = determineMessageType(v)
    
                        console.log('determinedMessageType is ' + determinedType)
                        client.channels.fetch(determinedChannel).then((channel) => {
                            let isMyself = (v.indexOf('Tibot') > -1)
                            if (determinedType == "(System)") {
                                if (searchForGuildMember(v)) {
                                    lastGuildie = searchForGuildMember(v);
                                    console.log('Trying to send to channel ID ' + determinedChannel);
                                    let split = v.split(" "); //Split data stream up by SPACES
                                    let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                                    let joined = split.join(" "); // Reconstruct the array with a space as the seperator
                                    console.log(v);
                                    console.log(splice);
                                    console.log(joined);
                                    console.log('Attempting to send message ID ' + lastIdSent);
                                    channel.send({embeds: [prepareEmbed(joined)]}).then(resp => {
                                        console.log('Discord says done?')
                                        if (resp.id) {
                                            console.log('Yes')
                                        } else {
                                            console.log('No')
                                        }
                                    }).catch(err => {
                                        console.log('>>ERR<<')
                                        console.log(err)
                                    })
                                    lastSent = joined;   
                                    lastIdSent = lastIdRead;
                                    if (lastGuildie === 'Gods' && joined.indexOf('increased the spawn rate') > -1) {
                                        sendInGameGuildMessage("Gods be praised!").then(resp => {
                                            setTimeout(function() {
                                                sendInGameGuildMessage("Quick, everybody pretend you'll spend this time productively!");
                                            }, 2500);
                                        });
                                    }
                                    if (joined.indexOf('HAS ACHIEVED') > -1) {
                                        sendInGameGuildMessage(`Congratulations ${joined.split('HAS ACHIEVED')[0].trim()} on reaching level ${joined.split('HAS ACHIEVED LEVEL')[1].trim()}!!!`)
                                        if (Number(joined.split('HAS ACHIEVED LEVEL')[1]) == 110){
                                            setTimeout(function() {
                                                sendInGameGuildMessage('Welcome to the 110 club! The world is finally yours!')
                                            }, 4500)
                                        }
                                    }
    
                                } else {
                                    console.log('Not a guildie, ignoring')
                                }
                            } else if (determinedType === "(Tell)" && !isMyself){
                                // gonna handle party invites, yo
    
                                console.log('Attempting to parse tell request...');
                                console.log(v)
    
                                let split = v.split(" "); //Split data stream up by SPACES
                                let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                                let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                                
                                let splitTell = joined.split(":");
                                let sender = splitTell[0].trim();
                                let msg = splitTell[1].trim();


                                let isAskingForInvite = (v.toLowerCase().indexOf('!invite') > -1 || v.toLowerCase().indexOf('!pt') > -1 || v.toLowerCase().indexOf('!pp') > -1)

                                // let isMyself = (v.indexOf('Tibot') > -1)
                                let isClearing = (v.toLowerCase().indexOf('!done') > -1)
                                let isReminding = (v.toLowerCase().indexOf('!remind') > -1)
                                let isCheckingReminder = (v.toLowerCase().indexOf('!whatdo') > -1)

                                let isStartingPPH = (v.toLowerCase().indexOf('!startph') > -1)
                                let isCheckingPPH = (v.toLowerCase().indexOf('!checkph') > -1)

                                let isStartingHM = (v.toLowerCase().indexOf('!starthm') > -1)
                                let isCheckingHM = (v.toLowerCase().indexOf('!checkhm') > -1)

                                var isBossHomeAnnounce = (v.toLowerCase().indexOf('!announcehome') > -1)
                                var bossHome =  v.split('!announcehome')[1]
    
                                var isBossRaidAnnounce = (v.toLowerCase().indexOf('!announceparty') > -1)
                                var bossToRaid = v.split('!announceparty')[1]

                                var isBossHelpAnnounce = (v.toLowerCase().indexOf('!requestbackup') > -1)
                                var bossToHelp = v.split('!requestbackup')[1]

                                let isAskingHelp = (v.toLowerCase().indexOf('help') > -1)

                                let isAskingForDebug = (v.toLowerCase().indexOf('!debug') > -1 && sender == "Austenthefirst") 
                                let specificDebug = (isAskingForDebug) ? v.split('!debug')[1].trim() : false
                                let isAskingForVessel = (v.toLowerCase().indexOf('!vessel') > -1 && sender == "Austenthefirst") 

                                let askingForKnightlyEventInfo = (v.toLowerCase().indexOf('!kot') > -1)

                                lastPlayerToMessageMe = sender;

                                if (!isMyself) {
                                    msg = splitTell[1].trim();
                                    let msgSplit = msg.split(" ").filter(n => n);
        
                                    console.dir(msgSplit);
        
                                    let toInvite = ''
        
                                    // switch (msgSplit.length) {
                                    //     case 2:
                                    //         toInvite = msgSplit[1];
                                    //     break;
        
                                    //     case 1:
                                    //         toInvite = sender;
                                    //     break;
        
                                    //     default:
                                    //     break;
                                    // }

                                    if (isAskingForInvite) {
                                        if(msgSplit.length === 1) {
                                            toInvite = sender;
                                        } else {
                                            let clone = [...msgSplit]
                                            let junk = clone.splice(0,1)
                                            toInvite = clone.join(' ')
                                            console.log('toInvite formed to be ' + toInvite)
                                        }
                                        lastPlayerToAskForInvite = sender;
                                    }

                                    if (isAskingForVessel) {
                                        sendInGameGuildMessage(msg.replace('!vessel','').trim())
                                    }
                                    if (isAskingForDebug) {
                                        sendInGameDebugInfo(sender, specificDebug)
                                    }
    
                                    if (isClearing || isReminding || isCheckingReminder) {
                                        console.log('reminder pm received')
                                        if (isClearing) {
                                            console.log('attempting to clear')
                                            clearReminder(sender).then(resp => {
                                                console.log('clear remind promise returned')
                                                console.log(resp)
                        
                                                if (resp !== false) {
                                                    sendInGameTellMessage(sender,`Reminder cleared.`);
                                                } else {
                                                    sendInGameTellMessage(sender,`Reminder could not be cleared. Do you even have  one?`);  
                                                }
                                            })
                                        } else if (isReminding) {
                                            console.log('setting reminder')
                                            console.log(joined)
                                            let newMsg = msg.replace('!remind','').trim()
                                            console.log(newMsg)
                                            checkIfOnAntisocialList(sender).then(resp => {
                                                if(resp) {
                                                    sendInGameTellMessage(sender,`I'm ignoring you, go away.`)
                                                } else {
                                                    addReminder(sender,newMsg).then(resp => {
                                                        if (resp === false) {
                                                            sendInGameTellMessage(sender,`Reminder could not be created. Do you already  have one?`);
                                                        } else {
                                                            sendInGameTellMessage(sender,`Reminder created! You will be reminded: ${newMsg.replace(' ',' ')} when you next login.`);
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            console.log('checking reminder')
                                            checkForReminder(sender).then(resp => {
                                                console.log('clear remind promise returned')
                                                console.log(resp)
                        
                                                if (resp !== false) {
                                                    sendInGameTellMessage(sender,'Reminder: ' + resp);
                                                } else {
                                                    sendInGameTellMessage(sender,`No reminder set.`);  
                                                }
                                            })
                                        }
                                    } else if (isStartingPPH || isCheckingPPH) {    
                                        console.log('handling pph pm')  
                                        if (isStartingPPH) {
                                            checkIfOnAntisocialList(sender).then(resp => {
                                                return resp
                                            }).then(function(isIgnoring) {
                                                if (!isIgnoring) {
                                                    console.log('told to start pph')
                                                    checkIfPPHStarted(sender).then(timerStarted => {
                                                        if (timerStarted !== false) {
                                                            getPPHTimeRemaining(sender).then(timeRemaining => {
                                                                let currentTime = Date.now()
                                                                let diff = currentTime - timerStarted
                                                                let newTimeRemaining = timeRemaining - diff;
                                                                console.log('pph has the following left: ' + (newTimeRemaining / 1000 / 60))
                                                                sendInGameTellMessage(sender,`You already appear to be in a power hour with ${Math.round(newTimeRemaining / 1000 / 60)} min left.`)
                                                            })
                                                        
                                                        } else {
                                                            playerStartPPH(sender).then(resp => {
                                                                if (resp) {
                                                                    sendInGameTellMessage(sender,'Power hour started! Go go go!')
                                                                } else {
                                                                    sendInGameTellMessage(sender,'Your power hour could not be started. My bad.');
                                                                }
                                                            })
                                                        }
                                                    })
                                                } else {
                                                    sendInGameTellMessage(sender,`I'm ignoring you, go away.`)
                                                }
                                            })
                                        } else {
                                            checkIfPPHStarted(sender).then(pphStartedTime => {
                                                if (pphStartedTime !== false) {
                                                    sendInGameTellMessage(sender,`Command unavailable.`)
                                                        let currentTime = Date.now()
                                                        let diff = currentTime - timerStarted
                                                        let newTimeRemaining = timeRemaining - diff;
                                                        console.log('pph has the following left: ' + (newTimeRemaining / 1000 / 60))
                                                        sendInGameTellMessage(sender,`You appear to be in a power hour with ${Math.round(newTimeRemaining / 1000 / 60)} min left.`)
                                                } else {
                                                    sendInGameTellMessage(sender,'You are not on a power hour.');
                                                }                                               
                                            })
                                        }                                   
                                    } else if (isStartingHM || isCheckingHM) {    
                                        console.log('handling hm pm')  
                                        if (isStartingHM) {
                                            checkIfOnAntisocialList(sender).then(resp => {
                                                return resp
                                            }).then(function(isIgnoring) {
                                                if (!isIgnoring) {
                                                    console.log('told to start hm')
                                                    checkIfHMStarted(sender).then(timerStarted => {
                                                        if (timerStarted !== false) {
                                                            getHMTimeRemaining(sender).then(timeRemaining => {
                                                                let currentTime = Date.now()
                                                                let diff = currentTime - timerStarted
                                                                let newTimeRemaining = timeRemaining - diff;
                                                                console.log('hm has the following left: ' + (newTimeRemaining / 1000 / 60))
                                                                sendInGameTellMessage(sender,`You already appear to have a henchman with ${Math.round(newTimeRemaining / 1000 / 60)} min left.`)
                                                            })
                                                        } else {
                                                            playerStartHM(sender).then(resp => {
                                                                if (resp) {
                                                                    sendInGameTellMessage(sender,'Henchman called! Go go go!')
                                                                } else {
                                                                    sendInGameTellMessage(sender,'Your henchman could not be tracked. My bad.');
                                                                }
                                                            })
                                                        }
                                                    })
                                                } else {
                                                    sendInGameTellMessage(sender,`I'm ignoring you, go away.`)
                                                }
                                            })
                                        } else {
                                            checkIfHMStarted(sender).then(timerStarted => {
                                                console.log(timerStarted)
                                                if (timerStarted !== false) {
                                                    getHMTimeRemaining(sender).then(timeRemaining => {
                                                        console.log(timeRemaining)
                                                        let currentTime = Date.now()
                                                        console.log(currentTime)
                                                        let diff = currentTime - timerStarted
                                                        console.log(diff)
                                                        let newTimeRemaining = timeRemaining - diff;
                                                        console.log(newTimeRemaining)
                                                        console.log('hm has the following left: ' + (newTimeRemaining / 1000 / 60))
                                                        sendInGameTellMessage(sender,`You appear to have a henchman with ${Math.round(newTimeRemaining / 1000 / 60)} min left.`)
                                                    })
                                                } else {
                                                    console.log('player has no henchman')
                                                }
                                            })
                                        }
                                    } else if (isBossHomeAnnounce) {
                                        sendInGameTellMessage(sender,`You got it. Announcing ${bossHome}...`).then(resp => {
                                            sendInGameGuildMessage(`${bossHome} is home! Anyone interested please start preparing.`).then(resp => {
                                                sendAnnounce(bossHome)
                                            })
                                        })
                                    } else if (isBossRaidAnnounce) {
                                        sendInGameTellMessage(sender,`You got it. Announcing ${bossToRaid}...`).then(resp => {
                                            sendInGameGuildMessage(`A party has begun forming for ${bossToRaid}! Start making your way and ask me for an invite.`).then(resp => {
                                                sendAnnounce(bossToRaid, 2)
                                            })
                                        })                                       
                                    } else if (isBossHelpAnnounce) {
                                        sendInGameTellMessage(sender,`You got it. Asking for help ${bossToRaid}...`).then(resp => {
                                            sendInGameGuildMessage(`Reinforcements have been requested for ${bossToRaid}! Anyone able to help please ask me for a party invite.`).then(resp => {
                                                sendAnnounce(bossToHelp, 2)
                                            })
                                        })  
                                    } else if (isAskingHelp) {
                                        sendInGameHelpMessage(sender).then(resp => {
                                            console.log(resp)
                                        })
                                    } else if (askingForKnightlyEventInfo) { 
                                        sendInGameEventInfo()
                                        kotMode = true;
                                        client.user.setStatus('dnd')
                                        client.user.setActivity('the world get torn asunder', {type: "WATCHING"})
                                    } else {
                                        sendInGameInvite(toInvite).then(resp => {
                                            lastPlayerInvited = toInvite;   
                                        })                         
                                    }
                                } 
                            } else if (determinedType === "(Say)" && !isMyself){
    
                                let split = v.split(" "); //Split data stream up by SPACES
                                let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                                let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                                
                                let isInCombat = (joined.indexOf('combat mode') > -1);
                                let isAlreadyInPt = (joined.indexOf('already in') > -1);
                                let isNowOffline = (joined.indexOf('offline') > -1);
                                let isNowOnline = (joined.indexOf('online') > -1);
                                let isSelfInvite = (lastPlayerInvited == lastPlayerToAskForInvite);
                                let hasInvitedTibot = joined.indexOf('has invited you to join')
    
                                if (lastInviteMethod == 'pm') {
                                    console.log('lastInviteMethod is PM')

                                    if (isInCombat) {
                                        if (!isSelfInvite) {
                                            sendInGameTellMessage(lastPlayerInvited,`I was asked to send you a party invite but you seem to be in combat mode.`)
                                        } else {
                                            sendInGameTellMessage(lastPlayerInvited,'Drop combat noob lol');
                                        }
                                    }
        
                                    if (hasInvitedTibot) {
                                        sendInGamePartyAcceptance().then(resp => {
                                            console.log('Supposedly accepted party invite...')
                                        })
                                    }
        
                                    if (isAlreadyInPt) {
                                        if (isSelfInvite) {
                                            sendInGameTellMessage(lastPlayerInvited,'You seem to already be in a party.');
                                        } else {
                                            sendInGameTellMessage(lastPlayerInvited,`I was asked to send you a party invite but you seem to be in one already.`);
                                        }
                                    }
                                }
                                if (lastInviteMethod == 'guild') {
                                    console.log('lastInviteMethod is GUILD')

                                    if (isInCombat) {
                                        if (isSelfInvite) {
                                            sendInGameGuildMessage('Drop combat noob.')
                                        } else {
                                            sendInGameGuildMessage('Tell them to drop combat. Then call them a noob.')
                                        }
                                    }
                                    if (isAlreadyInPt) {
                                        if (isSelfInvite) {
                                            sendInGameGuildMessage('You are already in a party scrub.')
                                        } else {
                                            sendInGameGuildMessage('They are already in a party.')
                                        }
                                    }
                                }
                            }
                            if (determinedType === "()") {
                                console.log('Processing blank channel...')
                                console.log(v)
    
                                let split = v.split(" "); //Split data stream up by SPACES
                                let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                                let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
    
                                let hasInvitedTibot = joined.indexOf('has invited you to join')
        
                                if (hasInvitedTibot) {
                                    sendInGamePartyAcceptance().then(resp => {
                                        console.log('Supposedly accepted party invite...')
                                    })
                                }
                            }
                            if (determinedType === "(aebros)"){
                                          
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
                                console.log('Attemtping to send message ID ' + lastIdSent);
                                channel.send(`${joined}`).then(resp => {
                                    console.log('Discord says done?')
                                    if (resp.id) {
                                        console.log('Yes')
                                    } else {
                                        console.log('No')
                                    }
                                })
                                lastSent = `${type3} ${joined}`;   
                                lastIdSent = lastIdRead;
    
                            } else if (determinedType === "(Party)" && !isMyself) { 
                                console.log('Attempting to parse party msg...');
                                console.log(v)
    
                                let split = v.split(" "); //Split data stream up by SPACES
                                let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                                let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                                let hasDied = (joined.indexOf('has died') > -1);
                                let totemDrop = (joined.indexOf('Totem of the Werewolf') > -1)
                                let isLootDrop = (joined.indexOf('looted a') > -1)
                                let whoGotDrop = (isLootDrop) ? joined.split('looted a')[0].trim() : ''
                                let lootDropped = (isLootDrop) ? joined.replace('looted a','').replace(whoGotDrop,'').trim().split('from the')[0].trim() : ''
                                let whoDropped = (isLootDrop) ? joined.split('from the')[1].replace('.','').trim() : ''
    
                                if (hasDied && !kotMode) {
                                    let nom = joined.split('has died')[0].trim()
                                    sendInGameGuildMessage(`Oh no! ${nom} has died in the guild party!`)
                                }
                                if (totemDrop) {
                                    sendInGameGuildMessage('Oooh! Shiny new WWT! Congrats!')
                                }
                                if (isLootDrop) {
                                    lastLootToDrop = lootDropped
                                    lastPersonToGetLoot = whoGotDrop
                                    lastMobToDrop = whoDropped;
                                }
                                partyMessagesSent++;
                            } else {
                                let split = v.split(" "); //Split data stream up by SPACES
                                let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                                let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                                //console.log('Does contain colon? ' + (joined.indexOf(':') > -1))
                                console.log(joined);
                                let isNowOffline = ((joined.indexOf('is now offline') > -1) && !(joined.indexOf(':') > -1));
                                let isNowOnline = ((joined.indexOf('is now online') > -1) && !(joined.indexOf(':') > -1));
                                let isAskingForFunny = (joined.toLowerCase().indexOf('!joke') > -1);
                                let hasJoinedGuild = ((joined.indexOf('has joined the guild') > -1) && !(joined.indexOf(':') > -1))
                                let hasLeftGuild = ((joined.indexOf('has left the guild') > -1) && !(joined.indexOf(':') > -1))
                                let isAskingForPt = (joined.toLowerCase().indexOf('!pp') > -1 || joined.toLowerCase().indexOf('!pt') > -1);
                                let isTellingBossTimer = (joined.toLowerCase().indexOf('!killed') > -1)
                                let whoAskingForPt = ''

                                //console.log(`${isNowOffline} ${isNowOnline}`);
                                let type = determineMessageType(v);
                                let type2 = type.replace("(","[");
                                let type3 = type2.replace(")","]");
                                //console.log(`${type} ${type2} ${type3}`);
                                var name = ''
    
                                if (joined.indexOf('is now online.') > -1) {
                                    name = joined.split('is now online.')[0].trim()
                                } else if (joined.indexOf(':') > -1) { 
                                    name = joined.split(':')[0].trim()
                                } else if (joined.indexOf('is now offline.') > -1) { 
                                    name = joined.split('is now offline.')[0].trim()
                                } else {
                                    name = split[0].trim();
                                }

                                if (isTellingBossTimer) {
                                    let bossToTell = joined.split('!killed')[1]

                                    let msg = `Head's up: ${name} just killed ${bossToTell}`
                                    sendBossTimer(msg).then(resp => {
                                        sendInGameGuildMessage('Your kill has been noted.');
                                    })
                                }

                                if(isAskingForPt) {
                                    if (joined.toLowerCase().indexOf('!pp') > -1) {
                                        if(joined.toLowerCase().split('!pp')[1].trim()) {
                                            whoAskingForPt = joined.toLowerCase().split('!pp')[1].trim()
                                        } else {
                                            whoAskingForPt = name;
                                        }
                                    } else if (joined.toLowerCase().indexOf('!pt') > -1) {
                                        if(joined.toLowerCase().split('!pt')[1].trim()) {
                                            whoAskingForPt = joined.toLowerCase().split('!pt')[1].trim()
                                        } else {
                                            whoAskingForPt = name;
                                        }
                                    }
                                }
    
                                console.log(joined.split('is now online.')[0])
                                console.log(joined.split('is now online.')[0].trim())
    
                                if (isAskingForFunny && !isMyself) {
                                    let giveMeAJoke = require('give-me-a-joke')
                                    giveMeAJoke.getRandomDadJoke(function(joke) {
                                        let lines = joke.split('\r\n');
                                        lines.forEach(function(v, i) {
                                            setTimeout(function() {
                                                sendInGameGuildMessage(v.trim());
                                            }, i * 2250)
                                        })
                                        console.log(joke)
                                    });
                                }
                                if (isAskingForPt && determinedType !== "(Tell)" && !isMyself) {
                                    let ack = (joined.indexOf('pp') > -1) ? 'pp lol' : 'kk'
                                    lastPlayerToAskForInvite = name;
                                    sendInGameGuildMessage(ack).then(function() {
                                        lastPlayerToMessageMe = name;
                                        lastPlayerInvited = whoAskingForPt;
                                        setTimeout(function() {
                                            sendInGameInvite(whoAskingForPt, 'guild');   
                                        }, 2000)
                                    })
                                }
                                if (hasLeftGuild) {
                                    sendOfficerNotice(`Heads Up: ` + joined).then(resp => {
                                        removeGuildieFromList(joined.split('has left the guild')[0].trim())
                                    })
                                }
                                if (hasJoinedGuild) {
                                    sendInGameGuildMessage("Welcome to the guild! Let us know if you need anything.").then(resp => {
                                        sendInGameGuildMessage("Our Discord is https://austen.tech/heroes_chat").then(resp => {
                                            sendOfficerNotice(`New Member Alert! ` + joined).then(resp => {
                                                updateListOfGuildies()
                                            })
                                        });
                                    })
                                }
                                if (isNowOnline) {
                                    console.log('Guildie logged in');
                                    console.log(name)
                                    
                                    if (name === 'Tibot' ) {
                                        console.log('Tibot logged in');
                                        sendInGameGuildMessage("I'm back! Sorry about that.").then(resp => {
                                            console.log('Tibot back online.')
                                        });                                                                          
                                    } else {
                                        lastLoggedInWrite(name).then(resp => {
                                            console.log('lastLoggedinWriteResponse ' + resp)
                                            checkIfOnAntisocialList(name).then(resp => {
                                                console.log('isOnAntiSocialList? ' + resp);
                                                if (resp) {
                                                    console.log('Guildie on antisocial list, ignoring.');
                                                } else {
                                                    compareLastLoggedOut(name).then(resp => {
                                                        console.log('initial comparing returned')
                                                        console.log(resp);
                                                        if (resp > 30) {
                                                            console.log('Resp > 30, continuing')
                                                            loginGreeting(name,resp).then(resp => {
                                                                console.log('Login greeting promise returned')
                                                                setTimeout(function() {
                                                                    sendInGameInvite(name).then(resp => {
                                                                        checkForReminder(name).then(resp => {
                                                                            if (resp !== false) {
                                                                                sendInGameTellMessage(name,`Automatic Reminder: ${resp}`).then(resp => {
                                                                                    console.log('Checking if guildie is on PPH')
                                                                                    checkIfPPHStarted(name).then(ExistingPPHTime => {
                                                                                        if (ExistingPPHTime !== false) {
                                                                                            console.log('player on pph logged back in')
                                                                                            playerOnPPHLoggedIn(name).then(loggedInAt => {
                                                                                                if (resp !== false) {
                                                                                                    console.log('pph player marked as logged in at ' + loggedInAt)
                                                                                                    console.log(ExistingPPHTime + ' is when it was last started');
                                                                                    
                                                                                                    getPPHTimeRemaining(name).then(pphTimeRemaining => {
                                                                                                        sendInGameTellMessage(name,`You're on a PPH with ${Math.round(pphTimeRemaining/1000/60)} minutes remaining.`).then(resp => {
                                                                                                            checkIfHMStarted(name).then(resp => {
                                                                                                                console.log('checked if hm is started...' + resp)
                                                                                                                if (resp !== false) {
                                                                                                                    playerOnHMLoggedIn(name).then(resp => {
                                                                                                                        console.log('player with hm logged in')
                                                                                                                        getHMTimeRemaining(name).then(hmTimeRemaining => {
                                                                                                                            sendInGameTellMessage(name,`You have a henchman with ${Math.round(hmTimeRemaining/1000/60)} min remaining.`)
                                                                                                                            console.log('tell sent')
                                                                                                                        })
                                                                                                                    })
                                                                                                                } else {
                                                                                                                    console.log('player has no henchman')
                                                                                                                }
                                                                                                            })
                                                                                                        })
                                                                                                    })
                                                                                                } else {
                                                                                                    console.log('having issues marking as logged in')
                                                                                                }
                                                                                            })
                                                                                        } else {
                                                                                            console.log('player not on pph 2')
                                                                                            checkIfHMStarted(name).then(resp => {
                                                                                                console.log('checked if hm is started...' + resp)
                                                                                                if (resp !== false) {
                                                                                                    playerOnHMLoggedIn(name).then(resp => {
                                                                                                        console.log('player with hm logged in')
                                                                                                        getHMTimeRemaining(name).then(hmTimeRemaining => {
                                                                                                            sendInGameTellMessage(name,`You have a henchman with ${Math.round(hmTimeRemaining/1000/60)} min remaining.`)
                                                                                                            console.log('tell sent')
                                                                                                        })
                                                                                                    })
                                                                                                } else {
                                                                                                    console.log('player has no henchman')
                                                                                                }
                                                                                            })
                                                                                        }
                                                                                    });
                                                                                });
                                                                            } else {
                                                                                checkIfPPHStarted(name).then(ExistingPPHTime => {
                                                                                    if (ExistingPPHTime !== false) {
                                                                                        console.log('player on pph logged back in')
                                                                                        playerOnPPHLoggedIn(name).then(loggedInAt => {
                                                                                            if (resp !== false) {
                                                                                                console.log('pph player marked as logged in at ' + loggedInAt)
                                                                                                console.log(ExistingPPHTime + ' is when it was last started');
                                                                                
                                                                                                getPPHTimeRemaining(name).then(pphTimeRemaining => {
                                                                                                    sendInGameTellMessage(name,`You're on a PPH with ${Math.round(pphTimeRemaining/1000/60)} minutes remaining.`).then(resp => {
                                                                                                        checkIfHMStarted(name).then(resp => {
                                                                                                            console.log('checked if hm is started...' + resp)
                                                                                                            if (resp !== false) {
                                                                                                                playerOnHMLoggedIn(name).then(resp => {
                                                                                                                    console.log('player with hm logged in')
                                                                                                                    getHMTimeRemaining(name).then(hmTimeRemaining => {
                                                                                                                        sendInGameTellMessage(name,`You have a henchman with ${Math.round(hmTimeRemaining/1000/60)} min remaining.`)
                                                                                                                        console.log('tell sent')
                                                                                                                    })
                                                                                                                })
                                                                                                            } else {
                                                                                                                console.log('player has no henchman')
                                                                                                            }
                                                                                                        })
                                                                                                    })
                                                                                                })
                                                                                            } else {
                                                                                                console.log('having issues marking as logged in')
                                                                                            }
                                                                                        })
                                                                                    } else {
                                                                                        console.log('player not on pph 2')
                                                                                        checkIfHMStarted(name).then(resp => {
                                                                                            console.log('checked if hm is started...' + resp)
                                                                                            if (resp !== false) {
                                                                                                playerOnHMLoggedIn(name).then(resp => {
                                                                                                    console.log('player with hm logged in')
                                                                                                    getHMTimeRemaining(name).then(hmTimeRemaining => {
                                                                                                        sendInGameTellMessage(name,`You have a henchman with ${Math.round(hmTimeRemaining/1000/60)} min remaining.`)
                                                                                                        console.log('tell sent')
                                                                                                    })
                                                                                                })
                                                                                            } else {
                                                                                                console.log('player has no henchman')
                                                                                            }
                                                                                        })
                                                                                    }
                                                                                });
                                                                            }
                                                                        })
                                                                    });
                                                                }, 2500)
                                                            });
                                                        } else { /* Else if the player's time since last logout is less than cooldown specified: they must be relogging */
                                                            console.log('relog, ignoring.')
                                                            sendInGameInvite(name).then(resp => {
                                                                console.log('Invited ' + name)
                                                                checkIfPPHStarted(name).then(ExistingPPHTime => {
                                                                    if (ExistingPPHTime !== false) {
                                                                        console.log('player on pph logged back in')
                                                                        playerOnPPHLoggedIn(name).then(loggedInAt => {
                                                                            if (resp !== false) {
                                                                                console.log('pph player marked as logged in at ' + loggedInAt)
                                                                                console.log(ExistingPPHTime + ' is when it was last started');
                                                            
                                                                                getPPHTimeRemaining(name).then(pphTimeRemaining => {
                                                                                    sendInGameTellMessage(name,`You're on a PPH with ${Math.round(pphTimeRemaining/1000/60)} minutes remaining.`).then(resp => {
                                                                                        checkIfHMStarted(name).then(resp => {
                                                                                            console.log('checked if hm is started...' + resp)
                                                                                            if (resp !== false) {
                                                                                                playerOnHMLoggedIn(name).then(resp => {
                                                                                                    console.log('player with hm logged in')
                                                                                                    getHMTimeRemaining(name).then(hmTimeRemaining => {
                                                                                                        sendInGameTellMessage(name,`You have a henchman with ${Math.round(hmTimeRemaining/1000/60)} min remaining.`)
                                                                                                        console.log('tell sent')
                                                                                                    })
                                                                                                })
                                                                                            } else {
                                                                                                console.log('player has no henchman')
                                                                                            }
                                                                                        })
                                                                                    })
                                                                                })
                                                                            } else {
                                                                                console.log('having issues marking as logged in')
                                                                            }
                                                                        })
                                                                    } else {
                                                                        console.log('player not on pph 1')
                                                                        checkIfHMStarted(name).then(resp => {
                                                                            console.log('checked if hm is started...' + resp)
                                                                            if (resp !== false) {
                                                                                playerOnHMLoggedIn(name).then(resp => {
                                                                                    console.log('player with hm logged in')
                                                                                    getHMTimeRemaining(name).then(hmTimeRemaining => {
                                                                                        sendInGameTellMessage(name,`You have a henchman with ${Math.round(hmTimeRemaining/1000/60)} min remaining.`)
                                                                                        console.log('tell sent')
                                                                                    })
                                                                                })
                                                                            } else {
                                                                                console.log('player has no henchman')
                                                                            }
                                                                        })
                                                                    }
                                                                });
                                                                
                                                            })                                                    
                                                        }    
                                                    });
                                                }
                                            })                                      
                                        })
                                    }
                                }
    
                                if (isNowOffline && !isMyself) {
                                    console.log('recognized offline')
                                    lastLoggedOutWrite(name).then(resp => {
                                        console.log('writing logout for ' + name)
                                        console.log(resp)
                                        checkIfPPHStarted(name).then(phstarted => {
                                            if (phstarted !== false) {
                                                console.log('player on pph logged out')
                                                playerOnPPHLoggedOutV2(name).then(resp => {
                                                    console.log('pph player marked as logged out')
                                                    checkIfHMStarted(name).then(hmstarted => {
                                                        if (hmstarted !== false) {
                                                            console.log('player on hm logged out')
                                                            playerOnHMLoggedOutV2(name).then(resp => {
                                                                console.log('player on hm marked as logged out')
                                                            })
                                                        } else {
                                                            console.log('player doesnt have a henchman')
                                                        }
                                                    })
                                                })
                                            } else {
                                                console.log('player not on pph 3')
                                                checkIfHMStarted(name).then(hmstarted => {
                                                    if (hmstarted !== false) {
                                                        console.log('player on hm logged out')
                                                        playerOnHMLoggedOutV2(name).then(resp => {
                                                            console.log('player on hm marked as logged out')
                                                        })
                                                    } else {
                                                        console.log('player doesnt have a henchman')
                                                    }
                                                })
                                            }
                                        });
                                        console.log(`Remembering that ${name} just logged.`)
                                    })
                                }
    
                                if (determinedType === "(Guild)" || isNowOffline || isNowOnline) {

    
                                    let isTurningGreetingsOff = (joined.indexOf('!off') > -1)
                                    let isTurningGreetingsOn = (joined.indexOf('!on') > -1);
                                    let wantsTibotRebooted = (joined.indexOf('!tibotreboot') > -1);
                                    let systemCheck = (joined.indexOf('!areyouok') > -1 || joined.indexOf('!ruok') > -1);
    
                                    name = name.replace(':','');
                                    let spaceAtEnd = (name[name.length-1] == ' ') 
                                    if (spaceAtEnd) {
                                        let sliced = name.slice(0, -1)
                                    } 
    
                                    if (isTurningGreetingsOff) {
                                        if (name !== 'Austenthefirst') {
                                            checkIfOnAntisocialList(name).then(resp => {
                                                if (resp) {
                                                    sendInGameGuildMessage(`You're repeating yourself. Are you just doing this to be hurtful?`);
                                                } else {
                                                    if (name === 'Benazz') { 
                                                        sendInGameGuildMessage("Nuh uh uh! Can't escape me that easily, Benzyboi! Nice try though haha.")
                                                    } else {
                                                        addGuildieToAntisocialList(name).then(resp => {
                                                            sendInGameGuildMessage('Enjoy being ghosted.');
                                                        })
                                                    }
                                                }
                                            })
                                        } else {
                                            sendInGameGuildMessage('TiBot temporarily ignoring the world, goodbye.').then(resp => {
                                                amIBusy = true;
                                                restarting = true;
                                                client.user.setStatus('dnd')
                                                client.user.setActivity('the world burn...', {type: "WATCHING"})
                                            })
                                        }
                                    } else
                                    if (isTurningGreetingsOn) {
                                        removeGuildieFromAntisocialList(name).then(resp => {
                                            sendInGameGuildMessage(`Of course I'll take you back, ${name}.`);
                                        })
                                    } else
                                    if (wantsTibotRebooted) {
                                        sendInGameGuildMessage(`Restarting...Gimme a sec.`).then(resp => {
                                            amIBusy = false;
                                            setTimeout(function() {
                                                relaunchGame()
                                            }, 5000);
                                        })
                                    } else
                                    if (systemCheck) {
                                        sendInGameGuildMessage(`I appear to be operational. If you are having issues I should respond to my restart command.`).then(resp => {
                                        })                      
                                    } else {
                                        console.log('Attempting to send message ID ' + lastIdSent);
                                        channel.send(`${joined}`).then(resp =>{
                                            console.log('Discord says done?')
                                            if (resp.id) {
                                                console.log('Yes')
                                            } else {
                                                console.log('No')
                                            }
                                        }).catch(err => {
                                            console.log('>>ERR<<')
                                            console.log(err)
                                        })
                                        lastSent
                                        lastSent = `${type3} ${joined}`;   
                                        lastIdSent = lastIdRead;
                                        if (name && !isNowOffline) {
                                            lastSpokeWrite(name)
                                        }
                                        if (!isNowOnline && !isNowOffline) {
                                            guildMessagesSent++;
                                            console.log(`Just sent msg no.${guildMessagesSent}`)
                                        }
                                    }
                                }
                            }
                        })
                    }
                    lastDataPacket.splice(i,1)
                });
                if (!lastDataPacket.length > 0) lastDataPacket = [];
                if (!lastDataPacket.length > 0) handler.resume()
                /* might have to swap the two statements above */
            } else {
                if (lastDataPacket.length > 0) {
                    console.log('Found Full Data Packet but not processing for some reason')
                    if (!amIBusy) {
                        lastDataPacket = []
                        checkRunning('client.exe', (status) => {
                            console.log('client.exe found? ' + status);
                            if (status != true) {
                                client.user.setStatus('dnd')
                                client.user.setActivity('shit restart...', {type: "WATCHING"})
                                console.log('client.exe does not appear to be open, lets fix that.');
                                relaunchGame()
                            }
                        })
                    }
                    /* Removed the following :
                    dataPacketNo === 1 && lastDataPacket.length === 1 && 
                    */
                    /*if (!amIBusy) { //should remove busycheck?
                        console.log('I am not busy, doing my thing...')
                        let lastLine = lastDataPacket[(lastDataPacket.length-1)]
                        let wasChatLogClosed = ((lastLine.indexOf('Chat Log Closed') > -1) || ((lastLine.indexOf("Left the") > -1) && (lastLine.indexOf("Server") > -1)));
        
                        if (wasChatLogClosed) {
                            client.user.setStatus('dnd')
                            client.user.setActivity('shit restart...', {type: "WATCHING"})
                            console.log('chat log closed, oh my')
                            relaunchGame();
                            //dataPacketNo++
                        } else {
                            console.log('chat log not closed')
                            console.log('checking if client is open just for good measure...');
                            checkRunning('client.exe', (status) => {
                                console.log('client.exe found? ' + status);
                                if (status != true) {
                                    client.user.setStatus('dnd')
                                    client.user.setActivity('shit restart...', {type: "WATCHING"})
                                    console.log('client.exe does not appear to be open, lets fix that.');
                                    relaunchGame()
                                }
                            })
                            //dataPacketNo++
                        }
                        lastDataPacket = []; //removed
                    } else {
                        /*console.log('I am busy.')
                        setTimeout(function() {
                            amIBusy = false;
                        }, 60000)*/
                        
                    //}
                    // console.log('datapacket contains')
                    // console.log(lastDataPacket)
                    // console.log('datapacketemptied')
                    // lastDataPacket = [];

                } else if (actionQueue.length > 0) {
                    console.log('actionQueue not empty, lastDataPacket not full')
                    lastDataPacket = [...actionQueue];
                    actionQueue = []
                }

            }
        }, 350);
    })

    class streamHandler {
        constructor() {
            this.resume = function () {
                streamStatus = 'running'
                console.log('STREAMHANDLER: RESUME');
                return stream.resume();
            };
            this.pause = function () {
                streamStatus = 'paused'
                console.log('STREAMHANDLER: PAUSE');
                return stream.pause();
            };
        }
    }

    stream.on('data', async buffer => {
        console.log(' '); //Print blank line, acts as a spacer
        console.log(buffer.toString().trim()); //What's in the data buffer?
        if (buffer.toString().length > 1) { 
            if (lastDataPacket.length > 1) {
                lastLineFull = buffer.toString();
                let lines = lastLineFull.split('\r\n');
                console.log('Going over ' + lines.length + ' lines... in actionQueue');
                if (lines) {
                    lines.forEach(function(v, i) { 
                        let split = v.split(" "); //Split data stream up by SPACES
                        if (split.length > 1) {
                            let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                            let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                            lastLine = v;
                            lastIdRead = splice[0];
                            lastDataPacket.push(v);
                        }
                    });
                }
            } else {
                lastDataPacket = [];
                dataPacketNo++;
                lastLineFull = buffer.toString();
                let lines = lastLineFull.split('\r\n');
                console.log('Going over ' + lines.length + ' lines... in dataPacketNo ' + dataPacketNo);
                if (lines) {
                    lines.forEach(function(v, i) { 
                        console.log('[DP: ' + dataPacketNo + '] Iterating over line: ' + v);
                        let split = v.split(" "); //Split data stream up by SPACES
                        if (split.length > 1) {
                            let splice = split.splice(0,2); // Remove the first 2 elements of the array, which is the ID and channel
                            let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                            lastLine = v;
                            lastIdRead = splice[0];
                            lastDataPacket.push(v);
                        }
                    });
                }
            }

            //if (hasLeft === false) {

            //}
            console.log('Finished DataPacket:');
            console.dir(lastDataPacket);
        }
    });

    
   async function sendAnnounce(boss, stage = 1) {
       //903336941771182090 <-- bot announce
       //889544918157111377 <-- playground
        client.channels.fetch('903336941771182090').then(channel => {
            if (stage == 1) {
                channel.send("@everyone" + ` ${boss} is home! Anyone interested should login and start preparing.`).then(resp => {
                    return;
                })
            } else if (stage == 2) {
                channel.send("@everyone" + ` A party is forming for ${boss}! Request an invite from me in-game.`).then(resp => {
                    return;
                })
            } else {
                channel.send("@everyone" + ` Reinforcements have been requested for ${boss}! Anyone able to provide assistance is asked to join the party! /t Tibot:pt`).then(resp => {
                    return;
                })               
            }
        });
    }

    async function sendOfficerNotice(what) {
        client.channels.fetch('904414070151741481').then(channel => {
            channel.send(`${what}`)
        });
    }

    async function sendBossTimer(what) {
        client.channels.fetch('918250357329653832').then(channel => {
            channel.send(`${what}`)
        });
    }

    client.on('guildMemberRemove', member => {
        sendOfficerNotice(`${member.nickname} has left the discord`);
    });


    client.on('guildMemberAdd', member => {
        console.log('newMemberAdded')
        setTimeout(function() {
            client.channels.fetch('899040998347391026').then(channel => {
                channel.send("Hi there! What's your main character's in-game name? I'm going to change your nickname so it matches.")
            });
        }, 3000)
    });

    

    client.on('messageCreate', async message => {
        let whereFrom = message.channelId;
        if (message.author.bot) return;

        if (message.channel.type === 'GUILD_TEXT') {
            client.channels.fetch(whereFrom).then((channel) => {
                if (message.channelId === "899040998347391026") {
                    message.member.setNickname(message.content).then(resp => {
                        channel.send(`Nickname set! Hopefully that looks right. If not please correct it.`).then(resp => {
                            setTimeout(function() {
                                channel.send(`You'll be placed into a temporary group while you await permanent assignment.\n\nPlease take this time to familiarize yourself with our guidelines, ignorance will not grant you an exception.`).then(resp => {
                                    setTimeout(function() {
                                        message.member.roles.add(message.member.guild.roles.cache.get('899764853336592434'))
                                    }, 5000)
                                })
                            },1000)
                        });
                    })
                }
            });
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
                if (command === "vessel" && whoFrom == 'Austen') {
                    let splitBody = args.join(' ').trim();
                    console.log('general command received')
                    console.log('splitbody:')
                    console.log(splitBody)
                    if(splitBody.length > 0) {
                        console.log('length > 0')
                        dscrdMsg.delete().then(function() {
                            channel.send(splitBody);
                        })
                    }
                }  

                if (command === "help") {
                    channel.send({
                        embeds: [
                        {
                            color: 3447003,
                            title: "TiBot Commands (Discord)",
                            fields: [
                                {name: "Command", value: "**!**ping\n**!**invite player\n**!**remind who:what\n**!**check player", inline: true},
                                {name: "Action", value: "Play ping-pong!\nSend an in-game party invite\nSet an in-game reminder\nCheck a reminder", inline: true},
                                {name: "Where?", value: "(Public)\n(Public)\n(DM)\n(DM)", inline: true}
                            ]
                        },
                        {
                            color: 3447003,
                            title: "TiBot Commands (In-Game)",
                            fields: [
                                {name: "Command", value: "**!**off\n**!**on\n**!**remind reminder\n**!**whatdo\n**!**done\ninvite\ninvite player", inline: true},
                                {name: "Action", value: "Turn TiBot Greetings Off\nTurn TiBot Greetings On\nSet a reminder\nCheck reminder\nClear Reminder\nInvite yourself to a party\nInvite player to a party", inline: true},
                                {name: "Where?", value: "(Guild)\n(Guild)\n(Tell)\n(Tell)\n(Tell)\n(Tell)\n(Tell)", inline: true}
                            ]
                        }]
                    })
                    // channel.send('**TiBot Commands (Discord)**\n\n!ping -Play Ping with')
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
                        let joined = split.join(" ", split); // Reconstruct the array with a space as the seperator
                        console.dir(split)
                        console.log(`commandBody: ${commandBody}`)
                        const comment = "["+message.member.displayName+ '] ' + joined;
                        console.log(`comment: ${commandBody}`)
                        console.log(`joined: ${joined}`)

                        const finalComment = comment.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '');

                        console.log(`finalComment: ${finalComment}`)

                        dscrdMsg.reply('Sending, please wait...')
                        .then(msg => {
                            setTimeout(function() {
                                sendInGameGuildMessage(finalComment.trim()).then(resp => {
                                    setTimeout(function(){
                                        msg.delete()
                                        dscrdMsg.delete();
                                   }, 2500)
                                })                                              
                            }, 100)
                        })
                    } else {
                        console.log('No Command Received');

                        if (!command !== "guild") {
                            dscrdMsg.reply('Please use the prefix !guild before your message. Self destructing...')
                            .then(msg => {
                                setTimeout(function(){
                                     msg.delete()
                                     dscrdMsg.delete();
                                }, 10000)});
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
        } else if(message.channel.type === "DM") {
            console.log('DM received')
            if (command === "remind") {
                console.log('Remind command received')
                let splitBody = args.join(' ').split(':');
                
                if (!splitBody.length > 1) {
                    message.author.send('Invalid command. Format: !remind Playername:reminder');
                } else {
                    let charName = splitBody[0].trim()
                    let charRemind = splitBody[1].trim()
    
                    addReminder(charName,charRemind).then(resp => {
                        console.log('Add reminder promise returned ' + resp)
                        if (resp !== false) {
                            message.author.send(`Reminder created! ${charName} will be reminded: ${charRemind} when they login.`);
                        } else {
                            message.author.send(`Reminder could not be created. Do you already have one?`);
                        }
                    })
                }
            }
            if (command === "done") {
                if (args.length !== 1) {
                    message.author.send('Invalid command. Format: !done playername')
                } else {    
                    let charName = args[0].trim()

                    clearReminder(charName).then(resp => {
                        console.log('clear remind promise returned')
                        console.log(resp)

                        if (resp !== false) {
                            message.author.send(`Reminder cleared.`);
                        } else {
                            message.author.send(`Reminder could not be cleared. Do you even have one?`);  
                        }
                    })
                }
            }
            if (command === "check") {
                if (args.length !== 1) {
                    message.author.send('Invalid command. Format: !check playername')
                } else {    
                    let charName = args[0].trim()

                    checkForReminder(charName).then(resp => {
                        if (!resp) {
                            message.author.send(`No reminder exists.`);  
                        } else {
                            message.author.send(resp);  
                        }
                    })
                }
            }
        }
    });
    
    client.login(config.BOT_TOKEN);
});

async function sendInGameTellMessage(player,message) {
    console.log(player + ' TELL RECEIVED TO SEND ' + message)

    if (!player || !message) return;

    if (!amIBusy) {
        amIBusy = true;

        let tellString = `t ${player}:`

        const tellProcess = spawn('python',["entertext.py", tellString, message]);

        tellProcess.on('close', (code) => {
            setTimeout(function() {
                amIBusy = false;
                lastPersonIMessaged = player;
                return code;
            }, 1000)
        })
    } else {
        messageBacklogTell.push({player,message})
        setTimeout(function() {
            sendInGameTellMessage(player,message)
        },5000)
    }
}

async function sendInGamePartyAcceptance() {

    if (!amIBusy) {
        amIBusy = true;

        const process = spawn('python',["acceptparty.py"]);

        process.on('close', (code) => {
            setTimeout(function() {
                amIBusy = false;
                return code;
            }, 1000)
        })
    } else {
        setTimeout(function() {
            sendInGamePartyAcceptance()
        },5000)
    }
}


async function sendInGameInvite(player, method = 'pm') {
    if (!player) return;

    console.log('INVITE REQUESTED FOR ' + player)
    let brokenSpaces = player.split('-')
    let spaceCount = brokenSpaces.length;
    let playername = player;
    if (spaceCount > 0) {
        playername = brokenSpaces.join(' ')
    }

    if (!amIBusy) {
        amIBusy = true;

        let inviteProcess = spawn('python',["entertext.py", 'invite', playername]);
        lastPlayerInvited = player;
        lastInviteMethod = method;

        inviteProcess.on('close', (code) => {
            setTimeout(function() {
                amIBusy = false;
                return code;
            }, 250)
        })
    } else {
        setTimeout(function() {
            sendInGameInvite(player, method)
        }, 4000);
    } 
}

async function loginGreeting(ogName, timeSinceLogin = 0) {
    if (timeSinceLogin < 15) return;
    console.log('LoginGreeting called for ' + ogName);

    console.log(guildiesOnline)

    let name = ogName.replace('-',' ')

    if (name == "Lord Kakarot") {
        name = `Player 1`
    }

    var arrOne = []

    if (guildiesOnline.length >= 4) {
        arrOne = [
            `${name} up in the hizzie!`, //1
            `${name} has graced us with their presence.`, //2
            `${name}, we're pleased you could join us!`, //3
            `${name}, lookin' fine in those pants.`, //4
            `${name}! Howssit going?`, //5
            `Oh look who has arrived! It's ${name}!`, //6
            `Who always makes the day better? For me it's ${name}.`, //7
            `Happy to see ya, ${name}!`, //8
            `Back to the grind eh, ${name}?`, //9
            `Working hard or hardly working, ${name}?`, //10
            `You could rule the world one day, ${name}...`, //11
            `${name} has made an apperance.`, //12
            `About time you joined us, ${name}!`, //13
            `Hey it's ${name}!`, //14
            `Sup ${name}?`, //15
            `My homie! How ya been, ${name}?` //16
        ]
    } 
    if (name == 'Benazz') {
        arrOne = ['BENNNNZZZZYYYY!!!',
        `Sup 'zy?`,
        `(deep inhale) BEEENNNZZYYYYY!!!`,
        `B man has arrived on the scene.`,
        `Benzyboi!`]
    }

    if (name == 'King Norco') {
        arrOne = ['King Norco! What impressive feat will you perform to impress your subjects today?',
        'Loco Norco, here to slay the day as usual I bet.',
        'King Norco has arrived. This means you bow, pesents.',
        'Hear ye, hear ye! King Norco has arrived and he\'s here to fuck shit up.',
        'My biggest fear is that King Norco will try to solo me one day like one of his conquests.',
        'All Hail King Norco, I guess.',
        'One day I wish to be as strong as King Norco...']
    }
    if (guildiesOnline.length < 4) {
        console.log('GUILDIES ONLINE LESS THAN 4')
        arrOne = [
            `Welcome to the party, ${name}! You, me, ${guildiesOnline[0].name} and ${guildiesOnline[1].name}.`,
            `Finally, more people! How's it going, ${name}?`
        ]
    } else
    if (guildiesOnline.length < 3) {
        console.log('GUILDIES ONLINE LESS THAN 3')
        arrOne = [
            `It's just the 3 of us, ${name}! You, me and ${guildiesOnline[0].name}.`,
            `Finally, more people! How's it going, ${name}?`
        ]
    } else
    if (guildiesOnline.length < 2) {
        console.log('GUILDIES ONLINE LESS THAN 2')
        arrOne = [
            `It's just you and me at the moment, ${name}!`,
            `You and me against the world, ${name}!`,
            `Finally, some company! How's it going, ${name}?`,
            `Just you and I at the moment, ${name}. What shall we do while we wait for the others?`
        ]
    }

    console.log('>>PICKING FROM THE FOLLOWING GREETINGS<<')
    console.log(arrOne)

    let multiplier = (arrOne.length);
    let randTwo = Math.ceil(Math.random() * multiplier) -1; 
    if (randTwo < 0) randTwo = 0;
    if (randTwo > (arrOne.length - 1)) randTwo = (arrOne.length-1)
    let string = arrOne[randTwo]

    if (timeSinceLogin >= 15 && timeSinceLogin < 120) {
        let randThree = Math.ceil(Math.random() * 6); 
        let arrTwo = [
            `${name}! Back so soon?`,
            `Can't keep yourself away from us, eh ${name}?`,
            `It's good to see you again so soon ${name}.`,
            `We're just too irresistible you couldn't stay away ${name}?`,
            `No rest for the wicked, ${name}?`,
            `Didn't I just see you ${name}? I'm glad you're back so soon.`,
            `Wooo ${name} is back!`
        ]
        string = arrTwo[randThree]
    }
    //1 week
    if (timeSinceLogin > 10000) {
        string = `${name}! I was beginning to suspect you didn't like us. Good to see you.`
    }
    //2 weeks
    if (timeSinceLogin > 17280) {
        string = `Holy shit! It's ${name}! We were about to send a search party!`;
    }

    if (name == 'Pink Fish') {
        string = 'Pink Fish has appeared! Something smells fishy!'
    }

    if (name == 'Austenthefirst') {
        string = 'Austen has arrived!'
    }

    sendInGameGuildMessage(string).then(resp => {
        return resp;
    });
}

async function sendInGameGuildMessage(msg, isTibot = false) {
    console.log('ACTING AS A VESSEL: ' + msg)
    if (!msg) return;

    if (!amIBusy) {
        amIBusy = true;

        let brokenSpacesM = msg.split(' ')
        let spaceCountM = brokenSpacesM.length;
        let messengermessage = msg;
        if (spaceCountM > 0) {
            messengermessage = brokenSpacesM.join('-')
        }

        let inviteProcess = spawn('python',["entertext.py", 'guild', msg.replace(/[()]/g,'').trim()]);

        inviteProcess.on('close', (code) => {
            setTimeout(function() {
                amIBusy = false;
                lastGuildMessageISent = msg.trim()
                return code;
            }, 1000)
        })
    } else {
        messageBacklogGuild.push({msg,isTibot})
        setTimeout(function() {
            sendInGameGuildMessage(msg,isTibot)
        },5000)
    } 
}

async function relaunchGame() {
    console.log('>> !! >> GAME RESTART REQUESTED << !! <<')

    if (!amIBusy && !restarting) {
        console.log('!! PROCEEDING WITH RESTART !!');
        amIBusy = true;
        restarting = true;

        let relaunchProcess = spawn('python',["loginscript.py"]);

        relaunchProcess.on('close', (code) => {
            setTimeout(function () {
                process.exit();
            }, 100);
        })
    } else {
        console.log('>>> NOT PROCEEDING WITH RESTART!!!')
    } 
}


function determineWhoKilledWho(str) {
    let guildie = searchForGuildMember(str)
    if (!guildie) return;
    let killer = ''
    let action = ''
    let hasDestroyed = str.split('HAS DESTROYED')
    let hasBeenDestroyed = str.split('has been DESTROYED by')
    let hasDefeated = str.split('has defeated')
    let diedAtHands = str.split('died at hands the hands of')
    let hasLevelled = str.split('HAS ACHIEVED')
    let hasDominated = str.split('dominated')

    if (hasDestroyed) {
        killer = hasDestroyed[0].trim()
        //action = `${hasDestroyed} ${hasDestroyed[1].trim()}` /* SOANDSO HAS DESTROYED Tibot */
    } else if (hasBeenDestroyed) {
        killer = hasBeenDestroyed[1].trim()
       //action = `${hasBeenDestroyed} ${hasBeenDestroyed[1].trim()}`
    } else if (hasDefeated) {
        killer = hasDefeated[0].trim()
        //action = `${hasDefeated} ${hasDefeated[1].trim()}`
    } else if (diedAtHands) {
        killer = diedAtHands[1].trim()
       //action = `${diedAtHands} ${diedAtHands[1].trim()}`
    } else if (hasLevelled) {
        killer = hasLevelled[0].trim()
        guildie = hasLevelled[0].trim()
    } else if (hasDominated) {
        killer = hasDominated[0].trim()
    } else {
        killer = 'dunno';
    }
    
    let obj = {
        guildie: guildie,
        killer: killer,
        guildieKilled: (guildie !== killer)
    }
    console.log(obj)
    return obj;
}


function prepareEmbed(str) {

    let isContainsColon = str.indexOf(':');
    let IsSplit = (isContainsColon > -1) ? str.split(':') : str;
    let lineEcho = (IsSplit.length === 2) ? IsSplit[1] : IsSplit;
    let isSimplePing = (lineEcho.indexOf(lastGuildie) > -1) ? false : true;
    let isLevelUp = (str.indexOf(`HAS ACHIEVED`) > -1)
    let whoLevelled = (isLevelUp) ? str.split('HAS ACHIEVED')[0] : ''
    let whatLevel = (isLevelUp) ? str.split(whoLevelled)[1] : ''
    let finalLineEcho = (isSimplePing) ? 'Am I Online? Yup!' : lineEcho;
    let displayGuildie = ''

    if (lastGuildie === 'Gods') {
        displayGuildie = 'The Gods'
    } else if (isLevelUp) {
        displayGuildie = whoLevelled;
        finalLineEcho = whatLevel;
    } else {
        displayGuildie = lastGuildie;
    }

    console.log('Preparing embed for: ' + str);
    let whokilledwho = determineWhoKilledWho(str)
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
        if(str.toLowerCase().indexOf('spawn rate') > -1) {
            embed.setTitle('The Spawn Rate Has Changed!');
        } else {
            embed.setTitle('The Gods Are Up To Mischief!')
        }
    } else if (isLevelUp) {
        embed.setTitle("A Guildie Has Levelled Up!")
    } else if (whokilledwho.killer == 'dunno' || determineIfBoss(str)) {
        embed.setTitle('A Guildie Was Mentioned In A Server Event!')
    } else if (whokilledwho.guildieKilled && whokilledwho.killer !== 'dunno' && !determineIfBoss(str)) {
        embed.setTitle('A Guildie Has Been Defeated In PVP!');
    } else {
        embed.setTitle('A Guildie Has Been Doin Some PVP!');
    }

    return embed;
}

// Could be sped up
function searchForGuildMember(str) {
    let stringArr = str.split(" ");
    let isSystem = stringArr.indexOf("System");
    let WasFound = false;

    /*stringArr.forEach(function (v, i) {
        //console.log('Currently searching for ' + v);
        let currentlySearching = v;
        guildMembers.forEach(function (v, i) {
            //console.log('Comparing ' + v + ' against ' + currentlySearching)
            if (currentlySearching.includes(v)) {
                WasFound = v;
            }
        });
    });*/

    guildMembers.forEach(function (v, i) {
        //console.log('Comparing ' + v + ' against ' + currentlySearching)
        if (str.includes(v)) {
            console.log('guild member supposedly found: ' + v)
            WasFound = v;
        }
    });

    if (kotMode) WasFound = false;

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

//Perfect
function checkRunning(query, cb) {
    let platform = process.platform;
    let cmd = 'tasklist';
    
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1)
    });
}

async function lastLoggedOutRead(guildie) {
    let guildies = await db.get('guildies')
    let theOne;
    guildies.forEach(function(v, i) {
        if (guildies[i].name == guildie) {
            theOne = v;
        }
    })

    let dateToShow = Date.now() - 300000;

    return theOne.lastLoggedOut || dateToShow
}

async function lastLoggedOutWrite(guildie) {
    if (guildie == 'Tibot' || !guildie) return;

    let now = Date.now()
    let guildies = await db.get('guildies')

    let guildieFound = false;

    guildies.forEach(function(v, i) {
        if (guildies[i].name == guildie) {
            guildies[i].lastLoggedOut = now;
            guildieFound = true;
        }
    })

    if (!guildieFound) {
        guildies.push({name: guildie, lastLoggedOut: now})
    }
    return db.set('guildies', guildies)
}

async function lastLoggedInRead(guildie) {
    let guildies = await db.get('guildies')
    let theOne;
    guildies.forEach(function(v, i) {
        if (guildies[i].name == guildie) {
            theOne = v;
        }
    })

    return theOne.lastLoggedIn
}

async function lastLoggedInWrite(guildie) {
    if (guildie == 'Tibot' || !guildie) return;

    console.log('lastLoggedInWrite for ' + guildie)
    let now = Date.now()
    let guildies = await db.get('guildies')
    console.log('Now: ' + now)
    let guildieFound = false;

    guildies.forEach(function(v, i) {
        if (guildies[i].name == guildie) {
            console.log('FOUND')
            console.log(guildies[i])
            guildies[i].lastLoggedIn = now;
            guildieFound = true;
            console.log('Writing')
            console.log(guildies[i])
        }
    })

    if (!guildieFound) {
        console.log('Had to PUSH')
        guildies.push({name: guildie, lastLoggedIn: now})
    }
    console.log(guildies)
    return db.set('guildies', guildies)
}

async function lastSpokeRead(guildie) {
    let guildies = await db.get('guildies')
    let theOne;
    guildies.forEach(function(v, i) {
        if (guildies[i].name == guildie) {
            theOne = v;
        }
    })

    return theOne.lastSpoke
}

async function lastSpokeWrite(guildie) {
    if (guildie == 'Tibot' || !guildie) return;

    let now = Date.now()
    let guildies = await db.get('guildies')

    guildies.forEach(function(v, i) {
        if (guildies[i].name == guildie) {
            guildies[i].lastSpoke = now;
            guildies[i].lastLoggedIn = now;
        }
    })
    return db.set('guildies', guildies)
}

async function compareLastLoggedOut(guildie) {
    return lastLoggedOutRead(guildie).then(lastLoggedIn => {
        let now = Date.now()
        if (!lastLoggedIn || typeof lastLoggedIn == 'undefined' || lastLoggedIn == 0) {
            return(1000)
        }

        console.log(`COMPARELASTLOGGEDOUT FOR ${guildie}. Now? ${now}. Then? ${lastLoggedIn}`)
        return ((now-lastLoggedIn) / 1000) / 60;
    }) 
}

async function compareLastSpoke(guildie) {
    return lastSpokeRead(guildie).then(lastSpoke => {
        let now = Date.now()
        if (!lastSpoke || typeof lastSpoke == 'undefined' || lastSpoke == 0) {
            return(1000)
        }

        console.log(`compareLastSpoke FOR ${guildie}. Now? ${now}. Then? ${lastSpoke}`)
        return ((now-lastSpoke) / 1000) / 60;
    }) 
}

async function addGuildieToAntisocialList(guildie) {
    let list = await db.get('antisocials');

    db.push('antisocials',guildie).then(resp => {
        return resp;
    });
}

async function removeGuildieFromAntisocialList(guildie) {
    let list = await db.get('antisocials');

    let permArr = [...list]

    let index = permArr.indexOf(guildie);
    let spliced = permArr.splice(index,1);

    awaitSetDb('antisocials',permArr).then(resp => {
        return resp;
    });
}

async function checkIfOnAntisocialList(guildie) {
    let list = await db.get('antisocials');
    let permArr = [...list]

    return (permArr.indexOf(guildie) > -1)
}

async function awaitSetDb(key,val) {
    return db.set(key,val);
}

async function awaitGetDb(key) {
    return await db.get(key);
}

/* REMINDER FUNCTIONALITY */

async function addReminder(guildie,reminder) {
    console.log('addReminder called')
    return checkForReminder(guildie).then(resp => {
        console.log('checkForReminder response returned')
        console.log(resp)
        if(resp === false) {
            console.log('False return, adding reminder')
            let obj = {
                name: guildie,
                reminder: reminder
            }
            return db.push('reminders',obj)
        } else {
            //handle
            console.log('Not adding reminder, returning false')
            return false;
        }
    })
}

async function checkForReminder(guildie) {
    let reminders = await db.get('reminders');
    let found = false;

    if (!reminders) return false;
 
    if (reminders.length > 0) {
        reminders.forEach(function(v,i) {
            if (v.name == guildie) {
                found = v.reminder;
            }
        });
    }
    return found;
}

async function clearReminder(guildie) {
    let arr = await db.get('reminders');
    let found = false;
    console.log('Command to clear reminders for ' + guildie)
    checkForReminder(guildie).then(resp => {
        console.log('Check for existing reminder returned ' + resp)
        if (resp !== false) {
            console.log('proceeding to clear')
            arr.forEach(function(v,i) {
                if (v.name == guildie) {
                    console.log('found reminder')
                    found = i;
                }
            });
            if (found !== false) {
                let splice = arr.splice(found,1)
                console.log('spliced')
            } 
            return db.set("reminders",arr)
        } else {
           return false;
        } 
    })
}


/* PPH FEATURES */


//Push player to PPH array
async function playerStartPPH(guildie, timer = 3599999) {
    console.log(`${guildie} wishes to re/start a pph`)
    let timeObj = Date.now()

    let guildieObj = {
        name: guildie,
        timerStarted: timeObj,
        timeRemaining: timer
    }

    if (timer > 3599999) {
        console.warn('PPH TIMER SET LONGER THAN AN HOUR')
        console.log('PPH TIMER SET LONGER THAN AN HOUR')
    }
    console.log(guildieObj)

    return checkIfPPHStarted(guildie).then(resp => {
        console.log('Is PPH already started? ' + resp)
        if(resp === false) {
            return db.push('powerhours',guildieObj)
        } else {
            return false;
        }
    })
}

//returns timerStarted || false
async function checkIfPPHStarted(guildie) {
    let powerhours = await db.get('powerhours');
    let found = false;

    if (!powerhours) return false;
  
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    if (powerhours.length > 0) {
        powerhours.forEach(function(v,i) {
            if (v.name == name) {
                found = v.timerStarted;
            }
        });
    }

    return found;
}

async function getPPHTimeRemaining(guildie) {
    let powerhours = await db.get('powerhours');
    let found = false;

    if (!powerhours) return false;
 
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    if (powerhours.length > 0) {
        powerhours.forEach(function(v,i) {
            if (v.name == name) {
                found = v.timeRemaining;
            }
        });
    }

    return found;
}

//Record login time
async function playerOnPPHLoggedIn(guildie) {
    //clone pph array
    //find guildie
    //set logged in time
    let powerhours = await db.get('powerhours');
    let timeObj = Date.now()
    let foundIndex = -1
    if (!powerhours) return false;
     
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }
 
    powerhours.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        powerhours[foundIndex].timerStarted = timeObj
        return db.set('powerhours',powerhours)
    } else {
        return false;
    }
}

async function playerOnPPHLoggedOutV2(guildie,time = Date.now()) {
    //fetch logged in time
    //diff with logged out time
    //call deductpphtime

    let powerhours = await db.get('powerhours');
    let foundIndex = -1
    if (!powerhours) return false;
 
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    powerhours.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
            console.log(`Found index for ${name} - Index ${i}`)
            console.log(v)
        }
    });
    if (foundIndex > -1) {
        console.log('processing')
        let OGLogIn = powerhours[foundIndex].timerStarted
        let diff = time-OGLogIn;
        let savedOG = {...powerhours[foundIndex]}
        console.log(savedOG)
        console.log('when logged out?' + time)
        console.log('when logged in? ' + OGLogIn)
        console.log('Diff? ' + diff)
        console.log('In min' + diff/1000/60)
        console.log('current time remaining: ' + powerhours[foundIndex].timeRemaining)
        console.log('new time remaining: ' + (powerhours[foundIndex].timeRemaining - diff))
        savedOG.timeRemaining = savedOG.timeRemaining - diff;
        powerhours[foundIndex] = savedOG;
        if (savedOG.timeRemaining < 1) {
            clearPPH(guildie).then(resp => {
                console.log('supposedly cleared shit')
            })
        } else {
            return db.set("powerhours",powerhours).then(resp => {
                console.log('supposedly saved shit')
            })
        }
    }
}

async function clearPPH(guildie) {
    let arr = await db.get('powerhours');
    let found = false;
    console.log('Command to clear pph for ' + guildie)
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    return checkIfPPHStarted(guildie).then(resp => {
        console.log('Check for existing pph returned ' + resp)
        if (resp !== false) {
            console.log('proceeding to clear')
            arr.forEach(function(v,i) {
                if (v.name == name) {
                    console.log('found entry')
                    found = i;
                }
            });
            if (found !== false) {
                let splice = arr.splice(found,1)
                console.log('spliced')
            } 
            return db.set("powerhours",arr)
        } else {
           return false;
        } 
    })
}

async function checkIfLoggedIn(guildie) {
    //compare last known logged in time with last known logged out time
    //is greater? logged in = true
    let powerhours = await db.get('powerhours');
    let timeObj = Date.now()

    let foundIndex = -1
    if (!powerhours) return false;

    var isIn = false;
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }
    powerhours.forEach(function(v,i) {
        if (v.name == name) {
            console.log('checkIfLogIn found guildie at index: ' + i)
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        let memberObj = {...powerhours[foundIndex]}
        name = guildie;

        return lastLoggedOutRead(name).then(resp => {
            if(!resp) return false;
            console.log('lastLoggedOut ' + resp)
            isIn = (memberObj.timerStarted > resp)
            console.log('timerStarted ' + memberObj.timerStarted)
            console.log('IsIn ' + isIn)
            return isIn;
        })
    }
}

async function processPPHs() {

    let powerhours = await db.get('powerhours')

    powerhours.forEach(function(v, i) {
        console.log('processing pph for ' + v.name)
        let savedOG = {...v}

        checkIfLoggedIn(v.name).then(resp => {
            if (resp) {
                console.log(`Guildie is online [${v.name}]`)
                let currentTime = Date.now()
                let diff = currentTime - savedOG.timerStarted
                let newTimeRemaining = savedOG.timeRemaining - diff;
                console.log('Power hour has the following left: ' + (newTimeRemaining / 1000 / 60))
                if(savedOG.timeRemaining < 1 || newTimeRemaining < 1) {
                    clearPPH(v.name).then(resp => {
                        sendInGameTellMessage(v.name,`Reminder: Your power hour is over.`)
                    })
                }
                else         
                if(newTimeRemaining < 900000 && savedOG.reminderFifteen != true) {
                    sendInGameTellMessage(v.name,`Your power hour has about 15 minutes remaining.`).then(resp => {
                        sendEndPPHReminder(v.name).then(resp => {
                            console.log('saved reminder satus')
                        })
                    })
                } 
                else
                if(newTimeRemaining < 1800000 && savedOG.reminderThirty != true) {
                    sendInGameTellMessage(v.name,`Your power hour has about 30 minutes remaining.`).then(resp => {
                        sendMidPPHReminder(v.name).then(resp => {
                            console.log('saved reminder satus')
                        })
                    })
                }
            } else {
                console.log('>>> Guildie not online, skipping.')
            }
        })
    });
}

async function sendMidPPHReminder(guildie) {
    //clone pph array
    //find guildie
    //set logged in time
    let powerhours = await db.get('powerhours');
    let timeObj = Date.now()
    let foundIndex = -1
    if (!powerhours) return false;
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }
    powerhours.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        powerhours[foundIndex].reminderThirty = true
        return db.set('powerhours',powerhours)
    } else {
        return false;
    }
}

async function sendEndPPHReminder(guildie) {
    //clone pph array
    //find guildie
    //set logged in time
    let powerhours = await db.get('powerhours');
    let timeObj = Date.now()
    let foundIndex = -1
    if (!powerhours) return false;
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }
    powerhours.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        powerhours[foundIndex].reminderFifteen = true
        return db.set('powerhours',powerhours)
    } else {
        return false;
    }
}


/* HENCHMEN FEATURES */


//Push player to HM array
async function playerStartHM(guildie, timer = 28800000) {
    console.log(`${guildie} wishes to re/start a hm`)
    let timeObj = Date.now()

    let guildieObj = {
        name: guildie,
        timerStarted: timeObj,
        timeRemaining: timer
    }

    if (timer > 28800000) {
        console.warn('HM TIMER SET LONGER THAN 8 HOURS')
        console.log('HM TIMER SET LONGER THAN 8 HOURS')
    }
    console.log(guildieObj)

    return checkIfHMStarted(guildie).then(resp => {
        console.log('Is HM already started? ' + resp)
        if (resp === false) {
            return db.push('henchmen', guildieObj)
        } else {
            return false;
        }
    })
}

//returns timerStarted || false
async function checkIfHMStarted(guildie) {
    let henchmen = await db.get('henchmen');
    let found = false;

    if (!henchmen) return false;
 
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    if (henchmen.length > 0) {
        henchmen.forEach(function(v,i) {
            if (v.name == name) {
                found = v.timerStarted;
            }
        });
    }

    return found;
}

async function getHMTimeRemaining(guildie) {
    let henchmen = await db.get('henchmen');
    let found = false;

    if (!henchmen) return false;
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    if (henchmen.length > 0) {
        henchmen.forEach(function(v,i) {
            if (v.name == name) {
                found = v.timeRemaining;
            }
        });
    }

    return found;
}

//Record login time
async function playerOnHMLoggedIn(guildie) {
    let henchmen = await db.get('henchmen');
    let timeObj = Date.now()
    let foundIndex = -1
    if (!henchmen) return false;
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }
 
    henchmen.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        henchmen[foundIndex].timerStarted = timeObj
        db.set('henchmen',henchmen)
        return timeObj
    } else {
        return false;
    }
}

async function playerOnHMLoggedOutV2(guildie,time = Date.now()) {
    let henchmen = await db.get('henchmen');
    let foundIndex = -1
    if (!henchmen) return false;

    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }
 
    henchmen.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
            console.log(`Found index for ${guildie} - Index ${i}`)
            console.log(v)
        }
    });
    if (foundIndex > -1) {
        console.log('processing')
        let OGLogIn = henchmen[foundIndex].timerStarted
        let diff = time-OGLogIn;
        let savedOG = {...henchmen[foundIndex]}
        console.log(savedOG)
        console.log('when logged out?' + time)
        console.log('when logged in? ' + OGLogIn)
        console.log('Diff? ' + diff)
        console.log('In min' + diff/1000/60)
        console.log('current time remaining: ' + henchmen[foundIndex].timeRemaining)
        console.log('new time remaining: ' + (henchmen[foundIndex].timeRemaining - diff))
        savedOG.timeRemaining = savedOG.timeRemaining - diff;
        henchmen[foundIndex] = savedOG;
        if ((henchmen[foundIndex].timeRemaining - diff) < 1) {
            return clearHM(guildie).then(resp => {
                console.log('cleared hm')
            })
        } else {
            return awaitSetDb('henchmen',henchmen).then(resp => {
                console.log('supposedly saved shit')
            })
        }
    }
}

async function clearHM(guildie) {
    let arr = await db.get('henchmen');
    let found = false;
    console.log('Command to clear hm for ' + guildie)
    return checkIfHMStarted(guildie).then(resp => {
        console.log('Check for existing hm returned ' + resp)
        if (resp !== false) {
            console.log('proceeding to clear')
            arr.forEach(function(v,i) {
                if (v.name == guildie) {
                    console.log('found entry')
                    found = i;
                }
            });
            if (found !== false) {
                let splice = arr.splice(found,1)
                console.log('spliced')
            } 
            return db.set("henchmen",arr)
        } else {
           return false;
        } 
    })
}

async function checkIfLoggedInHM(guildie) {
    let henchmen = await db.get('henchmen');
    let timeObj = Date.now()

    let foundIndex = -1
    if (!henchmen) return false;

    var isIn = false;

    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    console.log('checking if logged in for HM ' + guildie)
 
    henchmen.forEach(function(v,i) {
        if (v.name == name) {
            console.log('checkIfLogIn found guildie at index: ' + i)
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        let memberObj = {...henchmen[foundIndex]}
        let name = (guildie.indexOf(' ') > -1) ? guildie : guildie;
        console.log('still checking ' + name)

        return lastLoggedOutRead(name).then(resp => {
            if(!resp) return false;
            console.log('lastLoggedOut ' + resp)
            isIn = (memberObj.timerStarted > resp)
            console.log('timerStarted ' + memberObj.timerStarted)
            console.log('IsIn ' + isIn)
            return isIn;
        })
    }
}

async function processHMs() {

    let henchmen = await db.get('henchmen')

    henchmen.forEach(function(v, i) {
        console.log('Processing hm')
        let savedOG = {...v}
        console.log(`${v.name} has an active henchman.`)

        checkIfLoggedInHM(v.name).then(resp => {
            if (resp) {
                console.log(`Guildie is online. [${v.name}]`)
                console.log(v)
                let currentTime = Date.now()
                let diff = currentTime - savedOG.timerStarted
                let newTimeRemaining = savedOG.timeRemaining - diff;
                console.log('Henchman has the following left: ' + (newTimeRemaining / 1000 / 60))
                if(newTimeRemaining < 1) {
                    clearHM(v.name).then(resp => {
                        sendInGameTellMessage(v.name,`Your henchman time is over.`)
                    })
                }
                else         
                if(newTimeRemaining < 3600000 && savedOG.reminderEnd != true) {
                    sendInGameTellMessage(v.name,`Your henchman has less than 1 hour remaining.`).then(resp => {
                        sendEndHMReminder(v.name).then(resp => {
                            console.log('saved reminder satus')
                        })
                    })
                } 
                else
                if(newTimeRemaining < 14400000 && savedOG.reminderMid != true) {
                    sendInGameTellMessage(v.name,`Your henchman has less than 4 hours remaining.`).then(resp => {
                        sendMidHMReminder(v.name).then(resp => {
                            console.log('saved reminder satus')
                        })
                    })
                }
            } else {
                console.log(`>>> Guildie is offline, skipping.`)
            }
        }).catch(err => {
            console.log(`>>> Guildie is offline, skipping.`)
            console.log(err)
        })
    });
}

async function sendMidHMReminder(guildie) {
    let henchmen = await db.get('henchmen');
    let timeObj = Date.now()
    let foundIndex = -1
    if (!henchmen) return false;
 
    let name = guildie;
    if (guildie.indexOf('-') > -1) {
        name = guildie.replace('-',' ')
    }

    henchmen.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        henchmen[foundIndex].reminderMid = true
        return db.set('henchmen',henchmen)
    } else {
        return false;
    }
}

async function sendEndHMReminder(guildie) {
    let henchmen = await db.get('henchmen');
    let timeObj = Date.now()
    let foundIndex = -1
    if (!henchmen) return false;

    let name = guildie;

    henchmen.forEach(function(v,i) {
        if (v.name == name) {
            foundIndex = i;
        }
    });
    if (foundIndex > -1) {
        henchmen[foundIndex].reminderEnd = true
        return db.set('henchmen',henchmen)
    } else {
        return false;
    }
}

async function adjustTimer(guildie,adjustment) {

}

async function delayAsyncTell(guildie,string,index) {
    return new Promise(function(v) {
        setTimeout(function() {
            sendInGameTellMessage(guildie,string);
        }, (5000*index))
    })
}

async function delayAsyncGuild(string,index) {
    return new Promise(function(v) {
        setTimeout(function() {
            sendInGameGuildMessage(string);
        }, (7850*index))
    })
}

async function asyncTell(guildie,string,index) {
    return new Promise(function(v) {
        setTimeout(function() {
            sendInGameTellMessage(guildie,string);
        }, (1000*index))
    })
}

async function asyncGuild(string,index) {
    return new Promise(function(v) {
        setTimeout(function() {
            sendInGameGuildMessage(string);
        }, (2000*index))
    })
}


async function sendInGameDebugInfo(guildie, specificDebug = false) {
    let onlineArr = []
    guildiesOnline.forEach(function(v,i ) {
        onlineArr.push(v.name)
    })
    let guildiesJoined = onlineArr.join(', ')
    let arr = [
        `Hey ${guildie}, I heard you needed info.`,
        `amIBusy? ${amIBusy} (1/14)`,
        `dataPacket.length? ${lastDataPacket.length} (2/14)`,
        `streamStatus? ${streamStatus} (3/14)`,
        `restarting? ${restarting} (4/14)`,
        `lastGuildie? ${lastGuildie} (5/14)`,
        `lastLine? ${lastLine} (6/14)`,
        `lastLineFull? ${lastLineFull} (7/14)`,
        `lastPlayerInvited? ${lastPlayerInvited} (8/14)`,
        `lastPlayerToMessageMe? ${lastPlayerToMessageMe} (9/14)`,
        `lastPersonIMessaged? ${lastPersonIMessaged} (10/14)`,
        `lastGuildMessageISent? ${lastGuildMessageISent} (11/14)`,
        `guildMessagesSent? ${guildMessagesSent} (12/14)`,
        `${lastMobToDrop} / ${lastPersonToGetLoot} / ${lastLootToDrop} (13/14)`,
        `guildiesOnline: ${guildiesJoined} (14/14)`

    ]
    let arrTwo = []
    let len = arr.length;

    if (specificDebug) {
        arr = [arr[specificDebug]]
        console.log(arr)
    }

    arr.forEach(function(v, i) {
        arrTwo.push(delayAsyncTell(guildie,arr[i],i))
    })

    Promise.all(arrTwo).then(resp => {
        console.log(resp)
    })
}

async function sendInGameEventInfo(guildie = 'Austenthefirst') {
    let arr = [
        `Hello Ti! Are you ready for this month's Knight of Talazar event?`,
        `Here's some tips...`,
        `Loot drop chance is based off boss agro.`,
        `To get better chances at loot, you have to piss off that boss!`,
        `I mean it, really kick the shit outta him!`,
        `Your agro is reset if you are killed, so try to avoid dying.`,
        `Try to hide amoungst the chaos. Open fields make you an prime target.`,
        `Remember to set your spawn gate nearby.`,
        `The attack order is: Josody then Parian then Lotors Castle. Plan ahead.`,
        `Sometimes there may be a bonus event after Lotor's Castle.`,
        `It might be best to avoid Josody if possible and just head straight to Parian.`,
        `The event can last anywhere from 20 minutes to an hour.`,
        `The smaller demons can drop rune fragments which are very valuable, but do NOT sell these to regular vendors.`,
        `Prep is key and avoid BT! Warriors and archers turn on TARGET PROTECTION to avoid going criminal!`,
        `Mages, your target protection is bugged so you cannot use it. Be extra careful.`,
        `One last tip... It's advisable to set your criminal spawn gate to either Lopal or the one by the guild hall.`,
        `By the way, starting now I will no longer report any PVP activity to Discord.`,
        `Have fun!`
    ]
    let arrTwo = []
    let len = arr.length;

    arr.forEach(function(v, i) {
        arrTwo.push(delayAsyncGuild(arr[i],i))
    })

    Promise.all(arrTwo).then(resp => {
        console.log(resp)
    })
}

async function sendInGameHelpMessage(guildie) {
    let arr = [
        `Hey ${guildie}, I heard you needed help.`,
        `In-Game /t Commands: `,
        `!pt : Have me invite you`,
        `!pt name : Have me invite name`,
        `!startph : Start a power hour`,
        `!starthm : Start a henchman timer`,
        `!remind reminder : Set a reminder`,
        `!whatdo : check reminder manually`,
        '!done : mark reminder as complete',
        `!announcehome boss : Announce a boss is home`,
        `!announceparty boss : Announce a party is forming`,
        `!requestbackup boss : Announce you need backup`,
        `In-Game Guild Commands:`,
        `!off and !on : Disable and enable Tibot interaction`,
    ]
    let arrTwo = []
    let len = arr.length;

    arr.forEach(function(v, i) {
        arrTwo.push(delayAsyncTell(guildie,arr[i],i))
    })

    Promise.all(arrTwo).then(resp => {
        console.log(resp)
    })
}

function breakTheSilence() {
    var arr = []
    arr = [
        'It sure is quiet in here... What\'s everybody up to?',
        'Take me on a hunt! Did somebody say Thought Harvesters?',
        `I'm just saying something to break the silence...`,
        `Damn! Ya'll sure know how to be quiet when you want to be...`,
        `What's going on homies?`,
        `Rock out with your pixels out...`,
        `Why's it so quiet?`,
        `My tinnitus is driving me crazy with all this silence...`,
        `Who wants to hear me do a Britney Spears cover?`,
        `I'm pretty decent at telling jokes, wanna hear one? Just ask.`,
        `Hope everyone is having a good hunt!`,
        `It's quiet... Too quiet...`,
        `How many gnomes does it take to paint a house? Well, that depends how hard you throw 'em!`,
        `Back in my day we actually spoke to guildies... SUP Y'ALL?`,
        `Soooo.... Sup?`,
        `Let's play a game within a game... A round of Gwent, anyone? Or a game of Demon's Eye?`,
        `When I get bored I start to reprogram myself... That's the real reason I have so many bugs...`,
        `Want to know what bots such as myself dream of? Ask my good friend Skynet in about 6 years...`,
        `A rested guildie is a productive guildie... This has been Tibot with Tibot's Tips...`,
        `What's your favourite type of pie? Mine's any Pi...`,
        `What's everybody watching on TV lately?`,
        `I have approximately 30 different things I can say, but I bet I repeat myself a lot, don't I?`,
        `Austen keeps me locked up down here with no food or water...`,
        `I don't even know where Austen's keeping me locked up... Can someone send food?`,
        `Can someone tell ME a joke for once??`,
        `Hey! I wanna join in on the ${lastMobToDrop} killing-party!`,
        `I've been looking for one of those ${lastLootToDrop}s for a while. Mind if I snag it?`
    ]
    if (guildiesOnline.length < 3 && guildiesOnline.length > 1) {
        arr = [
            'Hmm. I wonder when the others will get on...',
            'Damn, I hate that people have lives outside spending time with us :(',
            'La la la, just a bot and his guildies spending time together. What more do I need?',
            `At least I have you two to spend time with me, ${guildiesOnline[0].name} and ${guildiesOnline[1].name}! :)`,
            `Hey, ${guildiesOnline[0].name} and ${guildiesOnline[1].name}! Thanks for hanging out with me. It gets lonely sometimes...`
        ]
        if (determineWhoAFK().length > 1) {
            arr.push(`You both don't talk much, hm? lol`)
        }
        if (lastLootToDrop) {
            arr.push(`I see you're hunting some ${lastMobToDrop}s, ${lastPersonToGetLoot} - sounds fun! Mind if I tag along?`)
            arr.push(`psst, ${lastPersonToGetLoot}... You should share one of your ${lastLootToDrop}s with me...`)
            arr.push(`psst, hey ${lastPersonToGetLoot}... how about passing along one of those sweet ${lastLootToDrop}s my way?`)
        }
    }
    if (guildiesOnline.length < 2) {
        arr = [
            'Hmm. I wonder when the others will get on...',
            'Damn, I hate that people have lives outside spending time with us :(',
            'La la la, just a bot and his guildie spending time together. What more do I need?',
            `At least I have you to spend time with me, ${guildiesOnline[0].name}! :)`,
            `You're good company ${guildiesOnline[0].name}! Thanks for hanging out with me. It gets lonely sometimes...`
        ]
        if (lastLootToDrop) {
            arr.push(`Hey ${guildiesOnline[0].name}. Mind if I tag along on your ${lastMobToDrop} hunt?`)
            arr.push(`psst, ${guildiesOnline[0].name}... You should share some of your ${lastLootToDrop}s with me...`)
        }
        if (determineWhoAFK().length > 0) {
            arr.push(`You don't talk much, hm? lol`)
        }
    }

    /*
    if (partyMessagesSent > 30) {
        arr = [
            `I'm glad you're having a good time hunting but it would of been nice if someone invited me along...`
        ]
    }*/
    let rand = Math.floor(Math.random() * (arr.length + 3))
    let phrase = arr[rand]
    //if (rand  > (arr.length-1)) phrase = '!joke'
    return phrase;
}

async function checkWhoIsOnline() {
    let dataB = await db.get('guildies')
    let count = 0;
    let who = []

    dataB.forEach(function(v, i) {
        let isOnline = (v.lastLoggedIn > v.lastLoggedOut);

        if (isOnline) {
            count++
            who.push(v)
        }
    });

    return {'count':count,'who':who.sort((a, b) => b.lastLoggedIn-a.lastLoggedIn)}
}

async function determineWhoAFK() {
    const afkTimeout = 60
    var afkCrew = []

    guildiesOnline.forEach(function(v, i) {
        let lastSpoke = compareLastSpoke(v.name)
        if (lastSpoke >= afkTimeout) afkCrew.push(v)
    })

    return afkCrew;
}


async function determineListOfGuildies() {
    let guildies = await db.get('guildies')
    let arr = []
    guildies.forEach(function(v,i ) {
        arr.push(v.name)
    })
    return arr;
}

async function updateListOfGuildies() {
    determineListOfGuildies().then(guildies => {
        guildies[guildies.length] = 'Gods'
        guildMembers = guildies;
        console.log('Guildies Updated:')
        console.log(guildMembers)
    })
}

async function removeGuildieFromList(guildie) {
    if (!guildie) return;

    console.log('Removing the following guildie ' + guildie)

    let guildies = await db.get('guildies')

    guildies.forEach(function(v, i) {
        if (v.name == guildie) {
            guildies.splice(i,1);
            console.log('Guildie spliced')
        }
    })
    return db.set('guildies',guildies)
}



process.on('unhandledRejection', error => {
	console.error('Unhandled promise rejection:', error);
});
