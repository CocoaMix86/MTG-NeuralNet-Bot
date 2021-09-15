module.exports = {
	name: 'constructed',
	description: 'Add or remove yourself from constructed notications.',
	usage: '',
	aliases: ['none'],
	cooldown: 0.01,
	execute(message, args) {
		Start(message)
	},
};

const Discord = require('discord.js');
const client = new Discord.Client();

function Start(message) {
	try {
		var role = message.guild.roles.cache.find(role => role.name === "constructed notifications");
		
		if(message.member.roles.cache.find(r => r.name === "constructed notifications")) {
			message.member.roles.remove(role);
			Embed_Info(message, "you have been REMOVED from constructed notifications.")
		}
		else {
			message.member.roles.add(role);
			Embed_Info(message, "you have been ADDED to constructed notifications.")
		}
			
	} catch (err) { console.log(err) }
	
}

function Embed_Info(message, string) {

	const Embed = new Discord.MessageEmbed()
	.setColor('#8800ff')
	.setDescription(`requested by ${message.author}`)
	.addFields(
		{ name: `${string}`, value: `-`}
	)

	message.channel.send(Embed);
}