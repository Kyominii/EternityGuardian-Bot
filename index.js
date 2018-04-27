const Discord = require('discord.js');
const countdown = require('countdown')
const bot = new Discord.Client();

countdown.setLabels(
	' milliseconde| seconde| minute| heure| jour| semaine| mois| année| décennie| siècle| millénaire',
	' millisecondes| secondes| minutes| heures| jours| semaines| mois| années| décennies| siècles| millénaires',
	' et ',
	', ',
	'maintenant');

let currentPresident = "Garlic Dog#1337"
let helpTxt = "```===HELP===\nAfficher l'aide : !eter halp\nAfficher le président actuel : !eter prez\nAfficher le compte-à-rebours avant la prochaine election : !eter prochain```"
let nextElection = new Date(2018, 04, 25, 21)

let greetingElections = () => {
  bot.channels.every((channel) => {
    if(channel.type === "text"){
      channel.send("**/!\\ATTENTION/!\\**\nLes élections mensuelles vont débuter dans 5 minutes !!!")
      .catch(console.error)
    }
    return true
  })
}

bot.on('ready', function () {
    bot.user.setPresence({
        status: 'online',
        afk: false,
        game: {
            name: 'Garder l\'éternité'
        }
    })
    .then(() => {
      console.log("Eternity Guardian prêt à bosser !")
    })
    .catch(console.error);
});

bot.login('NDM2OTMyNjc3MTQ5NjU1MDQw.Dbusyw.i1bczbhEONEBS2otfGJ7-K4hBLo');

bot.on('message', (message) => {
    if(message.author.id !== bot.user.id){
      if (/^!eter\s/.test(message.content)) {
        let plain_args = message.content.replace('!eter ', '')
        let args = plain_args.split(' ')

        switch (args[0]) {
          case "prez":
            message.reply('Le président actuel est : ' + currentPresident)
            break;
          case "halp":
            message.reply(helpTxt)
            break;
          case "prochain":
            message.reply('Il reste : ' + countdown(nextElection).toString() + ' avant la prochaine élection')
            break;
          case "test":
            greetingElections()
            break;
          default:
            message.reply('Je n\'ai pas compris, veuillez reformuler s\'il vous plaît !')
        }
        //if(message.channel.type === "dm"){
      }
    }
});
