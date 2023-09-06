const config = require('./config');
const Discord = require('discord.js');
const Client = new Discord.Client({intents: 3276799});
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const targetRoleId = '1097589263710814208';
const targetChannelId = '1103335979386933248';
const dir = "/volume1/Fire/Nofote/";
const permRoleId = "1098336161543487498"
const defaultRoleId = "1097589263710814208"

//========= déclaration des commandes =========//

/* const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with pong!');

const faciton = new SlashCommandBuilder()
  .setName('faction')
  .setDescription('Affiche le nombre de membres jouant à Nexion sur le serveur Factions')
  .addBooleanOption(option => option.setName('liste').setDescription('Affiche la liste des membres jouant à Nexion sur le serveur Factions').setRequired(false));

const Nexion = new SlashCommandBuilder()
  .setName('nexion')
  .setDescription('Affiche le nombre de membres jouant à Nexion')
  .addBooleanOption(option => option.setName('liste').setDescription('Affiche la liste des membres jouant à Nexion sur le serveur Factions').setRequired(false));

const total = new SlashCommandBuilder()
  .setName('total')
  .setDescription('Affiche le nombre de membres total ayant le role nexion sur le serveur')
  .addBooleanOption(option => option.setName('liste').setDescription('Affiche la liste des membres ayant le role nexion sur le serveur').setRequired(false));

const addCommand = new SlashCommandBuilder()
  .setName('add')
  .setDescription('Ajouter un joueur à la liste des joueurs actifs')
  .addUserOption(option => option.setName('joueur').setDescription('Le joueur à ajouter').setRequired(true))
  .addStringOption(option => option.setName('hierarchie').setDescription('La hiérarchie du joueur (Gérant, Modo ou Joueur)').setRequired(false)
  .addChoices(
    { name: 'Joueur', value: 'Joueur' }, 
    { name: 'Modo', value: 'Modo' },
    { name: 'Chef', value: 'Chef' },
  ));

  
const showCommand = new SlashCommandBuilder()
  .setName('show')
  .setDescription('Afficher la liste des joueurs'); */

const tournant = new SlashCommandBuilder()
  .setName('tournante')
  .setDescription('Echanger deux joueurs entre eux')
  .addUserOption(option => option.setName('joueur1').setDescription('Le joueur1 à échanger').setRequired(true))
  .addUserOption(option => option.setName('joueur2').setDescription('Le joueur2 à échanger (optionnel)').setRequired(false));

module.exports = tournant; 

//========= function gestion des joueurs =========//

// Création de la liste des joueurs actifs
let activePlayersList = [];

// Création de la liste des joueurs inactifs
let inactivePlayersList = [];

// Fonction pour sauvegarder les listes dans des fichiers CSV
function saveLists() {
  const activeCSV = activePlayersList.map(player => Object.values(player).join(',')).join('\n');
  const inactiveCSV = inactivePlayersList.map(player => Object.values(player).join(',')).join('\n');

  fs.writeFileSync(dir+'active_players.csv', activeCSV);
  fs.writeFileSync(dir+'inactive_players.csv', inactiveCSV);
}

// Chargement des listes depuis les fichiers CSV
function loadLists() {
  const activeCSV = fs.readFileSync(dir+'active_players.csv', 'utf-8');
  activePlayersList = activeCSV.split('\n').map(player => {
    const [name, discordId, hierarchy] = player.split(',');
    return { name, discordId, hierarchy };
  });

  const inactiveCSV = fs.readFileSync(dir+'inactive_players.csv', 'utf-8');
  inactivePlayersList = inactiveCSV.split('\n').map(player => {
    const [name, discordId, hierarchy] = player.split(',');
    return { name, discordId, hierarchy };
  });
}

function addPlayerToList(player, hierarchy, list = 'activePlayersList') {
  // Vérification que le joueur n'existe pas déjà dans la liste des joueurs actifs ou inactifs
  const activePlayer = activePlayersList.find(p => p.discordId === player.id);
  const inactivePlayer = inactivePlayersList.find(p => p.discordId === player.id);
  if (activePlayer || inactivePlayer) {
    return 'Le joueur est déjà dans une des listes';
  }

  if(list === 'activePlayersList') {
    activePlayersList.push({ name: player.username, discordId: player.id, hierarchy });
  }
  else inactivePlayersList.push({ name: player.username, discordId: player.id, hierarchy });
  saveLists();

  return `Le joueur \`${player.username}\` a été ajouté à la liste des joueurs actifs`;
}

function removePlayerFromList(player, list) {
  let str = '';
  acti = activePlayersList.length
  inacti = inactivePlayersList.length

  if (list === 'activePlayersList') {
    activePlayersList = activePlayersList.filter(p => p.discordId !== player.id);

    if(activePlayersList.length != acti) str = `Le joueur \`${player.username}\` a été retiré de la liste des joueurs actifs`;
    else str = `Le joueur \`${player.username}\` n'est pas dans la liste des joueurs actifs`; 
  } 
  else if (list === 'inactivePlayersList') {
    inactivePlayersList = inactivePlayersList.filter(p => p.discordId !== player.id);

    if(inactivePlayersList.length != inacti) str = `Le joueur \`${player.username}\` a été retiré de la liste des joueurs inactifs`;
    else str = `Le joueur \`${player.username}\` n'est pas dans la liste des joueurs inactifs`;
  } 
  else if (list === 'all') {
    activePlayersList = activePlayersList.filter(p => p.discordId !== player.id);
    inactivePlayersList = inactivePlayersList.filter(p => p.discordId !== player.id);

    if(activePlayersList.length != acti || inactivePlayersList.length != inacti) str = `Le joueur \`${player.username}\` a été retiré de toutes les listes`;
    else str = `Le joueur \`${player.username}\` n'est pas dans les listes`;
  }
  saveLists();
  return str;
}

function tournante(player1, player2 = null) {
  let arrive = null;
  let depart = null;
  if (player2 === null) {
    // Si le joueur2 n'est pas défini, on retire le joueur1 de sa liste actuelle
    // et on l'ajoute à l'autre liste
    if (activePlayersList.some(player => player.discordId === player1.id)) {
      let found = activePlayersList.find(player => player.discordId === player1.id);
      activePlayersList = activePlayersList.filter(player => player.discordId !== player1.id);
      inactivePlayersList.push(found);
      depart = player1;
    } else if (inactivePlayersList.some(player => player.discordId === player1.id)) {
      let found = inactivePlayersList.find(player => player.discordId === player1.id);
      inactivePlayersList = inactivePlayersList.filter(player => player.discordId !== player1.id);
      activePlayersList.push(found);
      arrive = player1;
    }
  } else {
    // Sinon, on retire le joueur1 et le joueur2 de leur liste actuelle
    // et on les ajoute à l'autre liste
    //joueur1
    if (activePlayersList.some(player => player.discordId === player1.id)) {
      let found = activePlayersList.find(player => player.discordId === player1.id);
      activePlayersList = activePlayersList.filter(player => player.discordId !== player1.id);
      inactivePlayersList.push(found);
      depart = player1;
    } else if (inactivePlayersList.some(player => player.discordId === player1.id)) {
      let found = inactivePlayersList.find(player => player.discordId === player1.id);
      inactivePlayersList = inactivePlayersList.filter(player => player.discordId !== player1.id);
      activePlayersList.push(found);
      arrive = player1;
    }
    //joueur2
    if (activePlayersList.some(player => player.discordId === player2.id)) {
      let found = activePlayersList.find(player => player.discordId === player2.id);
      activePlayersList = activePlayersList.filter(player => player.discordId !== player2.id);
      inactivePlayersList.push(found);
      depart = player2;
    } else if (inactivePlayersList.some(player => player.discordId === player2.id)) {
      let found = inactivePlayersList.find(player => player.discordId === player2.id);
      inactivePlayersList = inactivePlayersList.filter(player => player.discordId !== player2.id);
      activePlayersList.push(found);
      arrive = player2;
    }
  }
  
  saveLists();
  return { depart,arrive };
}

function updateMessage() {
  str = "Voici la liste des joueurs actifs: \n";
  chef = activePlayersList.filter(player => player.hierarchy === 'chef')
  modo = activePlayersList.filter(player => player.hierarchy === 'modo')
  joueur = activePlayersList.filter(player => player.hierarchy === 'joueur')
  if(chef.length > 0) str += `**Chef:** \n **•** <@${chef.map(player => player.discordId).join('> \n **•** <@')}>\n`;
  if(modo.length > 0) str += `**Modo:** \n **•** <@${modo.map(player => player.discordId).join('> \n **•** <@')}>\n`;
  if(joueur.length > 0) str += `**Joueur:** \n **•** <@${joueur.map(player => player.discordId).join('> \n **•** <@')}>\n`;
  str += `\n Liste des joueurs inactifs: \n`;
  chef = inactivePlayersList.filter(player => player.hierarchy === 'chef')
  modo = inactivePlayersList.filter(player => player.hierarchy === 'modo')
  joueur = inactivePlayersList.filter(player => player.hierarchy === 'joueur')
  if(chef.length > 0) str += `**Chef:** \n **•** <@${chef.map(player => player.discordId).join('> \n **•** <@')}>\n`;
  if(modo.length > 0) str += `**Modo:** \n **•** <@${modo.map(player => player.discordId).join('> \n **•** <@')}>\n`;
  if(joueur.length > 0) str += `**Joueur:** \n **•** <@${joueur.map(player => player.discordId).join('> \n **•** <@')}>\n`;

  Client.channels.cache.get('1105157717569568848').messages.fetch('1105573722779299880').then(message => {
    message.edit(str);
  });

  return str;
}

Client.on('ready', () => {
  console.log(`${Client.user.tag} est prêt !`);
  
  //Client.guilds.cache.get('768453319542439957').commands.create(data);
  //Client.guilds.cache.get('768453319542439957').commands.create(faciton);
  //Client.guilds.cache.get('768453319542439957').commands.create(Nexion);
  //Client.guilds.cache.get('768453319542439957').commands.create(total);
  //Client.guilds.cache.get('768453319542439957').commands.create(addCommand);
  //Client.guilds.cache.get('768453319542439957').commands.create(showCommand);
  //Client.guilds.cache.get('768453319542439957').commands.create(removeCommand);
  //Client.guilds.cache.get('768453319542439957').commands.create(tournant);
  
  /* Client.user.setActivity({
    name: 'Admire l\'envergure de la KroKroCorp ',
    type: 'PLAYING',
    url: 'http://discord.gg/kGzxAG5', 
  }); */
  loadLists();
  const targetChannel = Client.channels.cache.get(targetChannelId);
  if (targetChannel) {
    targetChannel.send('Le bot est prêt !');
  } else {
    console.error('Channel not found!');
  }
});


Client.on('presenceUpdate', (oldPresence, newPresence) => {
    const member = newPresence.member;    
    let bol = false;
    try {
      bol = !member.roles.cache.has(targetRoleId);
    } catch (e) {
      console.log(member);
      return;
    }
    if (bol) return;
    const targetChannel = member.guild.channels.cache.get(targetChannelId);
    if (!targetChannel) return console.error(`Channel with ID ${targetChannelId} not found`);
    

    console.log('Changement de présence pour: ' + member.displayName);
      
    if (oldPresence != null && oldPresence.activities.some(activity => activity.name === 'Nexion') && newPresence != null && !newPresence.activities.some(activity => activity.name === 'Nexion')) {
      targetChannel.send(`\`${member.displayName}\` **ne** joue **plus** à Nexion :face_holding_back_tears: !`);
      return;
    }
    if(newPresence != null && newPresence.activities.some(activity => activity.name === 'Nexion' && activity.state === 'Sur le serveur Factions')) {
      targetChannel.send(`\`${member.displayName}\` joue à Nexion sur le serveur Factions !`);
      return;
    }
  });

Client.on('interactionCreate', async interaction => {
  if (interaction.isCommand()){
    
    const { commandName } = interaction;

    if (commandName === 'ping') {
      //list of replies
      const replies = [ 'Pong!', 'Pong! Pong!', 'Oui?', 'Quoi?', 'Oui, je suis là',
      'Oui, je suis là, mais je suis occupé à faire autre chose, donc je ne peux pas te répondre, mais je te répond quand même',
      'Le saviez-vous ? Le ping est une unité de mesure de distance en informatique, correspondant à la durée de parcours d\'un signal entre deux machines',
      'Le saviez-vous ? Ce bot est codé en JavaScript avec la librairie Discord.js',
      'Le saviez-vous ? Ce bot est hébergé sur un serveur dédié',
      'Le saviez-vous ? Ce bot est codé par FireGhost et Kr0ZiX :heart_on_fire:',
      'Comment puis-je vous aider ?',
      'Vous pouvez m\'aider en m\'envoyant un message privé à mon créateur, `_Fire_Ghost_#7862`',
      'La commande /ping est une commande de test, elle ne sert à rien, mais elle est là pour vous faire plaisir',
      'Squartix est un dieu',
      'FireGhost est un bot',
      'Kr0ZiX est une machine',
    ];
      await interaction.reply(replies[Math.floor(Math.random() * replies.length)]);
      return;
    }
    if (commandName === 'faction') {
    
      const members = Client.guilds.cache.first().members.cache.filter(member => member.roles.cache.has(targetRoleId) && member.presence?.activities.some(activity => activity.name === 'Nexion' && activity.state === 'Sur le serveur Factions'));
      var mbr = "membre";
      if(members.size > 1) mbr = "membres";
      var str = `Il y a actuellement **${members.size} ${mbr}** jouant à Nexion sur le serveur Factions.`;
      if (interaction.options.getBoolean('liste')) {
        //add list of members to the string
        str += `\n Liste des joueurs sur le faction: \`${members.map(member => member.displayName).join('\`, \`')}\``;
      }
      interaction.reply(str);
      return;
    }
    if (commandName === 'nexion') {
    
      const members = Client.guilds.cache.first().members.cache.filter(member => member.presence?.activities.some(activity => activity.name === 'Nexion' && activity.state === 'Sur le serveur Factions'));
      var mbr = "membre";
      if(members.size > 1) mbr = "membres";
      var str = `Il y a actuellement **${members.size} ${mbr}** jouant à Nexion sur le serveur discord.`;
      if (interaction.options.getBoolean('liste')) {
        //add list of members to the string
        str += `\n Liste des joueurs: \`${members.map(member => member.displayName).join('\`, \`')}\``;
      }
      interaction.reply(str);
      return;
    }
    if (commandName === 'total') {
      
        const members = Client.guilds.cache.first().members.cache.filter(member => member.roles.cache.has(targetRoleId));
        var str = `Il y a actuellement **${members.size} membres** ayant le role Nexion sur le serveur discord.`;
        if (interaction.options.getBoolean('liste')) {
          //add list of members to the string
          str += `\n Liste des joueurs: \`${members.map(member => member.displayName).join('\`, \`')}\``;
        }
        interaction.reply(str);
        return;
    }
    if (commandName === 'add') {
      if (!interaction.member.roles.cache.has(permRoleId)) {
        interaction.reply('Kr0ZiX a décider que vous n\'aviez pas la permission d\'utiliser cette commande');
        return;
      }
      const player = interaction.options.getUser('joueur');
      var hierarchy = interaction.options.getString('hierarchie') ?? 'Joueur';
      hierarchy = hierarchy.toLowerCase();
      var response = addPlayerToList(player, hierarchy);
      //ajout du role defaultRoleId si le joueur n'a pas de role
      if (!interaction.guild.members.cache.get(player.id).roles.cache.has(defaultRoleId)) {
        interaction.guild.members.cache.get(player.id).roles.add(defaultRoleId);
        response += `\nLe joueur \`${player.username}\` a reçu le role \`${interaction.guild.roles.cache.get(defaultRoleId).name}\``;
      }
      else {
        response += `\nLe joueur \`${player.username}\` a déjà le role \`${interaction.guild.roles.cache.get(defaultRoleId).name}\`, aucun changement n'a été effectué.`;
      }
      interaction.reply(response);
      return;
    }
    if (commandName === 'remove') {
      if (!interaction.member.roles.cache.has(permRoleId)) {
        interaction.reply('Kr0ZiX a décider que vous n\'aviez pas la permission d\'utiliser cette commande');
        return;
      }
      const player = interaction.options.getUser('joueur');
      const list = interaction.options.getString('liste') ?? 'all'; //activePlayersList, inactivePlayersList, all
      var response = removePlayerFromList(player, list);
      //suppression du role defaultRoleId si le joueur n'a pas de role
      if (interaction.guild.members.cache.get(player.id).roles.cache.has(defaultRoleId)) {
        interaction.guild.members.cache.get(player.id).roles.remove(defaultRoleId);
        response += `\nLe joueur \`${player.username}\` a perdu le role \`${interaction.guild.roles.cache.get(defaultRoleId).name}\``;
      }
      else {
        response += `\nLe joueur \`${player.username}\` n'a pas le role \`${interaction.guild.roles.cache.get(defaultRoleId).name}\`, aucun changement n'a été effectué.`;
      }
      interaction.reply(response);
      return;
    }
    if (commandName === 'show') {
      str = "Voici la liste des joueurs actifs: \n";
      chef = activePlayersList.filter(player => player.hierarchy === 'chef')
      modo = activePlayersList.filter(player => player.hierarchy === 'modo')
      joueur = activePlayersList.filter(player => player.hierarchy === 'joueur')
      if(chef.length > 0) str += `**Chef:** \n **•** \`${chef.map(player => player.name).join('\` \n **•** \`')}\`\n`;
      if(modo.length > 0) str += `**Modo:** \n **•** \`${modo.map(player => player.name).join('\` \n **•** \`')}\`\n`;
      if(joueur.length > 0) str += `**Joueur:** \n **•** \`${joueur.map(player => player.name).join('\` \n **•** \`')}\`\n`;
      str += `\n Liste des joueurs inactifs: \n`;
      chef = inactivePlayersList.filter(player => player.hierarchy === 'chef')
      modo = inactivePlayersList.filter(player => player.hierarchy === 'modo')
      joueur = inactivePlayersList.filter(player => player.hierarchy === 'joueur')
      if(chef.length > 0) str += `**Chef:** \n **•** \`${chef.map(player => player.name).join('\` \n **•** \`')}\`\n`;
      if(modo.length > 0) str += `**Modo:** \n **•** \`${modo.map(player => player.name).join('\` \n **•** \`')}\`\n`;
      if(joueur.length > 0) str += `**Joueur:** \n **•** \`${joueur.map(player => player.name).join('\` \n **•** \`')}\`\n`;
      interaction.reply(str);
      return;
    }
    if (commandName == 'tournante'){
      if (!interaction.member.roles.cache.has(permRoleId)) {
        interaction.reply('Kr0ZiX a décider que vous n\'aviez pas la permission d\'utiliser cette commande');
        return;
      }
      const player1 = interaction.options.getUser('joueur1');
      const player2 = interaction.options.getUser('joueur2')?? null;
      let depart, arrive;
      test = tournante(player1, player2);
      depart = test.depart;
      arrive = test.arrive;
      let Embed;
      if(depart != null && arrive != null){
        Embed = new Discord.EmbedBuilder()
          .setColor(0xb15bc8)
          .setTitle('Un remplacement a été effectué.')
          .setDescription('Commande : /tournante (joueur1) (joueur2 *optionnel* )')
          .addFields(
            { name: `❌ Kick de ${depart.username}`, value: `Le joueur <@${depart.id}> a été retiré de la faction.` },
            { name: `✅ Arrivé de ${arrive.username}`, value: `Le joueur <@${arrive.id}> a rejoint la faction.` },
          )
          .setTimestamp()
          .setFooter({ text: ' ', iconURL: 'https://cdn.discordapp.com/icons/768453319542439957/a_95e72ce2dee4e1ab30a12908e4667342.webp?size=96' });
        //Embed += `❌ Kick de ${depart.username} \n Le joueur <@${depart.id}> a été retiré de la faction. \n` + `✅ Arrivé de ${arrive.username} \n Le joueur <@${arrive.id}> a rejoint la faction.`;
      }
      else if(depart != null && arrive == null){
        Embed = new Discord.EmbedBuilder()
          .setColor(0xb15bc8)
          .setTitle('Un remplacement a été effectué.')
          .setDescription('Commande : /tournante (joueur1) (joueur2 *optionnel* )')
          .addFields(
            { name: `❌ Kick de ${depart.username}`, value: `Le joueur <@${depart.id}> a été retiré de la faction.` },
          )
          .setTimestamp()
          .setFooter({ text: ' ', iconURL: 'https://cdn.discordapp.com/icons/768453319542439957/a_95e72ce2dee4e1ab30a12908e4667342.webp?size=96' });
        //Embed += `❌ Kick de ${depart.username} \n Le joueur <@${depart.id}> a été retiré de la faction.`;
      }
      else if(depart == null && arrive != null){
        Embed = new Discord.EmbedBuilder()
          .setColor(0xb15bc8)
          .setTitle('Un remplacement a été effectué.')
          .setDescription('Commande : /tournante (joueur1) (joueur2 *optionnel* )')
          .addFields(
            { name: `✅ Arrivé de ${arrive.username}`, value: `Le joueur <@${arrive.id}> a rejoint la faction.` },
          )
          .setTimestamp()
          .setFooter({ text: ' ', iconURL: 'https://cdn.discordapp.com/icons/768453319542439957/a_95e72ce2dee4e1ab30a12908e4667342.webp?size=96' });
        //Embed += `✅ Arrivé de ${arrive.username} \n Le joueur <@${arrive.id}> a rejoint la faction.`;
      }
      else{
        Embed = new Discord.EmbedBuilder()
          .setColor(0xb15bc8)
          .setTitle('Un problème est survenu.')
          .setDescription('Commande : /tournante (joueur1) (joueur2 *optionnel* )')
          .addFields(
            { name: `❌ Erreur`, value: `Aucun joueur n'a été trouvé.` },
          )
          .setTimestamp()
          .setFooter({ text: ' ', iconURL: 'https://cdn.discordapp.com/icons/768453319542439957/a_95e72ce2dee4e1ab30a12908e4667342.webp?size=96' });
      
        //Embed += `❌ Erreur \n Aucun joueur n'a été trouvé.`;
      }

      updateMessage();
      interaction.reply({ embeds: [Embed] });
      return;
    }
}});


























Client.login(secrets.Discord.API_KEY);
