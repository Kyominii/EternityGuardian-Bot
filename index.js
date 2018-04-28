	const Discord = require('discord.js');
	const countdown = require('countdown')
	const fs = require('fs');
	const bot = new Discord.Client();

	countdown.setLabels(
		' milliseconde| seconde| minute| heure| jour| semaine| mois| année| décennie| siècle| millénaire',
		' millisecondes| secondes| minutes| heures| jours| semaines| mois| années| décennies| siècles| millénaires',
		' et ',
		', ',
		'maintenant');

	let currentPresident = "undefined"
	let helpTxt = "```====================AIDE====================\nAfficher l'aide : !eter aide\nAfficher le président actuel : !eter president\nAfficher le compte-à-rebours avant la prochaine election : !eter prochain\n"
			helpTxt = helpTxt + "Postuler : !eter postule [TON PROGRAMME (obligatoire)]\nListe des candidats : !eter candidats [ID CANDIDAT (optionnel)]\nVoter (uniquement en message privé) : !eter vote [ID CANDIDAT (obligatoire)]\n"
			helpTxt = helpTxt + "```"
	let nextElection = new Date()
	let candidate = []
	let voteAck = []
	let endVote = new Date()
	let isVoting = false
	let maintenance = false
	let guild = {}

	let announce = (txt) => {
	  bot.channels.every((channel) => {
	    if(channel.type === "text"){
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
							m.addRole('439739074367193088')
						} else if (currentPresident !== "undefined" && m.user.id === currentPresident.id) {
							m.removeRole('439739074367193088')
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

	let tick = () => {
		let currentDate = new Date()
		let timeLeft = Math.floor((nextElection.getTime() - currentDate.getTime())/1000)
		if(timeLeft < 0){

				announce("Les élections mensuelles commencent !")
				endVote.setDate(endVote.getDate() + 1)
				nextElection.setMonth(nextElection.getMonth() + 1)
				isVoting = true

				setTimeout(() => {
					voteTimeout()
					isVoting = false
					candidate = []
					voteAck = []
				}, 86400000) // 86400000
			}

		setTimeout(() => {
			tick()
		}, 1000)
	}

	let initGuild = () => {
		//console.log(bot.guilds)
		bot.guilds.forEach((el) => {
			if(el.id === "372455299803774976"){
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
				initGuild()
				tick()
	      console.log("Loop Started ... Eternity Guardian ready !")
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
							if (message.author.id === '145122601105227777' && cmd === "toggle"){
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
												addCandidate(message.author, prog)
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
														candidate[args[0]].votes++
														voteAck.push(message.author.id)
														message.reply('À voté : ' + candidate[args[0]].user.tag + " ! ")
													}
												}
											}
										}
									}
									break;
								case 'toggle':
									if (message.author.id === '145122601105227777'){
										maintenance = true
										message.reply("Passage en mode maintenance")
										bot.user.setStatus('idle')
									} else {
										message.reply("Vous n'êtes pas autorisé d'utiliser cette fonctionnalité !")
									}
									break;
								case 'test':
									nextElection = new Date()
									/*if(guild.available){
										guild.members.forEach((m) => {
											if (m.user.id === '145122601105227777') {
												m.removeRole('439739074367193088')
											}
										})
									}*/
									break;
			          default:
			            message.reply('Je n\'ai pas compris, veuillez reformuler s\'il vous plaît !')
			        }
						}
				}

	    }
	});

	process.on('uncaughtException', function (err) {
	  console.log('Caught exception: ' + err);
	});
