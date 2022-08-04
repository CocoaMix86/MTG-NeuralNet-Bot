const { WriteCardsCreated } = require('./functions.js');
const Discord = require('discord.js');

//A middle point of functions. This is where finished cards are collected to
//finally be processed.
function CardCheckpoint(message, args) {
	var _separate = []

	for (ii = 0; ii < args[3]; ii++) {
		_separate[ii] = SplitCardData(args[10][ii])
	}
	
	Embed_Newcard(message, args, _separate)
}


//Takes raw input of a card and creates an array containing separated data of the card,
//such as name, type, and rules
function SplitCardData(inputcard) {
	var _array = []
	try {
		_array = inputcard.replace("_NOCOST_", "").replaceManaSymbols().replace("_INVALID_",'').split('\n')
		cardtitle = _array[0].split(/<(.+)/) //splits cost from name
		_array[0] = _array[0].replace(cardtitle, `**${cardtitle}**`) //Bold the name
		_array[1] = _array[1].replace(' ~ ', ' — ').replace('~', '-') //TYPE LINE
		_array[2] = _array.slice(2).join('\n').replace('$$', '\n--------\n') //Join rest of card lines into 1 entry
		
		//check if card is longer than embed limits
		if (_array.join('\n').length < 1024)
			return _array
		else
			return ['This card was malformatted (too long)','-','-']
	}
	catch (err) {
		console.log(err)
		return ['This card was malformatted (data split error)','-','-']
	} 
}


function Embed_Newcard(message, args, cards) {
	var seeded = args[0].length > 2 ? ' - *seeded*' : ''
	var cardscreated = 0
	
	for (k = 0; (k*10) < args[3]; k++) {
		const Embed = new Discord.MessageEmbed()
		.setColor('#009900')
		.setDescription(`requested by ${message.author}\nTemperature: ${args[1]}, Training Level: ${args[2] + 1}, Model: ${args[12]}, Seed: ${args[5]}`)
		.setFooter({ text: `This is an advanced command! See \`mtg!help create\`` })
		
		for (j = 0; j < 10; j++) {
			card = cards[j + (k*10)]
			try {
				if (card[0].length + card[1].length + 11 > 250)
					Embed.addFields({ name: `⠀`, value: `${card[0]} ${seeded}\n**${card[1]}**\n${card[2]}`})
				else
					Embed.addFields({ name: `${card[0]}${seeded}`, value: `**${card[1]}**\n${card[2]}`})
				cardscreated++
			} catch (err) {
				Embed.addFields({name: `-`, value: `This card was malformatted (null data)`})
			}
			
			if (j + (k*10) >= args[3] - 1)
				break
		}
		
		try {
			message.channel.send({embeds: [Embed]});
		} catch (err) {
			console.log(`[${dateTime()}] Create - ${message.guild.name}/${message.member.user.tag} cards failed!`)
			console.log(err)
		}
	}
	WriteCardsCreated(cardscreated)
}

module.exports = { CardCheckpoint };