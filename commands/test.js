module.exports = {
	name: 'test',
	description: 'Used to create a single card from the network.',
	usage: '[--switch name 1] [--switch name 2] [--switch name 3] ...',
	pages: [" "],
	aliases: ['t'],
	cooldown: 1,
	
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
		else {
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
const { MessageAttachment, MessageEmbed } = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const { RndInteger, capitalize, replaceManaSymbols, dateTime, toUnary, WriteCardsCreated } = require('../functions.js');

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
//args[7] - switch for images
//args[8] - switch for file type
//args[9] - [[unused]] - !generate uses this field
//args[10] - stores generated cards
//args[11] - temp stores number of cards (decrements)
//args[12] - model name
//args[13] - 
//args[14] - date string
function Start(message, _in) {
	lastid = message.author
	input = " " + _in.join(" ")
	console.log(input)
	switches = input.split(' --')
	var _switch = ''
	var _costopen = false;
	
	//initialize base settings
	args = ['', 0.86, 70, 1, '', 0, 0, true, 'mse',,,,'']
	//generate random seed
	args[5] = RndInteger(-1000000000000000,1000000000000000)
	
	for (i = 1; i < switches.length; i++) {
		_switch = switches[i].split(/ (.+)/)
		//if cost is open, close it if another primetext field is being entered
		if (_costopen && _switchSet.indexOf(_switch[0]) >= 0) {
			args[0] += "}"
			_costopen = false;
		}
		//get next switch
		try {
			_switch = switches[i].split(/ (.+)/)
			//test cases
			switch (_switch[0]) {
			case "name":
			case "n":
				args[0] += `|1${_switch[1].toLowerCase()}`;
				break;
			case "cost":
			case "c":
				args[0] += `|3{${_switch[1].toUnary().replace(/&/g,'')}`;
				_costopen = true;
				break;
			case "supertype":
			case "sp":
				args[0] += `|4${_switch[1].toLowerCase()}`;
				break;
			case "type":
			case "t":
				args[0] += `|5${_switch[1].toLowerCase()}`;
				break;
			case "subtype":
			case "sb":
				args[0] += `|6${_switch[1].toLowerCase()}`;
				break;
			case "loyalty":
			case "l":
				args[0] += `|7${_switch[1].toUnary()}`;
				break;
			case "powertoughness":
			case "pt":
				args[0] += `|8${_switch[1].toUnary()}`;
				break;
			case "rules":
			case "r":
				args[0] += `|9${_switch[1].substring(0, 100).toUnary().replace('{&','{')}`;
				break;
			case "rarity":
			case "rr":
				args[0] += `|0${_switch[1].replace('common', 'O').replace('uncommon', 'N').replace('rare', 'A').replace('mythic', 'Y')}`;
				break;
			case "end":
			case "e":
				args[4] += `|`;
				break;
				
			case "file":
				args[8] = _switch[1];
				break;
			case "noimages":
				args[7] = false;
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
			case "length":
				args[6] = _switch[1]
				break;
				
			default:
				message.reply(`Switch \`${_switch[0]}\` does not exist. Creating your cards without this parameter.`).then(msg => {
					setTimeout(() => msg.delete(), 10000)
				});
				}
			} catch (err) {console.log(err) }
	}
	
	//replace \ with \\ if it appears at the end of the primetext
	//also replace $$ with '$$' to not break bash scripts
	args[0] = args[0].replace(/\\$/,`\\\\`).replace('$$', '77').replace('$', '').replace(`77`, `$\\$ `)
	args[0] = args[0].substring(0, 100)
	args[0] += args[4]
	
	args[11] = 0
	
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
	if (args[3] > 10) {//if more than 30 cards, set text flag
		args[7] = false
		args[8] = 'text'
	}
	if (args[3] > 10)//cap cards at 100
		args[3] = 10
	else if (args[3] < 1)//minimum is 1 card
		args[3] = 1
	
	//set amount of chars to generate for mass creation.
	//this overcompensates a little, in case long cards are created.
	//if priming, set to 300. This is well enough for 1 card, usually.
	if (isNaN(args[6]) || !isFinite(args[6]) || args[6] < 1)
		args[6] = 0
	if (args[6] == 0) {
		if (args[0].length > 2)
			args[6] = 300
		else
			//if not priming, multiply amount of cards wanted by 250.
			args[6] = (250 * args[3])
	}
	
	//check args[8] file type
	if (args[8] != 'text' && args[8] != 'txt' && args[8] != 'mse')
		args[8] = 'text'
	
	//initialize array at 10 to store cards in
	args[10] = []
	
	//set run to false to stop queue from loading next
	run = false
	//delete some old files before starting
	exec(`rm /mnt/c/mtg-rnn/primepretty.txt; rm ~/mtg-rnn/prime2.txt;`, (err, stdout, stderr) => {})
	
	//some logging
	console.log(`[${dateTime()}] Test - ${message.guild.name}/${message.member.user.tag} requested ${args[3]} cards.`)
	console.log(`[${dateTime()}] Test - Using: TEMP:${args[1]}, LEVEL:${args[2]}.`)
	
	message.channel.send(`Your command has been recieved from the queue to generate ${args[3]} cards.
	Generating the batch of cards now... Please wait a moment!`).then(msg => {
		//switch between single seeded cards, or mass creation.
		//based on if primetext is empty or not
		if (args[0] != '')
			CreateSeededCard(message, args)
		else
			CreateManyCards(message, args)
		setTimeout(() => msg.delete(), 10000)
	});
}


//Creates a batch of seeded cards. Runs a for loop, as each seeded card needs to be generated separately,
//unlike unseeded batches.
//Running them one after another was far too slow. With this loop, it creates them all in parallel.
function CreateSeededCard(message, args) {
	for (q = 0; q < args[3]; q++) {
		//script takes args in order:
		//temp, seed, tlevel, primetext, char length, model
		exec(`bash ~/mtg-rnn/createsingle.sh ${args[1]} ${args[5] + q} ${args[2]} "${args[0]}" ${args[6]} "${args[12]}"`, (err, stdout, stderr) => {
			if (err) {
				console.log("card generate error")
				args[10].push("card generate error")
			}
			//card generation runs in parallel, so this increments for each card when it finishes
			//then sends to next function when all are done
			//done this way because the for loop will finish execution before cards are done generating
			args[11]++
			if (args[11] == args[3])
				ReadCards(message, args)
		});
	}
}


//Similar to the SeededCard function, but runs a different bash script. Doesn't require a loop
//as it generates all of its cards in one go. Though it does take longer.
function CreateManyCards(message, args) {
	//script takes args in order:
	//temp, seed, tlevel, primetext, char length, model
	exec(`bash ~/mtg-rnn/createmany.sh ${args[1]} ${args[5]} ${args[2]} "${args[0]}" ${args[6]} "${args[12]}"`, (err, stdout, stderr) => {
		if (err) {
			console.log("card generate error")
			args[10].push("card generate error")
			args[3] = 1
			CardCheckpoint(message, args)
		} 
		else {
			ReadCards(message, args)
		}
	});
}


//Read the generated cards and then pretty them up for display
//Runs a different bash script depending if input was seeded or not, as file
//generation is different for each.
function ReadCards(message, args) {
	//save the date string
	args[14] = dateTime().replace(/:/g,'').replace(/ /g,'_');
	if (args[0] != '') {
		//arg input is MSE (true/false)
		exec(`bash ~/mtg-rnn/testcards.sh ${args[8]}`, (err, stdout, stderr) => {
			fs.rename('/mnt/c/mtg-rnn/primepretty.txt', `/mnt/c/mtg-rnn/${args[14]}.txt`, () => {
				fs.rename('/mnt/c/mtg-rnn/primepretty.txt.mse-set', `/mnt/c/mtg-rnn/${args[14]}.mse-set`, () => {});
			});
			Splitcards(message, args)
		});
	}
	else {
		//arg input is MSE (true/false)
		exec(`bash ~/mtg-rnn/testmany.sh ${args[8]}`, (err, stdout, stderr) => {
			fs.rename('/mnt/c/mtg-rnn/primepretty.txt', `/mnt/c/mtg-rnn/${args[14]}.txt`, () => {
				fs.rename('/mnt/c/mtg-rnn/primepretty.txt.mse-set', `/mnt/c/mtg-rnn/${args[14]}.mse-set`, () => {});
			});
			Splitcards(message, args)
		});
	}
}


//Takes the prettied cards and splits them into an array for processing.
//Also takes care of file attachments if requested.
function Splitcards(message, args) {
	exec(`bash ~/mtg-rnn/mse-cli.sh ${args[14]}`, (err, stdout, stderr) => {
		if (err)
			console.log(err)
		else {
			Embed_CardImage(message, args)
			//test if user specified if they want a text file or not
			//true is text file
			//If text=false, bot needs to process the cards and output embeds
			if (args[8] == false) {
				//split cards into an array for easier processing
				args[10] = data.split('\n\n').slice(0);
				CardCheckpoint(message, args)
				//delete the file now that we're done with it
				fs.unlinkSync(`/mnt/c/mtg-rnn/${args[14]}.txt`);
			}
			//if text=true, bot has less processing to do
			else {
				//re-enable the queue
				run = true
				lastid = ""
				WriteCardsCreated(args[3]);
				
				//attach text file to channel message
				//message.channel.send(`${message.author}, you requested a text file, or more than 30 cards (${args[3]}), so you get them in raw text!\nseed: ${args[5]}`, {
					//files: [ `/mnt/c/mtg-rnn/${args[14]}.txt` ]
				//}).then(function() {
						//fs.unlinkSync(`/mnt/c/mtg-rnn/${args[14]}.txt`);
					//});
				//also send MSE file if requested
				if (args[7] == 'mse') {
					message.channel.send({
						content: `an mse file for you`,
						files: [ `/mnt/c/mtg-rnn/${args[14]}.mse-set` ]
					}).then(function() {
						fs.unlinkSync(`/mnt/c/mtg-rnn/${args[14]}.mse-set`);
					});
				}
			}
		}
	});
}

function Embed_CardImage(message, args) {
	var seeded = args[0].length > 2 ? ' - *seeded*' : ''
	var cardscreated = 0
	
	const Embed = new MessageEmbed()
		.setColor('#009900')
		.setDescription(`requested by ${message.author}\nTemperature: ${args[1]}, Training Level: ${args[2] + 1}, Model: ${args[12]}, Seed: ${args[5]}`)
		.setFooter(`This is an advanced command! See \`mtg!help create\``)
	message.channel.send({ embeds: [Embed] });

	for (k = 1; k <= args[3]; k++) {
		var imagepath = `./cli${k.toString().padStart(3, '0')}.png`
		var text = fs.readFileSync(`./cli${k.toString().padStart(3, '0')}.txt`, 'utf8').replaceManaSymbols().split('\n');
		
		const embed = {
			"title": `${text[0]}`,
			"color": 0x009900,
			"thumbnail": {
				"url": "attachment://card.png"
			},
			"fields": [
			{
				"name": `${text[1]}`,
				"value": `${text.slice(2).join('\n')}`,
				"inline": false
			},
			]
		};
		cardscreated++
		message.channel.send({
			embeds: [embed],
			files: [{attachment:`${imagepath}`, name:'card.png'}]
		});
	}
	
	WriteCardsCreated(cardscreated);
}

//A middle point of functions. This is where finished cards are collected to
//finally be processed.
function CardCheckpoint(message, args) {
	//re-enabled queue at this point
	run = true
	lastid = ""
	
	var _separate = []

	for (ii = 0; ii < args[10].length; ii++) {
		_separate[ii] = SplitCardData(args[10][ii])
	}
	
	Embed_Newcard(message, args, _separate)
}


//Takes raw input of a card and creates an array containing separated data of the card,
//such as name, type, rules, etc...
function SplitCardData(inputcard) {
	try {
		_array = inputcard.replace("_NOCOST_", "{0}").replaceManaSymbols().replace("_INVALID_",'').split('\n')
		//this removes empty lines
		array = _array.filter(function (el) {
			if (el.length > 0) return el;
		});
		var card = []
		
		//At this point I have each line of a card separated into an array.
		//Now it gets processed further, to separate things in lines, like name and cost,
		//and combine the multiple array indexes of rules text into one index.
		//Not entirely necessary, but I do it so I can add some text formatting when outputting.
		//It's quite quick too, so it's not a big deal.
		// --- it looks like a lot, but it's mainly just text manipulation
	
		cardtitle = array[0].split(/<(.+)/) //splits cost from name
	
		card[0] = cardtitle[0]//.replace('~', '-') //NAME
		card[1] = "<" + cardtitle[1] //COST
		card[2] = array[1].toString().replace('~', '—') //TYPE
		
		//add planeswalker's name to the card title
		/*if (card[2].includes('Planeswalker')) {
			card[0] = card[2].split('—')[1].split('(')[0].substring(1).slice(0, -1) + ", " + card[0]
		}*/
		
		//fill rules text and P/T or loyalty
		card[4] = ""
		card[5] = ""
		card[6] = ""
		if ((card[2].includes("Artifact") && !card[2].includes("Creature")) || card[2].includes("Instant") || card[2].includes("Sorcery") || card[2].includes("Enchantment") || card[2].includes("Land")) {
			//these cards don't have P/T
			for (i = 2; i < array.length; i++) {
				card[4] += array[i].capitalize() + '\n' //TEXT .replace(/@/g, card[0])
			}
			card[5] = '\u200b'
		}
		else {
			for (i = 2; i < array.length - 1; i++) {
				card[4] += array[i].capitalize() + '\n' //TEXT .replace(/uncast/g, "counter")
			}
			card[5] = array[array.length - 1].replace(')','').replace('(','') //POWER TOUGHNESS
		}
		//check if card has flavor text
		if (card[4].includes('$$')) {
			var rulesplit = card[4].split('$$')
			card[4] = rulesplit[0]
			card[6] = `\n-----\n*${rulesplit[1].slice(0, -2)}*\n`
		}
		
		finalcard = `**${card[0]}**  ${card[1]}\n__${card[2]}__\n${card[4]}${card[6]}${card[5]}`
		
		if (finalcard.length < 1024) {
			if (true/*CardChecks(card)*/)
				return card
			else
				return ['This card was malformatted (card final checks fail)','-','-','-','-','-']
		}
		else
			return ['This card was malformatted (too long)','-','-','-','-','-']
	}
	catch (err) {
		return ['This card was malformatted (data split error)','-','-','-','-','-']
	} 
}


function Embed_Newcard(message, args, cards) {
	var seeded = args[0].length > 2 ? ' - *seeded*' : ''
	var cardscreated = 0
	
	for (k = 0; (k*10) < args[3]; k++) {
		const Embed = new Discord.MessageEmbed()
		.setColor('#009900')
		.setDescription(`requested by ${message.author}\nTemperature: ${args[1]}, Training Level: ${args[2] + 1}, Model: ${args[12]}, Seed: ${args[5]}`)
		.setFooter({ text: `This is an advanced command! See \`mtg!help create\`` })
		
		for (j = 0; j < 10; j++) {
			card = cards[j + (k*10)]
			try {
				if (card[0].length + card[1].length + 11 > 250)
					Embed.addFields({ name: `---`, value: `**${card[0]} ${card[1]}${seeded}**\n**${card[2]}**\n${card[4]}${card[6]}${card[5]}`})
				else
					Embed.addFields({ name: `**${card[0]} ${card[1]}${seeded}**`, value: `**${card[2]}**\n${card[4]}${card[6]}${card[5]}`})
				cardscreated++
			} catch (err) {
				Embed.addFields({name: `-`, value: `This card was malformatted (null data)`})
			}
			
			if (j + (k*10) >= args[3] - 1)
				break
		}
		
		message.channel.send({embeds: [Embed]});
	}
	WriteCardsCreated(cardscreated)
}