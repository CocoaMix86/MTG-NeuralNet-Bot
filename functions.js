const fs = require('fs')

function GenerationChannel(message)
{
	var id = message.channel.id;
	if (message.guild.name == 'MTG Neural Net' && id != '733313821153689622' && id != '850935526545424404' && id != '890996406087712780' && id != '971498472937259029'  && id != '734244277122760744' && id != '779947284262551584' && id != '779874832870277180') {
		message.reply(`Please go to <#733313821153689622> or one of the other generation channels.`).then(msg => {
				setTimeout(() => msg.delete(), 10000)
		});
		return false
	}
	return true
}

function RndInteger(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

String.prototype.capitalize = capitalize;
function capitalize (str)
{
  return this.charAt(0).toUpperCase() + str.slice(1)
}

String.prototype.capitalizeWords = capitalizeWords;
function capitalizeWords (str)
{
 return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

String.prototype.replaceManaSymbols = replaceManaSymbols;
function replaceManaSymbols (str)
{
	return this.replace(/{W}/g, '<:W_:734751105699020860>')
		.replace(/{U}/g, '<:U_:734751083230134282>')
		.replace(/{B}/g, '<:B_:734751069892116545>')
		.replace(/{R}/g, '<:R_:734751092319060018>')
		.replace(/{G}/g, '<:G_:734751103912116265>')
		.replace(/{C}/g, '<:C_:734751088720216134>')
		//replace numbers
		.replace(/\{0}/g, '<:0_:734751004679209031>')
		.replace(/\{1}/g, '<:1_:734751006675435531>')
		.replace(/\{2}/g, '<:2_:734751006176444470>')
		.replace(/\{3}/g, '<:3_:734751008605077504>')
		.replace(/\{4}/g, '<:4_:734751015890583673>')
		.replace(/\{5}/g, '<:5_:734751011713056798>')
		.replace(/\{6}/g, '<:6_:734751023918219264>')
		.replace(/\{7}/g, '<:7_:734751035956133998>')
		.replace(/\{8}/g, '<:8_:734751036404924566>')
		.replace(/\{9}/g, '<:9_:734751036161523793>')
		.replace(/\{10}/g, '<:10:734751069841653792>')
		.replace(/\{11}/g, '<:11:734751070009688114>')
		.replace(/\{12}/g, '<:12:734751040968327218>')
		.replace(/{X}/g, '<:X_:734751108035117136>')
		//replace misc symbols
		.replace(/{S}/g, '<:S_:734751123847774299>')
		.replace(/{E}/g, '<:E_:734885104756850709>')
		.replace(/{T}/g, '<:T_:734751108358078554>')
		.replace(/{Q}/g, '<:Q_:734751121054105652>')
		//replace hybrid symbols
		.replace(/{W\/U}/g, '<:WU:734751122643746817>')
		.replace(/{W\/B}/g, '<:WB:734751114762649662>')
		.replace(/{R\/W}/g, '<:RW:734751127597350933>')
		.replace(/{G\/W}/g, '<:GW:734751116725846028>')
		.replace(/{U\/B}/g, '<:UB:734751092079984770>')
		.replace(/{U\/R}/g, '<:UR:734751095381033091>')
		.replace(/{G\/U}/g, '<:GU:734751097557876828>')
		.replace(/{B\/R}/g, '<:BR:734751120810967062>')
		.replace(/{B\/G}/g, '<:BG:734751073444560916>')
		.replace(/{R\/G}/g, '<:RG:734751108626514010>')
		//replace phyrexian symbols
		.replace(/{P\/W}/g, '<:WP:734751513456410745>')
		.replace(/{P\/U}/g, '<:UP:734751515121680384>')
		.replace(/{P\/B}/g, '<:BP:734751513205014549>')
		.replace(/{P\/R}/g, '<:RP:734751513330712728>')
		.replace(/{P\/G}/g, '<:GP:734751513288769577>')
		//replace two-brid symbols
		.replace(/{2\/W}/g, '<:2W:779495156125663273>')
		.replace(/{2\/U}/g, '<:2U:779495156402749482>')
		.replace(/{2\/B}/g, '<:2B:779495156276920360>')
		.replace(/{2\/R}/g, '<:2R:779495156394491914>')
		.replace(/{2\/G}/g, '<:2G:779495156298022932>')
		//replace % with default counter
		//.replace(/%/g, 'charge')
}

function dateTime() {
	//get time info for logging
	var today = new Date();
	var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
	var time = today.getHours().toString().padStart(2, '0') + ":" + today.getMinutes().toString().padStart(2, '0') + ":" + today.getSeconds().toString().padStart(2, '0');
	var dateTime = date+' '+time;
	
	return dateTime
}

String.prototype.toUnary = toUnary;
function toUnary (str)
{
	var _chars = this.split('')
	var _final = ''
	
	for (c = 0; c < _chars.length; c++) {
		num = 0
		//check if char is a number
		//if true, parse to int and add to num
		if (_chars[c] >= '0' && _chars[c] <= '9') {
			num = parseInt(_chars[c])
			//check if following char is a number
			//if true, parse to int. Multiply num*10. Add char
			//increment 'c' to skip it
			if (_chars[c+1] >= '0' && _chars[c+1] <= '9') {
				num = (num*10) + parseInt(_chars[c + 1])
				c++
			}
			_final += "&".padEnd(num + 1, '^')
		}
		else
			_final += _chars[c]
	}
	
	return _final
}

function WriteCardsCreated (numcards){
	var _num = 0
	//read file
	fs.readFile('/mnt/c/mtg-rnn/cardscreated.txt', 'utf8', function (err, data) {
		if (err) { console.log(err)}
		//parse data to int and add to it
		_num = parseInt(data)
		_num += parseInt(numcards)
		//write file
		fs.writeFile('/mnt/c/mtg-rnn/cardscreated.txt', _num.toString(), 'utf8', function (err, data) {
		});
	});
}

module.exports = { RndInteger, capitalize, capitalizeWords, replaceManaSymbols, dateTime, toUnary, WriteCardsCreated, GenerationChannel };