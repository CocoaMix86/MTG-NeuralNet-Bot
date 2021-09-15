module.exports = {
	name: 'generate',
	description: 'Used to generate packs, cubes, or other predetermined formats.',
	usage: '<--format> [--switch 1] [--switch 2]...',
	pages: [`**Formats**
	--pack
	--cube
	--names
	
	**Normal Switches:**
	--temp   *<- this is temperature*
	--tlevel [1-70]  *<- this is training level*
	--length *<- amount of characters to generate. Useful for longer cards like planeswalkers*
	
	If --temp or --tlevel are not set, they use their defaults of 0.8 and 70 respectively.`],
	aliases: ['g', 'gen'],
	cooldown: 10,
	
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
//args[9] - format
//args[10] - stores generated cards
//args[11] - temp stores number of cards (decrements)
//args[12] - model simple display name
//args[13] - model backend name
var cardstomake = 0;
function Start(message, _in) {
	lastid = message.author
	input = " " + _in.join(" ")
	switches = input.split(' --')
	var _switch = ''
	var _costopen = false;
	
	//initialize base settings
	args = ['blah', 0.8, 70, 15, '', 0, 500, 'mse', 'text', 'pack']
	
	for (i = 1; i < switches.length; i++) {
		_switch = switches[i].split(/ (.+)/)
		//get next switch
		try {
			_switch = switches[i].split(/ (.+)/)
			//test cases
			switch (_switch[0]) {
			case "temp":
				args[1] = _switch[1].replace(/,/g, ' ')
				break;
			case "tlevel":
				args[2] = _switch[1].replace(/,/g, ' ')
				break;
			case "length":
				args[6] = _switch[1]
				break;
				
			case "pack":
				args[9] = "pack"
				args[3] = 15
				break;
			case "cube":
				args[9] = "cube"
				args[3] = 360
				break;
			case "commander":
			case "commanderlegends":
			case "cl":
				args[9] = "commander legends"
				args[3] = 20
				break;
			case "names":
				args[9] = "names"
				args[3] = 10
				args[7] = 'nomse'
				args[6] = 40
				break;
			case "legendary":
				args[9] = "legendary"
				args[3] = 100
				cardstomake = 0
				break;
				
			default:
				message.channel.send(`Switch \`${_switch[0]}\` does not exist, ${message.author}. Creating your cards without this parameter.`)
			}
		} catch (err) {console.log(err) }
	}
	
	//generate random seed
	args[5] = RndInteger(1,1000000000000000)
	args[11] = 0
	
	ArgsCheck(message, args)
}


function ArgsCheck(message, args) {
	//fix model to proper term used in backend based on channel command came from
	if (message.channel.id == '733313821153689622') {
		args[12] = 'mtg'
		args[13] = '2021-07mtg'
	}
	else if (message.channel.id == '734244277122760744') {
		args[12] = 'msem'
		args[13] = '2021-07msem'
	}
	else if (message.channel.id == '779947284262551584') {
		args[12] = 'mixed'
		args[13] = '2021-07mixed'
	}
	else if (message.channel.id == '850935526545424404') {
		args[12] = 'reminder'
		args[13] = '2021-07reminder'
	}
	else if (message.channel.id == '878720017317900348') {
		args[12] = 'randomcost'
		args[13] = '2021-08randcost'
	}
	else {
		args[12] = 'mtg'
		args[13] = '2021-07mtg'
	}
	
	//filter Temp arg
	if (isNaN(args[1])) {
		args[1] = 0.8
	}
	
	//filter TLevel arg
	if (isNaN(args[2])) {
		args[2] = 70
	}
	if (args[2] < 1 || args[2] > 70) {
		args[2] = 70
	}
	args[2] = args[2] - 1 //subtract 1 because arrays start at 0
	
	//set amount of chars to generate for mass creation.
	//this overcompensates a little, in case long cards are created.
	//if priming, set to 300. This is well enough for 1 card, usually.
	if (isNaN(args[6]) || !isFinite(args[6]) || args[6] < 1 || args[6] > 1000)
		args[6] = 300
	
	//initialize array at 10 to store cards in
	args[10] = []
	
	
	//initialize 'seeds' array to store primetexts from file
	seeds = []
	
	//set run to false to stop queue from loading next
	run = false
	
	//some logging
	console.log(`[${dateTime()}] Generate - ${message.guild.name}/${message.member.user.tag} requested ${args[9]}.`)
	console.log(`[${dateTime()}] Generate - Using: TEMP:${args[1]}, LEVEL:${args[2]}.`)
	
	message.channel.send(`Command recieved from the queue from ${message.author} to generate **${args[9]}**.
	Generating the batch of cards now... Please wait a moment!`).then(function() {
		if (args[9] == 'pack') {
			fs.readFile('/mnt/c/Discord Bot/mtgnet/format-packwars.txt', 'utf8' , function (err, data) {
				if (err) { }
				else {
					seeds = data.split('\r\n')
					CreateSeededCard(message, args, seeds)
				}
			});
		}
		else if (args[9] == 'cube') {
			fs.readFile('/mnt/c/Discord Bot/mtgnet/format-cube.txt', 'utf8' , function (err, data) {
				if (err) { }
				else {
					seeds = data.split('\r\n')
					CreateSeededCard(message, args, seeds)
				}
			});
		}
		else if (args[9] == 'commander legends') {
			fs.readFile('/mnt/c/Discord Bot/mtgnet/format-commander.txt', 'utf8' , function (err, data) {
				if (err) { }
				else {
					seeds = data.split('\r\n')
					CreateSeededCard(message, args, seeds)
				}
			});
		}
		else if (args[9] == 'names') {
			seeds = ['|9|1','|9|1','|9|1','|9|1','|9|1','|9|1','|9|1','|9|1','|9|1','|9|1']
			CreateSeededCard(message, args, seeds)
		}
		else if (args[9] == 'legendary') {
			fs.readFile('/mnt/c/Discord Bot/mtgnet/1000-creatures.txt', 'utf8' , function (err, data) {
				if (err) { console.log("1000-creatures failed")}
				else {
					seeds = data.split('\r\n')
					CreateSeededCard(message, args, seeds)
				}
			});
		}
	});
}


//Creates a batch of seeded cards. Runs a for loop, as each seeded card needs to be generated separately,
//unlike unseeded batches.
//Running them one after another was far too slow. With this loop, it creates them all in parallel.
function CreateSeededCard(message, args, seeds) {
	for (q = 0; q < args[3]; q++) {
		//script takes args in order:
		//temp, seed, tlevel, primetext, char length
		exec(`bash ~/mtg-rnn/createpack.sh ${args[1]} ${args[5] + q} ${args[2]} "|${seeds[q]}" ${args[6]} "${args[13]}"`, (err, stdout, stderr) => {
			if (err) {
				console.log("card generate error")
				args[10].push("card generate error")
			}
			//card generation runs in parallel, so this increments for each card when it finishes
			//then sends to next function when all are done
			//done this way because the `for` loop will finish execution before cards are done generating
			args[11]++
			console.log(`${args[11]}--${args[5]}`)
			if (args[11] >= args[3])
				ReadCards(message, args)
		});
	}
}

function CreateSeededCardSerial(message, args, seeds) {
	//script takes args in order:
	//temp, seed, tlevel, primetext, char length
	exec(`bash ~/mtg-rnn/createpack.sh ${args[1]} ${args[5]} ${args[2]} "|${seeds[cardstomake]}" ${args[6]} "${args[13]}"`, (err, stdout, stderr) => {
		if (err) {
			console.log("card generate error")
			args[10].push("card generate error")
		}
		//card generation runs in parallel, so this increments for each card when it finishes
		//then sends to next function when all are done
		//done this way because the `for` loop will finish execution before cards are done generating
		args[11]++
		args[5] = args[5] + 1
		cardstomake++
		console.log(`${cardstomake}--${args[5]}`)
		if (args[11] >= args[3] || cardstomake >= args[3])
			ReadCards(message, args)
		else
			CreateSeededCardSerial(message, args, seeds)
	});
}


//Read the generated cards and then pretty them up for display
//Runs a different bash script depending if input was seeded or not, as file
//generation is different for each.
function ReadCards(message, args) {
	//arg input is 'mse'/'nomse'
	exec(`bash ~/mtg-rnn/prettypack.sh ${args[7]}`, (err, stdout, stderr) => {
		Splitcards(message, args)
	});
}


//Takes the prettied cards and splits them into an array for processing.
//Also takes care of file attachments if requested.
function Splitcards(message, args) {
	var datestr = dateTime().replace(/:/g,'').replace(/ /g,'_');
	//renames output files to include the date
	fs.rename('/mnt/c/mtg-rnn/packpretty.txt', `/mnt/c/mtg-rnn/${datestr}.txt`, () => {
	fs.rename('/mnt/c/mtg-rnn/packpretty.txt.mse-set', `/mnt/c/mtg-rnn/${datestr}.mse-set`, () => {});
	
	fs.readFile(`/mnt/c/mtg-rnn/${datestr}.txt`, 'utf8' , function (err, data) {
		//re-enable the queue
		run = true
		lastid = ""
		
		if (err) {
			console.log("file read error")
			message.channel.send("Failed to read from generated file :( Please try again.")
		}
		else if (args[9] == 'names') {
			args[10] = data.split('\n\n').slice(0);
			CardCheckpoint(message, args);
			//delete the created file. The --names method does not create a .mse-set
			fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.txt`);
		}
		else {
			cardscreated += args[3]
			WriteCardsCreated();
			
			//attach text file to channel message
			message.channel.send(`${message.author}, Here is your file!`, {
				files: [ `/mnt/c/mtg-rnn/${datestr}.mse-set` ]
			}).then(function() {
				//delete the created files
				fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.mse-set`);
				fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.txt`);
			});
		}
	});
	});
}



//A middle point of functions. This is where finished cards are collected to
//finally be processed.
function CardCheckpoint(message, args) {
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
		_array = inputcard.replace("_NOCOST_", "{0}").replace("_INVALID_",'').split('\n')
		//this removes empty lines
		array = _array.filter(function (el) {
			if (el.length > 0) return el;
		});
		
		//splits card name from cost and capitalizes each word
		return array[0].split(/{(.+)/)[0].capitalizeWords()
	}
	catch (err) { return [''] } 
}

function Embed_Newcard(message, args, names) {
	const Embed = new Discord.MessageEmbed()
		.setColor('#009900')
		.setDescription(`requested by ${message.author}\nTemperature: ${args[1]}, Training Level: ${args[2] + 1}`)
		.setFooter(`See \`mtg!help generate\``)
		.addFields({ name: `Names`, value: names.join('\n')})
		
	message.channel.send(Embed);
}




//
//Write number of cards created to a file
function WriteCardsCreated(){
	var _num
	//read file
	fs.readFile('/mnt/c/mtg-rnn/cardscreated.txt', 'utf8', function (err, data) {
		if (err) { console.log(err)}
		//parse data to int and add to it
		_num = parseInt(data)
		_num += parseInt(cardscreated)
		//write file
		fs.writeFile('/mnt/c/mtg-rnn/cardscreated.txt', _num, 'utf8', function (err, data) {
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

function dateTime() {
	//get time info for logging
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	var dateTime = date+' '+time;
	
	return dateTime
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

String.prototype.capitalizeWords = function()
{
 return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}