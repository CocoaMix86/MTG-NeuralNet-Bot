//required dependencies
const Discord = require('discord.js');
const config = require('./auth.json');
var fs = require('fs'); 

//import commands
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
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
    client.user.setPresence({ activity: { name: 'mtg!help' }, status: 'online' })
})

//
//Command processing
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('message', message => {
	//ignore anything that doesn't start with the prefix and is written by a bot
	if (!message.content.startsWith(prefix) || message.author.bot) return;
	
	//Separate arguements from main command
	const args = message.content.slice(prefix.length).split(' ');
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
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
		}
	}
	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	//
	//
	
	//run command
	try {
		command.execute(message, args);
	} catch (error) { }
	
});