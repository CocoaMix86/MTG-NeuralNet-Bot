module.exports = {
	name: 'info',
	description: 'Displays info relating to the bot.',
	usage: '',
	aliases: ['i'],
	cooldown: 0.01,
	execute(message, args) {
		Start(message)
	},
};

const fs = require("fs")
const Discord = require('discord.js');
const client = new Discord.Client();


function Start(message) {
	var _num
	
	//there is a file that mtg!create writes to called "cardscreated.txt".
	//it updates the stored number every time it creates cards.
	//
	//read from file and pass it to the output
	fs.readFile('./cardscreated.txt', 'utf8' , function (err, data) {
		if (err) { console.log(err)}
		
		_num = parseInt(data)
		Embed_Info(message, _num)
	});
}


function Embed_Info(message, cards) {

	const Embed = new Discord.MessageEmbed()
	.setColor('#8800ff')
	.setDescription(`requested by ${message.author}`)
	.addFields(
		//field - cards creates
		{ name: `**Card Stats**`, value: `**${cards} cards total** have been created.`},
		//field - bot credits
		{ name: `**Credits**`, value: `This bot was created by __CocoaMix__.
		Neural network by billzorn: https://github.com/billzorn/mtg-rnn
		With help from Nyrt in the official Discord.`},
		//field - links to stuff
		{ name: `**Official Links**`, value: `Cocoa's Twitter: https://twitter.com/CocoaMix86 \nMTG Neural Net Discord: https://discord.gg/EH4BTDk`},
		//field - Discord bot invite
		{ name: `**Invite this bot to your server:**`, value: `https://discord.com/oauth2/authorize?client_id=733122248453390374&scope=bot&permissions=89088`}
	)

	message.channel.send(Embed);
}