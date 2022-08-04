module.exports = {
	name: 'multi',
	description: 'Used to create a single, multi-seeded card from the network.',
	usage: '[--switch name 1] [--switch name 2] [--switch name 3] ...',
	pages: [`**Seeded Switches:**
	--name, --n
	--cost, --c
	--supertype, --sp
	--type, --t
	--subtype, --sb
	--loyalty, --l
	--powertoughness, --pt
	--rules, --r
	--rarity, --rr
	--dfc, --bside
	--end
	--seed, --s
	
	**Normal Switches:**
	--temp   *<- this is temperature*
	--tlevel [1-70]  *<- this is training level*
	--cards [1-50]
	--text   *<- outputs cards in a .txt file*
	--mse   *<- outputs cards in a file usable with MSE*
	--length *<- amount of characters to generate. Useful for longer cards like planeswalkers*
	
	If --temp, --tlevel, or --cards are not set, they use their defaults of 0.8, 70, and 1 respectively.
	**If no seeded switches are set, the bot generates a random card.**`,
	
	`All switches accept multiple names, separated by spaces. Examples below:
	\`--sp legendary snow\`
	\`--type enchantment creature\`
	\`--sb bird ape wizard\`
	\`--name glorious destruction\`
	
	**Example:** \`mtg!create --type artifact --temp 1.1\`
	This will generate an artifact card, using Temperature 1.1
	
	**Example:** \`mtg!create --t creature --sp legendary --sb bird wizard\`
	This will generate a Legendary Creature - Bird Wizard, using the default temperature and training level`,
	
	`**Mana Costs**
	-Mana symbols are *"double charatcer encoded"*. A <:U_:734751083230134282> is represented by **__UU__**. <:UR:734751095381033091> is **__UR__**
	-Same goes for <:X_:734751108035117136>, energy, snow, etc.
	-seeding \`--cost\` requires just the mana symbols and numbers.
	-seeding \`--rules\` requires mana symbols to be wrapped in { }. Example: {UR}{BP}{14}
	
	**Text Syntax**
	ALL TEXT MUST BE LOWERCASE (exceptions are mana costs and other symbols)
	-seeding \`--rules\` has special requirements. To include a newline on the card, use a single \`\\\`. Example: \`--r flash\\flying\\whenever this creature...\`
	-"X" should be uppercase when not referencing a cost.
	-Tap and Untap are T and Q (not wrapped in brackets)`,
	
	`**--End**
	If you do not include \`--end\`, the primetext will not be "closed" and the bot will be able to add on to the last field you gave it. If you include \`--end\`, your end field will not be altered. Allowing the bot to edit your last field can be useful if you want to seed on just **rules text** or **cost**.`],
	
	aliases: ['m', 'ms', 'multiseed'],
	cooldown: 5,
	
	execute(message, args) {
		//test for --queue switch. If found, reply with what's queued. Do not generate a card
		if ((message.author.id == '132287419117600768' || message.author.id == '142820638007099393' || message.author.id == '101868879935991808') && args[0] == "--queue") {
			message.channel.send(`Processing: ${lastmessage}`);
			message.channel.send("Items in queue:");
			//all queued items are stored in commandqueuemany
			for (i = 0; i < commandqueuemany.length; i++)
				message.channel.send(commandqueuemany[i][0]);
		}
		//test for --reset switch. If found, unlock the queue and reset lastid
		else if ((message.author.id == '132287419117600768' || message.author.id == '142820638007099393' || message.author.id == '101868879935991808') && args[0] == "--reset") {
			lastid = "";
			run = true;
			message.channel.send("Queue has been reset");
		}
		//if user has a job running, don't accept another one.
		//else if (message.author == lastid)
			//message.channel.send("You already have a running job! Please wait until it finished.")
		else if (GenerationChannel(message) == true) {
			//send message if queue is backed up or a job is running
			if (commandqueuemany.length > 0 || run == false) {
				message.channel.send(`Your request for a card was received. There are currently ${commandqueuemany.length} card jobs in the queue, or a job is currently running. Please wait a moment!`)
			}
			//add incoming command to the queue
			commandqueuemany.push([message, args])
		}
	},
};

const fs = require("fs")
const { exec } = require('child_process');
const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const { RndInteger, capitalize, replaceManaSymbols, dateTime, toUnary, WriteCardsCreated, GenerationChannel } = require('../functions.js');
const { CardCheckpoint } = require('../cardposting.js');

var _switchSet = ["name", "n", "cost", "c", "supertype", "sp", "subtype", "sb", "type", "t", "loyalty", "l", "powertoughness", "pt", "rules", "r", "rarity", "rr", "end", "end", "seed", "s"];


//queues incoming commands and executes the next one as soon as the previous one is done running
var run = true;
var lastid = "";
var lastmessage = "";
function Queue(message, args){
	if (run) {
		var command = commandqueuemany.shift();
		//Attempt to execute the command
		try {
			lastmessage = command[0];
			Start(command[0], command[1]);
		} catch (error) {run = true}
	}
}
var commandqueuemany = []
setInterval(Queue, 1000);


//Filter inputs
//args[0] - seed/primetext
//args[1] - temp
//args[2] - tlevel
//args[3] - number of cards
//args[4] - contains priming end character, if specified
//args[5] - number seed
//args[6] - chars to generate
//args[7] - switch for mse
//args[8] - switch for raw file output
//args[9] - [[unused]] - !generate uses this field
//args[10] - stores generated cards
//args[11] - temp stores number of cards (decrements)
//args[12] - model name
//args[13] - 
//args[14] - contains "ended" switches
function Start(message, _in) {
	lastid = message.author
	input = " " + _in.join(" ")
	console.log(input)
	switches = input.split(' --')
	var _switch = ''
	
	//initialize base settings
	args = [[], 0.86, 70, 1, '', 0, [], 'nomse',,,,,'',,""]
	//generate random seed
	args[5] = RndInteger(1,1000000000000000)
	for (i = 1; i < switches.length; i++) {
		//get next switch
		try {
			_switch = switches[i].split(/ (.+)/)
			//test cases
			switch (_switch[0]) {
			case "name":
			case "n":
				args[0].push(`|1${_switch[1].toLowerCase()}`);
				args[6].push(30);
				break;
			case "cost":
			case "c":
				args[0].push(`|3{${_switch[1].toUnary().replace(/&/g,'').replace('{','').replace('}','')}`);
				args[6].push(20);
				break;
			case "supertype":
			case "sp":
				args[0].push(`|4${_switch[1].toLowerCase()}`);
				args[6].push(20);
				break;
			case "type":
			case "t":
				args[0].push(`|5${_switch[1].toLowerCase()}`);
				args[6].push(20);
				break;
			case "subtype":
			case "sb":
				args[0].push(`|6${_switch[1].toLowerCase()}`);
				args[6].push(30);
				break;
			case "loyalty":
			case "l":
				args[0].push(`|7${_switch[1].toUnary()}`);
				args[6].push(30);
				break;
			case "powertoughness":
			case "pt":
				args[0].push(`|8${_switch[1].toUnary()}`);
				args[6].push(50);
				break;
			case "rules":
			case "r":
				args[0].push(`|9${_switch[1].toUnary().replace('{&','{').replace(/\\$/,`\\\\`)}`);
				args[6].push(400);
				break;
			case "rarity":
			case "rr":
				args[0].push(`|0${_switch[1].replace('common', 'O').replace('uncommon', 'N').replace('rare', 'A').replace('mythic', 'Y')}`);
				args[6].push(5);
				break;
			case "dfc":
			case "bside":
				args[0].push(`|2!`);
				args[6].push(5);
				break;
			case "end":
			case "e":
				var _last = args[0].pop()
				if (_last.includes(`|3`))
					_last += `}`;
				args[14] += _last
				break;
				
			case "text":
				args[8] = true;
				break;
			case "mse":
				args[8] = true;
				args[7] = 'mse';
				break;
			case "seed":
			case "s":
				args[5] = _switch[1]
				break;
			case "model":
			case "m":
				args[12] = _switch[1]
				break;
				
			case "temp":
				args[1] = _switch[1].replace(/,/g, ' ')
				break;
			case "tlevel":
				args[2] = _switch[1].replace(/,/g, ' ')
				break;
			case "cards":
				args[3] = _switch[1].replace(/,/g, ' ')
				break;
				
			default:
				message.reply(`Switch \`${_switch[0]}\` does not exist. Creating your cards without this parameter.`).then(msg => {
					setTimeout(() => msg.delete(), 10000)
				});
			}
		} catch (err) {console.log(err) }
	}
	args[11] = 0
	
	if (args[0].length == 0)
		message.channel.send("Multiseed requires at least 1 seed.")
	else
		ArgsCheck(message, args)
}


function ArgsCheck(message, args) {
	//fix model to proper term used in backend based on channel command came from
	if (args[12] != 'mtg' && args[12] != 'msem' && args[12] != 'mixed' && args[12] != 'reminder' && args[12] != 'everything' && args[12] != '') {
		args[12] = 'mtg'
	}
	else if (args[12] == '') {
		if (message.channel.id == '734244277122760744')
			args[12] = 'msem'
		else if (message.channel.id == '779947284262551584')
			args[12] = 'mixed'
		else if (message.channel.id == '850935526545424404')
			args[12] = 'reminder'
		else if (message.channel.id == '890996406087712780')
			args[12] = 'everything'
		else
			args[12] = 'mtg'
	}
	
	//filter Temp arg
	if (isNaN(args[1])) {
		//message.channel.send(`**TEMPERATURE** input was not a number. Received: ${args[2]}. Automatically set to 0.8.`)
		args[1] = 0.8
	}
	
	//filter TLevel arg
	if (isNaN(args[2])) {
		//message.channel.send(`**TRAINING LEVEL** input was not a number. Received: ${args[3]}. Automatically set to 70.`)
		args[2] = 70
	}
	if (args[2] < 1 || args[2] > 70) {
		//message.channel.send(`**TRAINING LEVEL** input was outside the range of 1 and 70. Received: ${args[2]}. Automatically set to 70.`)
		args[2] = 70
	}
	args[2] = args[2] - 1//sub 1 because array is 0-69.
	
	//filter "amount of cards" arg
	if (isNaN(args[3]))
		args[3] = 1
	if (args[3] > 10)//cap cards at 10
		args[3] = 10
	else if (args[3] < 1)//minimum is 1 card
		args[3] = 1
	
	//initialize array at 10 to store cards in
	args[10] = []
	
	//set run to false to stop queue from loading next
	run = false
	//delete some old files before starting
	exec(`rm /mnt/c/mtg-rnn/primepretty.txt; rm ~/mtg-rnn/prime2.txt;`, (err, stdout, stderr) => {})
	
	//some logging
	console.log(`[${dateTime()}] Multi - ${message.guild.name}/${message.member.user.tag} requested ${args[3]} cards.`)
	console.log(`[${dateTime()}] Multi - Using: TEMP:${args[1]}, LEVEL:${args[2]}.`)
	
	message.reply(`Your command has been received from the queue to generate ${args[3]} cards.
	Generating the batch of cards now... Please wait a moment!`).then(msg => {
		CreateSeededCard(message, args)
		setTimeout(() => msg.delete(), 10000)
	});
}


//Creates a batch of seeded cards. Runs a for loop, as each seeded card needs to be generated separately,
//unlike unseeded batches.
//Running them one after another was far too slow. With this loop, it creates them all in parallel.
function CreateSeededCard(message, args) {
	for (q = 0; q < args[0].length * args[3]; q++) {
		//script takes args in order:
		//temp, seed, tlevel, primetext, char length, model
		exec(`bash ~/mtg-rnn/createmulti.sh ${args[1]} ${args[5] + q} ${args[2]} "${args[0][q % args[0].length]}" 300 "${args[12]}"`, (err, stdout, stderr) => {
			if (err) {
				console.log("card generate error")
				//args[10].push("card generate error")
			}
			
			//card generation runs in parallel, so this increments for each card when it finishes
			//then sends to next function when all are done
			//done this way because the for loop will finish execution before cards are done generating
			args[11]++
			if (args[11] == args[0].length * args[3])
				ReadCards(message, args)
		});
	}
}


//Read the generated cards and then pretty them up for display
function ReadCards(message, args) {
	//arg input is MSE (true/false)
	exec(`bash ~/mtg-rnn/prettymulti.sh`, (err, stdout, stderr) => {
		//Splitcards(message, args)
		fs.readFile(`multiprime.txt`, 'utf8' , function (err, data) {
			if (err) {
				console.log(`file read error ${err}`)
				message.channel.send("Failed to read from generated file :( Please try again.")
				run = true
			}
			else {
				//store each seeded segment in this array
				args[10] = data.split('\n\n').slice(0);
				//store how many switches were seeded
				seeds = args[0].length
				//reset these args to store new data
				args[11] = 0
				args[0] = []
				
				while (args[11] < args[3]) {
					var primetext = `${args[14]}|`;
					//iterate over array to build our final string
					for (i = 0; i < seeds; i++) {
						//split on '|' to separate all fields
						try {
							primetext += `${args[10][i + (seeds * args[11])].split('|')[1]}|`
						} catch (err) {
							console.log(err)
							message.reply(`Something went wrong and we don't know what. Please try again.`).then(msg => {
								setTimeout(() => msg.delete(), 10000)
							});
							run = true
							return;
						}
					}
					primetext = primetext.replace(`$$`, `$\\$`)
					//once card is done being built, add to args[0] and increment [11]
					//args[0] holds each of the completed multiseeds to pass to the final generator
					args[0].push(primetext)
					args[11]++
				}
				CreateSeededCard2(message, args)
			}
		});
	});
}


function CreateSeededCard2(message, args) {
	//have to reset args[11] since it was used earlier
	args[11] = 0
	for (q = 0; q < args[3]; q++) {
		//script takes args in order:
		//temp, seed, tlevel, primetext, char length, model
		exec(`bash ~/mtg-rnn/createsingle.sh ${args[1]} ${args[5] + q} ${args[2]} "${args[0][q]}" 500 "${args[12]}"`, (err, stdout, stderr) => {
			if (err) {
				console.log("card generate error")
				args[10].push("card generate error")
			}
			//card generation runs in parallel, so this increments for each card when it finishes
			//then sends to next function when all are done
			//done this way because the for loop will finish execution before cards are done generating
			args[11]++
			if (args[11] == args[3])
				ReadCards2(message, args)
		});
	}
}


//Read the generated cards and then pretty them up for display
function ReadCards2(message, args) {
	//arg input is MSE (true/false)
	exec(`bash ~/mtg-rnn/prettycards.sh ${args[7]}`, (err, stdout, stderr) => {
		Splitcards(message, args)
	});
}

//Takes the prettied cards and splits them into an array for processing.
//Also takes care of file attachments if requested.
function Splitcards(message, args) {
	var datestr = dateTime().replace(/:/g,'').replace(/ /g,'_');
	fs.rename('/mnt/c/mtg-rnn/primepretty.txt', `/mnt/c/mtg-rnn/${datestr}.txt`, () => {
	fs.rename('/mnt/c/mtg-rnn/primepretty.txt.mse-set', `/mnt/c/mtg-rnn/${datestr}.mse-set`, () => {});
	
	fs.readFile(`/mnt/c/mtg-rnn/${datestr}.txt`, 'utf8' , function (err, data) {
		if (err) {
			console.log("file read error")
			/*args[10].push(data)
			CardCheckpoint(message, args)*/
			message.channel.send("Failed to read from generated file :( Please try again.")
			run = true
		}
		else {
			//test if user specified if they want a text file or not
			//true is text file
			//If text=false, bot needs to process the cards and output embeds
			if (!args[8]) {
				//split cards into an array for easier processing
				args[10] = data.split('\n\n').slice(0);
				CardCheckpoint(message, args)
				//delete the file now that we're done with it
				fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.txt`);
				//re-enable the queue
				run = true
				lastid = ""
			}
			//if text=true, bot has less processing to do
			else {
				//re-enable the queue
				run = true
				lastid = ""
				WriteCardsCreated(args[3]);
				
				//attach text file to channel message
				//also send MSE file if requested
				if (args[7] == 'mse') {
					try {
						message.channel.send({
							content: `${message.author}, you requested an MSE file.`,
							files: [`/mnt/c/mtg-rnn/${datestr}.mse-set`]
						}).then(function() {
							fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.mse-set`);
							fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.txt`);
						});
					}
					catch (err) { }
				}
				else {
					message.channel.send({
						content: `${message.author}, you requested a text file, or more than 30 cards (${args[3]}), so you get them in raw text!\nseed: ${args[5]}`,
						files: [`/mnt/c/mtg-rnn/${datestr}.txt`]
					}).then(function() {
						fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.txt`);
					});
				}
			}
		}
	});
	});
}