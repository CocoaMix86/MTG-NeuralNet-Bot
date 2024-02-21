module.exports = {
	name: 'post',
	description: 'Post cards automatically to the Roborosewater Uncurated twitter feed.',
	usage: '[text caption] <and attach an image>',
	pages: [`---`],
	
	aliases: ['p'],
	cooldown: 1,
	
	execute(message, args) {
		if (message.channel.id == '1026952929757892649' || message.channel.id == '975949296140705792') {
			Start(message, args)
		}
	},
};

//Required libraries
const fs = require('fs')
const request = require('request');
const { TwitterApi } = require('twitter-api-v2');
//const Discord = require('discord.js');
//const { Client, Intents } = require('discord.js');
//const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
//Various useful functions
const { RndInteger, capitalize, replaceManaSymbols, dateTime, toUnary, WriteCardsCreated, GenerationChannel } = require('../functions.js');

//
//Twitter things
const client = new TwitterApi({
  appKey: 'nSEMyc5nNEyN5kankP2w8Qx0e',
  appSecret: 'V9P6oQVweJJjs42BE7JEuPi0BqeniY5JZGKK9xYmgU0OX7yGNH',
  // Following access tokens are not required if you are
  // at part 1 of user-auth process (ask for a request token)
  // or if you want a app-only client (see below)
  accessToken: '1577339663144173575-2Ya7J2PiLiJOrJjKsJ7sbDrnjGCTEq',
  accessSecret: 'SVqSEBzOkd47gTrfSCqgUZvkKqO3ppJgEGltB7OjJ5GzK',
});
//const client = new TwitterApi('hb4b2APuaZFecYoAIRUrQRQP98Nw20YRF7-9XwfGKR2bpvIWQ4');
const rwClient = client.readWrite

//downloading file
const fetch = require("node-fetch");
const downloadFile = (async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", resolve);
    });
});

function Start(message, _in) {
	input = ""
	
	if (typeof _in === "string")
		input = _in
	else
		input = _in.join(" ")
	
	//check if attachment exists
	if (message.attachments.size < 1) {
		message.channel.send({
			content: 'no file attached.'
		});
		return
	}

	//Post Text Tweet
	downloadFile(message.attachments.first().url, `./downloads/${message.attachments.first().name}`).then(function() {
		PostCard(message, input);
	});
}

async function PostCard(message, input)
{
	try {
		// First, post all your images to Twitter
		const mediaIds = await Promise.all([
			// file path
			client.v1.uploadMedia(`./downloads/${message.attachments.first().name}`)
		]);

		// mediaIds is a string[], can be given to .tweet
		await client.v2.tweet({
			text: input,
			media: { media_ids: mediaIds }
		}).then(function() {
			fs.unlinkSync(`./downloads/${message.attachments.first().name}`);
		});
	
	} 
	catch(err) {console.log(err)}
	
}