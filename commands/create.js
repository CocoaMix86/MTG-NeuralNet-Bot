module.exports = {
	name: 'create',
	description: 'Used to create a single card from the network.',
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
	
	aliases: ['c', 'cards'],
	cooldown: 5,
	
	execute(message, args) {
		//if user has a job running, don't accept another one.
		if (message.author == lastid)
			message.channel.send("You already have a running job! Please wait until it finished.")
		else {
			//add incoming command to the queue
			commandqueuemany.push([message, args])
			//send message if queue is backed up or a job is running
			if (commandqueuemany.length > 1 || run == false) {
				message.channel.send(`Your request for a card was received. There are currently ${commandqueuemany.length} card jobs in the queue, or a job is currently running. Please wait a moment!`)
			}
		}
	},
};

const fs = require("fs")
const { exec } = require('child_process');
const Discord = require('discord.js');
const client = new Discord.Client();

var _switchSet = ["name", "n", "cost", "c", "supertype", "sp", "subtype", "sb", "type", "t", "loyalty", "l", "powertoughness", "pt", "rules", "r", "rarity", "rr", "end", "end", "seed", "s"];


//queues incoming commands and executes the next one as soon as the previous one is done running
var run = true;
var lastid = "";
function Queue(message, args){
	if (run) {
		var command = commandqueuemany.shift();
		//Attempt to execute the command
		try {
			Start(command[0], command[1])
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
//args[12] - model simple display name
//args[13] - model backend name
function Start(message, _in) {
	lastid = message.author
	input = " " + _in.join(" ")
	switches = input.split(' --')
	var _switch = ''
	var _costopen = false;
	
	//initialize base settings
	args = ['', 0.777, 70, 1, '', 0, 0, 'nomse',,,,,'mtg']
	//generate random seed
	args[5] = RndInteger(1,1000000000000000)
	
	for (i = 1; i < switches.length; i++) {
		_switch = switches[i].split(/ (.+)/)
		//if cost is open, close it if another primetext field is being entered
		if (_costopen && _switchSet.indexOf(_switch[0]) >= 0) {
			args[0] += "}"
			_costopen = false;
			i--;
		}
		else {
			//get next switch
			try {
				_switch = switches[i].split(/ (.+)/)
				//test cases
				switch (_switch[0]) {
				case "name":
				case "n":
					args[0] += `|1${_switch[1]}`;
					break;
				case "cost":
				case "c":
					args[0] += `|3{${_switch[1].toUnary().replace(/&/g,'')}`;
					_costopen = true;
					break;
				case "supertype":
				case "sp":
					args[0] += `|4${_switch[1]}`;
					break;
				case "type":
				case "t":
					args[0] += `|5${_switch[1]}`;
					break;
				case "subtype":
				case "sb":
					args[0] += `|6${_switch[1]}`;
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
					args[0] += `|9${_switch[1].toUnary().replace('{&','{')}`;
					break;
				case "rarity":
				case "rr":
					args[0] += `|0${_switch[1]}`;
					break;
				case "end":
				case "e":
					args[4] += `|`;
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
				case "model":
				case "m":
					args[12] = _switch[1].toLowerCase().replace(/,/g, ' ')
					break;
				
				default:
					message.channel.send(`Switch \`${_switch[0]}\` does not exist, ${message.author}. Creating your cards without this parameter.`)
				}
			} catch (err) {console.log(err) }
		}
	}
	
	//replace \ with \\ if it appears at the end of the primetext
	args[0] = args[0].replace(/\\$/,`\\\\`)
	args[0] += args[4]
	
	args[11] = 0
	
	ArgsCheck(message, args)
}


function ArgsCheck(message, args) {
	//fix model to proper term used in backend based on channel command came from
	if (message.channel.id == '733313821153689622') {
		args[12] = 'mtg'
		args[13] = 'model_2020-11-19mtg'
	}
	else if (message.channel.id == '734244277122760744') {
		args[12] = 'msem'
		args[13] = 'model_2020-11-19msem'
	}
	else if (message.channel.id == '779947284262551584') {
		args[12] = 'mixed'
		args[13] = 'model_2020-11-21mixed'
	}
	else if (message.channel.id == '780577138788925460') {
		args[12] = 'reminder'
		args[13] = 'model_2020-11-23reminder'
		args[6] = 500
	}
	else {
		args[12] = 'mtg'
		args[13] = 'model_2020-11-19mtg'
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
	args[2] = args[2] - 1
	
	//filter "amount of cards" arg
	if (isNaN(args[3]))
		args[3] = 3
	//if more than 30 cards, set text flag
	if (args[3] > 30)
		args[8] = true
	if (args[3] > 100)
		args[3] = 100
	else if (args[3] < 1)
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
	
	//initialize array at 10 to store cards in
	args[10] = []
	
	//set run to false to stop queue from loading next
	run = false
	//delete some old files before starting
	exec(`rm ./primepretty.txt; rm ./prime2.txt;`, (err, stdout, stderr) => {})
	
	//some logging
	console.log(`[${dateTime()}] Create - ${message.guild.name}/${message.member.user.tag} requested ${args[3]} cards.`)
	console.log(`[${dateTime()}] create - Using: TEMP:${args[1]}, LEVEL:${args[2]}.`)
	
	message.channel.send(`Command recieved from the queue from ${message.author} to generate ${args[3]} cards.
	Generating the batch of cards now... Please wait a moment!`).then(function() {
	
		//switch between single seeded cards, or mass creation.
		//based on if primetext is empty or not
		if (args[0] != '')
			CreateSeededCard(message, args)
		else
			CreateManyCards(message, args)
	});
}


//Creates a batch of seeded cards. Runs a for loop, as each seeded card needs to be generated separately,
//unlike unseeded batches.
//Running them one after another was far too slow. With this loop, it creates them all in parallel.
function CreateSeededCard(message, args) {
	for (q = 0; q < args[3]; q++) {
		//script takes args in order:
		//temp, seed, tlevel, primetext, char length, model
		exec(`bash ./createsingle.sh ${args[1]} ${args[5] + q} ${args[2]} "${args[0]}" ${args[6]} "${args[13]}"`, (err, stdout, stderr) => {
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
	exec(`bash ./createmany.sh ${args[1]} ${args[5]} ${args[2]} "${args[0]}" ${args[6]} "${args[13]}"`, (err, stdout, stderr) => {
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
	if (args[0] != '') {
		//arg input is MSE (true/false)
		exec(`bash ./prettycards.sh ${args[7]}`, (err, stdout, stderr) => {
			Splitcards(message, args)
		});
	}
	else {
		//arg input is MSE (true/false)
		exec(`bash ./prettymany.sh ${args[7]}`, (err, stdout, stderr) => {
			Splitcards(message, args)
		});
	}
}


//Takes the prettied cards and splits them into an array for processing.
//Also takes care of file attachments if requested.
function Splitcards(message, args) {
	var datestr = dateTime().replace(/:/g,'').replace(/ /g,'_');
	fs.rename('./primepretty.txt', `./${datestr}.txt`, () => {
	fs.rename('./primepretty.txt.mse-set', `./${datestr}.mse-set`, () => {});
	
	fs.readFile(`./${datestr}.txt`, 'utf8' , function (err, data) {
		if (err) {
			console.log("file read error")
			/*args[10].push(data)
			CardCheckpoint(message, args)*/
			message.channel.send("Failed to read from generated file :( Please try again.")
		}
		else {
			//test if user specified if they want a text file or not
			//true is text file
			if (!args[8]) {
				//split cards into an array for easier processing
				args[10] = data.split('\n\n').slice(0);
				CardCheckpoint(message, args)
				fs.unlinkSync(`./${datestr}.txt`);
			}
			else {
				//re-enable the queue
				run = true
				lastid = ""
				cardscreated += args[3]
				WriteCardsCreated();
				
				//attach text file to channel message
				message.channel.send(`${message.author}, you requested a text file, or more than 30 cards (${args[3]}), so you get them in raw text!`, {
					files: [ `./${datestr}.txt` ]
				}).then(function() {
						fs.unlinkSync(`./${datestr}.txt`);
					});
				//also send MSE file if requested
				if (args[7] == 'mse') {
					message.channel.send(``, {
						files: [ `./${datestr}.mse-set` ]
					}).then(function() {
							fs.unlinkSync(`./${datestr}.mse-set`);
						});
				}
			}
		}
	});
	});
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
	
		card[0] = cardtitle[0].replace('~', '-').capitalizeWords().slice(0, -1) //NAME
		card[1] = "<" + cardtitle[1] //COST
		card[2] = array[1].toString().replace('~', '—').capitalizeWords() //TYPE
		
		//add planeswalker's name to the card title
		/*if (card[2].includes('Planeswalker')) {
			card[0] = card[2].split('—')[1].split('(')[0].substring(1).slice(0, -1) + ", " + card[0]
		}*/
		
		//fill rules text and P/T or loyalty
		card[4] = ""
		card[5] = ""
		if ((card[2].includes("Artifact") && !card[2].includes("Creature")) || card[2].includes("Instant") || card[2].includes("Sorcery") || card[2].includes("Enchantment") || card[2].includes("Land")) {
			//these cards don't have P/T
			for (i = 2; i < array.length; i++) {
				card[4] += array[i].replace(/@/g, card[0]).replace(/uncast/g, "counter").capitalize() + '\n' //TEXT
			}
			card[5] = '\u200b'
		}
		else {
			for (i = 2; i < array.length - 1; i++) {
				card[4] += array[i].replace(/@/g, card[0]).replace(/uncast/g, "counter").capitalize() + '\n' //TEXT
			}
			card[5] = array[array.length - 1].replace(')','').replace('(','') //POWER TOUGHNESS
		}
		
		finalcard = `**${card[0]}**  ${card[1]}\n__${card[2]}__\n${card[4]}${card[5]}`
		
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

/*
function CardChecks(card) {
	//check if name starts with letter
	if (!card[0].match(/^[A-Za-z]/))
		return false
	//check if cost starts with {
	else if (!card[1].match(/^(<.*|{.*)(>|})$/)) 
		return false
	//check if type starts with letter
	else if (!card[2].match(/^[A-Za-z]/))
		return false
	//check if P/T is empty or has text starting with '('
	else if (!card[5].match(/^(?:\d{6}|(?=.*\*)[\d*]{1,6}|)/) && !card[5].match(/^\u200b/))
		return false

	return true
}*/


function Embed_Newcard(message, args, cards) {
	var seeded = ''
	if (args[0].length > 2)
		seeded = ' - *seeded*'
	var c = args[3]
	

	for (k = 0; (k*10) < args[3]; k++) {
		const Embed = new Discord.MessageEmbed()
		.setColor('#009900')
		.setDescription(`requested by ${message.author}\nTemperature: ${args[1]}, Training Level: ${args[2] + 1}, Model: ${args[12]}, Seed: ${args[5]}`)
		.setFooter(`This is an advanced command! See \`mtg!help create\``)
		
		for (j = 0; j < 10; j++) {
			card = cards[j + (k*10)]
			try {
				if (card[0].length + card[1].length + 11 > 250)
					Embed.addFields({ name: `---`, value: `**${card[0]} ${card[1]}${seeded}**\n**${card[2]}**\n${card[4]}${card[5]}`})
				else
					Embed.addFields({ name: `**${card[0]} ${card[1]}${seeded}**`, value: `**${card[2]}**\n${card[4]}${card[5]}`})
				cardscreated++
			} catch (err) {
				Embed.addFields({name: `-`, value: `This card was malformatted (null data)`})
			}
			
			c--
			if (c < 1)
				break;
		}
		
		message.channel.send(Embed);
		WriteCardsCreated();
	}
}


//
//Write number of cards created to a file
function WriteCardsCreated(){
	var _num
	//read file
	fs.readFile('./cardscreated.txt', 'utf8', function (err, data) {
		if (err) { console.log(err)}
		//parse data to int and add to it
		_num = parseInt(data)
		_num += parseInt(cardscreated)
		//write file
		fs.writeFile('./cardscreated.txt', _num, 'utf8', function (err, data) {
			_num = 0
			cardscreated = 0
		});
	});
}
var cardscreated = 0;






//
//Various utility functions
//
function RndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

String.prototype.capitalizeWords = function()
{
 return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

String.prototype.replaceManaSymbols = function()
{
	return this.replace(/{W}/g, '<:W_:734751105699020860>')
		.replace(/{U}/g, '<:U_:734751083230134282>')
		.replace(/{B}/g, '<:B_:734751069892116545>')
		.replace(/{R}/g, '<:R_:734751092319060018>')
		.replace(/{G}/g, '<:G_:734751103912116265>')
		.replace(/{C}/g, '<:C_:734751088720216134>')
		//replace numbers
		.replace(/\{0}/g, '<:0_:734751004679209031>')
		.replace(/\{1}/g, '<:1_:734751006675435531>')
		.replace(/\{2}/g, '<:2_:734751006176444470>')
		.replace(/\{3}/g, '<:3_:734751008605077504>')
		.replace(/\{4}/g, '<:4_:734751015890583673>')
		.replace(/\{5}/g, '<:5_:734751011713056798>')
		.replace(/\{6}/g, '<:6_:734751023918219264>')
		.replace(/\{7}/g, '<:7_:734751035956133998>')
		.replace(/\{8}/g, '<:8_:734751036404924566>')
		.replace(/\{9}/g, '<:9_:734751036161523793>')
		.replace(/\{10}/g, '<:10:734751069841653792>')
		.replace(/\{11}/g, '<:11:734751070009688114>')
		.replace(/\{12}/g, '<:12:734751040968327218>')
		.replace(/{X}/g, '<:X_:734751108035117136>')
		//replace misc symbols
		.replace(/{S}/g, '<:S_:734751123847774299>')
		.replace(/{E}/g, '<:E_:734885104756850709>')
		.replace(/{T}/g, '<:T_:734751108358078554>')
		.replace(/{Q}/g, '<:Q_:734751121054105652>')
		//replace hybrid symbols
		.replace(/{W\/U}/g, '<:WU:734751122643746817>')
		.replace(/{W\/B}/g, '<:WB:734751114762649662>')
		.replace(/{R\/W}/g, '<:RW:734751127597350933>')
		.replace(/{G\/W}/g, '<:GW:734751116725846028>')
		.replace(/{U\/B}/g, '<:UB:734751092079984770>')
		.replace(/{U\/R}/g, '<:UR:734751095381033091>')
		.replace(/{G\/U}/g, '<:GU:734751097557876828>')
		.replace(/{B\/R}/g, '<:BR:734751120810967062>')
		.replace(/{B\/G}/g, '<:BG:734751073444560916>')
		.replace(/{R\/G}/g, '<:RG:734751108626514010>')
		//replace phyrexian symbols
		.replace(/{W\/P}/g, '<:WP:734751513456410745>')
		.replace(/{U\/P}/g, '<:UP:734751515121680384>')
		.replace(/{B\/P}/g, '<:BP:734751513205014549>')
		.replace(/{R\/P}/g, '<:RP:734751513330712728>')
		.replace(/{G\/P}/g, '<:GP:734751513288769577>')
		//replace two-brid symbols
		.replace(/{2\/W}/g, '<:2W:779495156125663273>')
		.replace(/{2\/U}/g, '<:2U:779495156402749482>')
		.replace(/{2\/B}/g, '<:2B:779495156276920360>')
		.replace(/{2\/R}/g, '<:2R:779495156394491914>')
		.replace(/{2\/G}/g, '<:2G:779495156298022932>')
}

function dateTime() {
	//get time info for logging
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	var dateTime = date+' '+time;
	
	return dateTime
}

String.prototype.toUnary = function()
{
	var _chars = this.split('')
	var _final = ''
	
	for (c = 0; c < _chars.length; c++) {
		num = 0
		//check if char is a number
		//if true, parse to int and add to num
		if (_chars[c] >= '0' && _chars[c] <= '9') {
			num = parseInt(_chars[c])
			//check if following char is a number
			//if true, parse to int. Multiply num*10. Add char
			//increment 'c' to skip it
			if (_chars[c+1] >= '0' && _chars[c+1] <= '9') {
				num = (num*10) + parseInt(_chars[c + 1])
				c++
			}
			_final += "&".padEnd(num + 1, '^')
		}
		else
			_final += _chars[c]
	}
	
	return _final
}