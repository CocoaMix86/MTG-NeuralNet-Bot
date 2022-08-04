module.exports = {
	name: 'lookup',
	description: 'Lookup cards in the Spiral Chaos set',
	usage: '[card name]',
	pages: [``],
	aliases: ['l'],
	cooldown: 1,
	
	execute(message, args) {
		Start(message, args)
	}
};

const path = require('path')
const fuzzysort = require('fuzzysort')
const fs = require('fs')
const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const images = []
fs.readdir(`/mnt/c/Discord Bot/Card Images/`, function (err, files) {
    //listing all files using forEach
    files.forEach(function (file) {
		if (file != 'desktop.ini')
			images.push(file.replace('.png', ''));
    });
});


function Start(message, _in) {
	input = ""
	
	if (typeof _in === "string")
		input = _in
	else
		input = _in.join(" ")
	input = input.replace('$', '').replace('\\', '').replace('/', '').replace('{', '').replace('.', '')

	var results = fuzzysort.go(input, images, {limit: 5, threshold: -1000})
	if (results.length == 1 || (results.length > 1 && results[0].score - results[1].score > 50)) {
		message.channel.send({
			content: `${results[0].target}`,
			files: [ `/mnt/c/Discord Bot/Card Images/${results[0].target}.png` ]
		});
	}
	else if (results.length > 1 && results[0].score - results[1].score < 50)
		message.channel.send(`Multiple cards match "${input}". Can you be more specific?`)
	else if (results.length == 0)
		message.channel.send(`No cards match "${input}".`)
}