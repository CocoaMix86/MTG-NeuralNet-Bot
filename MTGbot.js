//required dependencies
const Discord = require('discord.js');
const config = require('./auth.json');
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
var fs = require('fs'); 

client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();


//
//adjustable prefix
var prefix = 'mtg!'

//
//Client auth
client.once('ready', () => {
	console.log('Ready!');
});
client.login(config.token);

client.on("ready", () => {
    client.user.setPresence({
		activities: [{ name: 'mtg!help', type: "WATCHING" }],
		status: 'online'
	})
})

//
//Command processing
const commandFiles = fs.readdirSync('/mnt/c/Discord Bot/mtgnet/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`/mnt/c/Discord Bot/mtgnet/commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('messageCreate', message => {
	//ignore anything that doesn't start with the prefix and is written by a bot
	if ((!message.content.toLowerCase().startsWith(prefix) && !message.content.includes('((')) || message.author.bot || message.member.user == null || message == null) return;
	//Separate arguements from main command
	const args = message.content.slice(prefix.length).replace('`', '').replace(';', '').replace('#', '').replace('?', '').replace('<', '').replace('>', '').replace('|', '').replace('—', '--').replace('"', '\\"').split(' ');
	
	var cardlookups = message.content.split('((')
	if (cardlookups.length > 1) {
		const command = client.commands.get('lookup')
		for (x = 1; x < cardlookups.length; x += 1) {
			if (cardlookups[x].includes('))'))
				command.execute(message, cardlookups[x].split('))')[0]);
		}
		return;
	}
	
	const commandName = args.shift().toLowerCase();
	const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;


	//COMMAND COOLDOWNS
	//
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`).then(msg =>{
				setTimeout(() => msg.delete(), timeLeft*1000)
				//setTimeout(() => message.delete(), timeLeft*1000)
			});
		}
	}
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	//
	//
	
	//run command
	try {
		command.execute(message, args);
	} catch (error) { console.log(error) }
});