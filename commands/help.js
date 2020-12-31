module.exports = {
	name: 'help',
	description: 'This is self explanitory.',
	usage: '[command name] [page #]',
	aliases: ['h'],
	cooldown: 0.01,
	execute(message, args) {
		const data = [];
		const { commands } = message.client;
		const Embed = new Discord.MessageEmbed()

		if (!args.length) {
			data.push(`**COMMAND LIST:**
• mtg!create - *creates cards*
• mtg!draft - *subscribe to draft event notifications*
• mtg!flavor - *create flavor text with a markov bot*
• mtg!generate - *create mse file of presets, like a pack or cube*
• mtg!help - *shows this info*
• mtg!info - *provides stats and helpful links regarding this bot*
			
Use \`${prefix}help [command name] [page #]\` to get info on a specific command.`);

			return message.channel.send(data, { split: true })
		}
		
		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
		
		//extract page number and run tests to make sure it is a number
		var page = parseInt(args[1])
		if (isNaN(args[1]) || !isFinite(args[1]) || !args[1].length || typeof args[1] == 'undefined') {
			page = 1
		}
		//send message if requested command doesn't exist
		if (!command) {
			return message.channel.send(`"**!${command}**" does not exist.`);
		}
		//gather command's data into a single array
		data.push(`**Command:** \`${prefix}${command.name}\``);
		if (command.aliases) data.push(`**Aliases:** \`mtg!${command.aliases.join(`\`, \`mtg!`)}\``);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** \`${prefix}${command.name} ${command.usage}\``);
		//if command has extra "pages", tack that onto the end
		if (command.pages) {
			if (page > command.pages.length || page < 1) page = 1;
			data.push(`\n**Details:**\n==============================\n${command.pages[page-1]}`);
		}

		Embed_Help(message, data, command, page);
	},
};

const Discord = require('discord.js');
const client = new Discord.Client();
var prefix = 'mtg!'


function Embed_Help(message, data, command, page) {

	try {
	const Embed = new Discord.MessageEmbed()
		.setColor('#8800ff')
		.setDescription(`requested by ${message.author}`)
		.addFields({ name: `Command Help`, value: data})
		
	if (command.pages)
		Embed.setFooter(`help page ${page} of ${command.pages.length}`);
	else
		Embed.setFooter(`help page 1 of 1`);
	/*if (data2.length)
		Embed.addFields({ name: `---\n**__MORE DETAILS:__**`, value: '\u200b' + data2})
	if (data3.length) {
		Embed.addFields({ name: `---\n**__SYNTAX HELP:__**`, value: '\u200b' + data3})
		Embed.addFields({ name: `\u200b`, value: `**--End**
	If you do not include \`--end\`, the primetext will not be "closed" and the bot will be able to add on to the last field you gave it. If you include \`--end\`, your end field will not be altered. Allowing the bot to edit your last field can be useful if you want to seed on just rules text.`})
	}*/

	message.channel.send(Embed);
	}
	catch (err) {console.log(err)}
}