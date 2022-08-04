module.exports = {
	name: 'help',
	description: 'This is self explanitory.',
	usage: '[command name] [page #]',
	aliases: ['h'],
	cooldown: 0.01,
	execute(message, args) {
		var data = "";
		const { commands } = message.client;
		const Embed = new Discord.MessageEmbed()

		if (!args.length) {
			data = `**COMMAND LIST:**
• mtg! [create] - *creates cards, expanding on the last field given*
• mtg! [multi] - *creates cards, expanding on multiple fields*
• mtg! [flavor] - *create flavor text with a markov bot*
• mtg! [generate] - *create mse file of presets, like a pack or cube*
• mtg! [help] - *shows this info*
• mtg! [info] - *provides stats and helpful links regarding this bot*
			
Use \`${prefix}help [command name] [page #]\` to get info on a specific command.`;

			return message.channel.send({
				content: data
			});
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
		data += `**Command:** \`${prefix}${command.name}\``;
		if (command.aliases) data += `\n**Aliases:** \`mtg!${command.aliases.join(`\`, \`mtg!`)}\``;
		if (command.description) data += `\n**Description:** ${command.description}`;
		if (command.usage) data += `\n**Usage:** \`${prefix}${command.name} ${command.usage}\``;
		//if command has extra "pages", tack that onto the end
		if (command.pages) {
			if (page > command.pages.length || page < 1) page = 1;
			data += `\n**Details:**\n==============================\n${command.pages[page-1]}`;
		}

		Embed_Help(message, data, command, page);
	},
};

const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
var prefix = 'mtg!'


function Embed_Help(message, data, command, page) {

	try {
	const Embed = new Discord.MessageEmbed()
		.setColor('#8800ff')
		.setDescription(`requested by ${message.author}`)
		.addFields({ name: `Command Help`, value: data})
		
	if (command.pages)
		Embed.setFooter({ text: `help page ${page} of ${command.pages.length}` });
	else
		Embed.setFooter({ text: `help page 1 of 1` });

	message.channel.send({ embeds: [Embed] });
	}
	catch (err) {console.log(err)}
}