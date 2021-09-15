module.exports = {
	name: 'hourly',
	description: 'This is a dev command.',
	usage: '',
	details: ``,
	aliases: [],
	cooldown: 1,
	
	execute(message, args) {
		//add incoming command to the queue
		if (message.author.id == '132287419117600768' || message.author.id == '142820638007099393' || message.author.id == '101868879935991808') {
			commandqueue = [message, args]
			message.channel.send("Bot posting started!")
			//console.log(message.channel);
			Start(message, args)
			//fetch and cache all members of the server so that the bot recognizes reacts
			guild.members.fetch().then(console.log).catch(console.error);
		}
	},
};

const fs = require("fs")
const { exec } = require('child_process');
const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const guild = client.guilds.fetch('733313820499640322');
const config = require('../auth.json');
client.login(config.token);
client.once('ready', () => {
	console.log('Ready2!');
});


//queues incoming commands and executes the next one as soon as the previous one is done running
function Queue(message, args){
	//Attempt to execute the command
	try {
		Start(commandqueue[0], commandqueue[1])
	} catch (error) {}
}
var commandqueue
setInterval(Queue, 1800000);


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
	//initialize base settings
	//      0   1     2   3  4   5  6     7       8 9  10  11 12     13
	args = ['', 0.86, 69, 1, '', 0, 1000, 'nomse', , , '', 0, 'mtg', '2021-07mtg']
	
	//random temperature
	args[1] = randomG(5)+0.4 //RndInteger(50,130)/100
	//random level
	args[2] = RndInteger(10,70)
	//generate random seed
	args[5] = RndInteger(1,1000000000000000)
	
	//some logging
	console.log(`[${dateTime()}] BotPosting - Using: TEMP:${args[1]}, LEVEL:${args[2]}.`)
	//create the card
	CreateManyCards(message, args)
}


//Similar to the SeededCard function, but runs a different bash script. Doesn't require a loop
//as it generates all of its cards in one go. Though it does take longer.
function CreateManyCards(message, args) {
	//script takes args in order:
	//temp, seed, tlevel, primetext, char length, model
	exec(`bash ~/mtg-rnn/createmany.sh ${args[1]} ${args[5]} ${args[2]} "${args[0]}" ${args[6]} "${args[13]}"`, (err, stdout, stderr) => {
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
	//arg input is MSE (true/false)
	exec(`bash ~/mtg-rnn/prettymany.sh ${args[7]}`, (err, stdout, stderr) => {
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
			message.channel.send("Failed to read from generated file :( Please try again.")
		}
		else {
			//split cards into an array for easier processing
			args[10] = data.split('\n\n')[0];
			CardCheckpoint(message, args)
			//delete temp txt file
			fs.unlinkSync(`/mnt/c/mtg-rnn/${datestr}.txt`);
		}
	});
	});
}


//A middle point of functions. This is where finished cards are collected to
//finally be processed.
function CardCheckpoint(message, args) {
	var _separate = SplitCardData(args[10])
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

//
//Posts card to channel
function Embed_Newcard(message, args, card) {
	//a "seeded" tag can be added to the embed to show if seeds were used
	//default is empty
	var seeded = ''
	if (args[0].length > 2)
		seeded = ' - *seeded*'
	
	const Embed = new Discord.MessageEmbed()
		.setColor('#009900')
		.setDescription(`Temperature: ${args[1]}, Training Level: ${args[2] + 1}, Model: ${args[12]}, Seed: ${args[5]}`)
		
	try {
		//if the name field is somehow longer than 250 chars, put all text into the body of the embed
		//the 'name' field has max length 255
		if (card[0].length + card[1].length + 11 > 250)
			Embed.addFields({ name: `-`, value: `**${card[0]} ${card[1]}${seeded}**\n**${card[2]}**\n${card[4]}${card[5]}`})
		else
			Embed.addFields({ name: `**${card[0]} ${card[1]}${seeded}**`, value: `**${card[2]}**\n${card[4]}${card[5]}`})
		cardscreated++
	} catch (err) {
		Embed.addFields({name: `-`, value: `This card was malformatted (null data)`})
	}
		
	message.channel.send(Embed).then(async function (_message) {
		await _message.react('⬆️')
	});
			
	WriteCardsCreated()
}
//collects 👍 reactions on messages in the #bot-posting-cards channel
//if 2 likes, post it to #bot-posting
client.on('messageReactionAdd', async (reaction, user) => {
	//fetch uncached messages
	if (reaction.message.partial) await reaction.message.fetch();
	if (reaction.partial) await reaction.fetch()
	
	if (reaction.message.channel.id == '785291585574273024') {
		var embed = reaction.message.embeds[0]
		embed.setFooter(`voted on from #bot-posting-cards`)
		
		if (reaction.emoji.name == '⬆️' && reaction.count == 4) {
			reaction.message.react('✅');
			client.channels.cache.get('791935587065004063').send(embed);
		}
	}
});





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
  return Math.floor(Math.pow(Math.random(), 1) * (max - min) ) + min;
}

function randomG(v){ 
    var r = 0;
    for(var i = v; i > 0; i --){
        r += Math.random();
    }
    return r / v;
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
	var time = today.getHours().toString().padStart(2, '0') + ":" + today.getMinutes().toString().padStart(2, '0') + ":" + today.getSeconds().toString().padStart(2, '0');
	var dateTime = date+' '+time;
	
	return dateTime
}