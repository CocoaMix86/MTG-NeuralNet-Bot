module.exports = {
	name: 'flavor',
	description: 'Used to create flavor text.',
	usage: '[number of texts]',
	page1: `**Optional Arguements**
	[number of texts] - from 1 to 10, how many texts you want. Defaults to 1.`,
	
	aliases: ['f'],
	cooldown: 0.01,
	
	execute(message, args) {
		Start(message, args)
	},
};

const fs = require("fs")
const { exec } = require('child_process');
const Discord = require('discord.js');
const client = new Discord.Client();


//Filter inputs
function Start(message, args) {
	console.log(`[${dateTime()}] Flavor - ${message.guild.name}/${message.member.user.tag}.`)
	
	//checks input arg if it's a number and in range
	//if not, set it to 0
	if (!isFinite(args[0]) || isNaN(args[0]) || typeof args[0] == 'undefined')
		args[0] = 1
	if (args[0] < 1 || args[0] > 10)
		args[0] = 1
	
	CreateFlavor(message, args)
}


//call the function to create the flavor text, output to file
function CreateFlavor(message, args) {
	exec(`python3 ~/markov.py ${args[0]} > ./markovout.txt`, (err, stdout, stderr) => {
		if (err)
			console.log(err)
		else {
			//read the generated file
			fs.readFile(`./markovout.txt`, 'utf8' , function (err, data) {
				if (err)
					console.log(err)
				else
					Embed_Newcard(message, data)
			});
		}
	});
}


//output the flavor text
function Embed_Newcard(message, flavor) {
	//split flavor text to array so each can be it's own field in the embed
	var _flav = flavor.split('\n')
	
	const Embed = new Discord.MessageEmbed()
		.setColor('#009900')
		.setDescription(`requested by ${message.author}`)
	
	//add a field to the embed for each line of flavor text
	//a field char limit is 1024 characters, so I have to split it up
	for (x = 0; x < _flav.length - 1; x++) {
		Embed.addFields({ name: `-`, value: _flav[x]})
	}
			
	message.channel.send(Embed);
}



//
//Various utility functions
//
function dateTime() {
	//get time info for logging
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
	var dateTime = date+' '+time;
	
	return dateTime
}