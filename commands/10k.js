module.exports = {
	name: '10k',
	description: 'admin only',
	usage: '--',
	details: `admin only`,
	
	aliases: ['1k'],
	cooldown: 0.1,
	
	execute(message, args) {
		//if user has a job running, don't accept another one.
		if (message.author.id == '132287419117600768' || message.author.id == '142820638007099393' || message.author.id == '101868879935991808') {
			//add incoming command to the queue
			message.channel.send("command received")
			Start(message)
		}
	},
};

const fs = require("fs")
const { exec } = require('child_process');
const Discord = require('discord.js');
const client = new Discord.Client();

//Filter inputs
//args[0] - seed/primetext
//args[1] - temp
//args[2] - tlevel
//args[3] - number of cards
//args[4] - contains priming end character, if specified
//args[5] - seed
//args[6] - chars to generate
//args[7] - switch for mse
//args[8] - switch for raw file output
//args[9] - 
//args[10] - stores generated cards
//args[11] - temp stores number of cards (decrements)
function Start(message) {
	console.log(`[${dateTime()}] 10k - ${message.guild.name}/${message.member.user.tag}.`)
	message.channel.send("generating cards now. This may take a while...")
	
	//initialize base settings
	args = ['', 0.86, 69, 60, '', 0, 0, 'mse']

	//generate random seed
	args[5] = RndInteger(1,1000000000000000)
	args[11] = 0
	args[6] = args[3] * 300
	
	CreateManyCards(message, args)
}


//Similar to the SeededCard function, but runs a different bash script. Doesn't require a loop
//as it generates all of its cards in one go. Though it does take longer.
function CreateManyCards(message, args) {
	//script takes args in order:
	//temp, seed, tlevel, primetext, char length
	for (q = 0; q < 100; q++) {
	exec(`bash ~/mtg-rnn/10k.sh ${args[1]} ${args[5] + q} ${args[2]} "|0" ${args[6]} 2021-08randcost`, (err, stdout, stderr) => {
		if (err) {
			console.log("card generate error")
		} 
		else {
			args[11]++
			if (args[11] == 100)
				ReadCards(message, args)
		}
	});
	}
}


//Read the generated cards and then pretty them up for display
//Runs a different bash script depending if input was seeded or not, as file
//generation is different for each.
function ReadCards(message, args) {
	//arg input is MSE (true/false)
	exec(`bash ~/mtg-rnn/pretty10k.sh ${args[7]}`, (err, stdout, stderr) => {
		Splitcards(message, args)
	});
}


//Takes the prettied cards and splits them into an array for processing.
//Also takes care of file attachments if requested.
function Splitcards(message, args) {	
	fs.readFile('/mnt/c/mtg-rnn/primepretty.txt', 'utf8' , function (err, data) {
		if (err) {
			console.log("file read error")
			message.channel.send("final file was not generated")
		}
		else {
			//re-enable the queue
			run = true
			lastid = ""
				
			//attach text file to channel message
			message.channel.send(`${message.author}, you requested a text file, or more than 50 cards (${args[3]}), so you get them in raw text!`, {
				files: [ '/mnt/c/mtg-rnn/primepretty.txt' ]
			});
			//also send MSE file if requested
			if (args[7] == 'mse')
				message.channel.send(``, {
					files: [ '/mnt/c/mtg-rnn/primepretty.txt.mse-set' ]
				});
		}
	});
}


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