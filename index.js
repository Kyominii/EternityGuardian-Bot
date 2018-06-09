const Discord = require('discord.js');
const countdown = require('countdown')
const fs = require('fs');
const stringify = require('json-stringify-safe')
const cluster = require('cluster');

countdown.setLabels(' milliseconde| seconde| minute| heure| jour| semaine| mois| année| décennie| siècle| millénaire', ' millisecondes| secondes| minutes| heures| jours| semaines| mois| années| décennies| siècles| millénaires', ' et ', ', ', 'maintenant');


if(cluster.isMaster) {

	cluster.fork();
	cluster.on('disconnect', function(worker)
   {
       console.error('Crashed !');
       cluster.fork();
   });

} else {
	const bot = new Discord.Client();

	let helpTxt = "```====================AIDE====================\nAfficher l'aide : !eter aide\nAfficher le président actuel : !eter president\nAfficher le compte-à-rebours avant la prochaine election : !eter prochain\n"
	helpTxt = helpTxt + "Postuler : !eter postule [TON PROGRAMME (obligatoire)]\nListe des candidats : !eter candidats [ID CANDIDAT (optionnel)]\nVoter (uniquement en message privé) : !eter vote [ID CANDIDAT (obligatoire)]\n"
	helpTxt = helpTxt + "```"
	let guild = {}

	let currentPresident = "undefined"
	let nextElection = new Date()
	let candidate = []
	let voteAck = []
	let endVote = new Date()
	let isVoting = false
	let maintenance = false


	//TECH CONFIG
	let techID = '145122601105227777'
	let guildID = '307260668388573186'
	let presidentRoleName = 'Président acclamé par la foule en liesse'
	let channelAnnouncement = '307807367071006721'

	let save = () => {
		let obj = {
			currentPresident: currentPresident,
			nextElection: nextElection,
			candidate: candidate,
			voteAck: voteAck,
			endVote: endVote,
			isVoting: isVoting,
			maintenance: maintenance
		}

		fs.writeFile('save-data.json', stringify(obj), 'utf8', () => {});
	}

	let load = () => {
		fs.readFile('save-data.json', 'utf8', (err, data) => {
			if (err){
				console.log("Aucun fichier de sauvegarde trouvé, création d'un fichier vierge !");
				save()
			} else {
				obj = JSON.parse(data); //now it an object
				currentPresident = obj.currentPresident
				nextElection = new Date(obj.nextElection)
				candidate = obj.candidate
				voteAck = obj.voteAck
				endVote = new Date(obj.endVote)
				isVoting = obj.isVoting
				maintenance = obj.maintenance
				console.log("Data restored !")
			}
		});
	}

	let announce = (txt) => {
		bot.channels.every((channel) => {
			if(channel.id === channelAnnouncement){
				channel.send("**/!\\ATTENTION/!\\**\n" + txt)
				.catch(console.error)
			}
			return true
		})
	}

	let addCandidate = (user, desc) => {
		candidate.push({
			'user': user,
			'desc': desc,
			'votes': 0
		})
	}

	let checkIfAlreadyRegistered = (user) => {
		let code = false
		candidate.forEach((el) => {
			if(el.user.id == user.id){
				code = true
			}
		})
		return code
	}

	let checkIfAlreadyVoted = (user) => {
		let code = false
		voteAck.forEach((el) => {
			if(el == user.id){
				code = true
			}
		})
		return code
	}

	let voteTimeout = () => {
		if(candidate.length > 0) {
			if(voteAck.length > 0){
				let bestIndex = 0
				candidate.forEach((el, index) => {
					if(candidate[bestIndex].votes < el.votes) {
						bestIndex = index
					}
				})

				let winner = candidate[bestIndex].user
				let prog = candidate[bestIndex].desc
				let perc = (candidate[bestIndex].votes / voteAck.length) * 100

				announce("Les élections mensuelles sont terminées !!!\nNotre nouveau président : <@" + winner.id + "> avec " + perc + "% des voix\nPour rappel, son programme : ```" + prog + "```")

				if(guild.available){
					guild.members.forEach((m) => {
						if (m.user.id === winner.id){
							m.addRole(guild.roles.find("name", presidentRoleName))
						} else if (currentPresident !== "undefined" && m.user.id === currentPresident.id) {
							m.removeRole(guild.roles.find("name", presidentRoleName))
						}
					})
				}

				currentPresident = winner

			} else {
				announce("Les élections mensuelles sont terminées !!!\nIl n'y a pas eu assez de votant, les élections sont donc repoussé au mois prochain !")
			}

		} else {
			announce("Les élections mensuelles sont terminées !!!\nIl n'y a pas eu assez de candidature, les élections sont donc repoussé au mois prochain !")
		}
	}

	let sec = 0
	let tick = () => {
		if(sec === 60){
			save()
			sec = 0
		} else {
			sec++
		}
		let currentDate = new Date()
		let timeLeft = Math.floor((nextElection.getTime() - currentDate.getTime())/1000)
		if(timeLeft < 0){

			announce("Les élections mensuelles commencent !")
			endVote = new Date()
			endVote.setDate(endVote.getDate() + 1)
			nextElection.setMonth(nextElection.getMonth() + 1)
			isVoting = true

			setTimeout(() => {
				voteTimeout()
				isVoting = false
				candidate = []
				voteAck = []
			}, 86400000)
		}

		setTimeout(() => {
			tick()
		}, 1000)
	}

	let initGuild = () => {
		bot.guilds.forEach((el) => {
			if(el.id === guildID){
				guild = el
			}
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
			nextElection = new Date()
			nextElection.setMonth(nextElection.getMonth() + 1)
			load()
			console.log()
			initGuild()
			tick()
			console.log("Eternity Guardian ready !")
		})
		.catch(console.error);
	});

	bot.login('NDM2OTMyNjc3MTQ5NjU1MDQw.Dbusyw.i1bczbhEONEBS2otfGJ7-K4hBLo');

	bot.on('message', (message) => {
		if(message.author.id !== bot.user.id){

			if (/^!eter\s/.test(message.content)) {
				let plain_args = message.content.replace('!eter ', '')
				let args = plain_args.split(' ')
				let cmd = args.shift()

				if(maintenance){
					if (message.author.id === techID && cmd === "toggle"){
						maintenance = false
						message.reply("Reprise du service")
						bot.user.setStatus('online')
					} else {
						message.reply("Maintenance en cours ...")
					}
				} else {
					switch (cmd) {
						case "president":
						if(currentPresident === "undefined"){
							message.reply('Il n\'y a aucun président dans cette éternité !')
						} else {
							message.reply('Le président actuel est : ' + currentPresident.tag)
						}
						break;

						case "aide":
						message.reply(helpTxt)
						break;

						case "prochain":
						if(isVoting){
							message.reply('Il reste : ' + countdown(null, endVote).toString() + ' avant la fin du vote !')
						} else {
							message.reply('Il reste : ' + countdown(null, nextElection).toString() + ' avant la prochaine élection')
						}
						break;

						case "postule":
						if(isVoting){
							message.reply('Les postulations sont actuellement fermées (vote en cours) !')
						} else {
							if(!checkIfAlreadyRegistered(message.author)){
								let prog = args.join(' ')
								if(prog !== ""){
									let c = {
										id: message.author.id,
										username: message.author.username,
										tag: message.author.tag
									}
									addCandidate(c, prog)
									message.channel.send('La candidature de <@' + message.author.id + '> a été prise en compte. Son programme : ' + prog)
								} else {
									message.reply('Tu dois donner ton programme !')
								}
							} else {
								message.reply('Tu participes déjà à cette élection !')
							}
						}
						break;

						case "candidats":
						let response = ""
						if (args[0]){
							let el = candidate[args[0]]
							if(el){
								response = response + el.user.tag + " : ```\n" + el.desc + "\n```"
							} else {
								response = response + "Ce candidat n'existe pas !"
							}
						} else {
							if(candidate.length === 0){
								response = "Aucun candidat pour le moment !"
							} else {
								candidate.forEach((el, index) => {
									response = response + "\n" + index + " : " + el.user.tag
								})
							}

						}
						message.channel.send(response)
						break;

						case "vote":
						if(!isVoting){
							message.reply('Aucun vote n\'est en cours')
						} else {
							if(message.channel.type !== "dm"){
								message.reply('Les votes se font en message privé **UNIQUEMENT**')
								message.author.send("Merci de voter ici !")
							} else {
								if(!args[0]){
									message.reply('Tu dois donner l\'ID du participant pour qui tu votes (voir !eter candidats)')
								} else {
									if(checkIfAlreadyVoted(message.author)){
										message.reply('Tu as déjà voté !')
									} else {
										if(!candidate[args[0]]){
											message.reply('Ce candidat n\'existe pas !')
										} else {
											if(message.author.id === candidate[args[0]].user.id){
												message.reply('Vous ne pouvez pas voter pour vous-même !')
											} else {
												candidate[args[0]].votes++
												voteAck.push(message.author.id)
												message.reply('A voté : ' + candidate[args[0]].user.tag + " ! ")
											}
										}
									}
								}
							}
						}
						break;

						case 'toggle':
						if (message.author.id === techID){
							maintenance = true
							message.reply("Passage en mode maintenance")
							bot.user.setStatus('idle')
						} else {
							message.reply("Vous n'êtes pas autorisé à utiliser cette fonctionnalité !")
						}
						break;

						case 'remove':
						if (message.author.id === techID){
							if (args[0]){
								let el = candidate[args[0]]
								if(el){
									candidate.splice(args[0], 1);
									message.reply("Le candidat " + args[0] + " a été retiré de l'élection")
								} else {
									message.reply("Ce candidat n'existe pas !")
								}
							}
						} else {
							message.reply("Vous n'êtes pas autorisé à utiliser cette fonctionnalité !")
						}
						break;

						case 'forceVoteTO':
						if (message.author.id === techID){
							voteTimeout()
							isVoting = false
							candidate = []
							voteAck = []
						} else {
							message.reply("Vous n'êtes pas autorisé à utiliser cette fonctionnalité !")
						}
						break;

						case 'forceElectionTO':
						if (message.author.id === techID){
							nextElection = new Date()
						} else {
							message.reply("Vous n'êtes pas autorisé à utiliser cette fonctionnalité !")
						}
						break;

						default:
						message.reply('Je n\'ai pas compris, veuillez reformuler s\'il vous plaît !')
					}
				}
			}

		}
	});

	process.on('uncaughtException', function (err) {
		console.log('Caught exception: ' + stringify(err));
		process.exit(1);
	});

}
