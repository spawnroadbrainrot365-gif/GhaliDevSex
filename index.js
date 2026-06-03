const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMembers
  ] 
});

const ALLOWED_ROLE_ID = '1483287560397787137';

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  if (message.content === '-function UnbanFromAllUsers()') {
    
    if (!message.member.roles.cache.has(ALLOWED_ROLE_ID)) {
      return;
    }
    
    try {
      const bannedUsers = await message.guild.bans.fetch();
      const totalBanned = bannedUsers.size;
      let unbannedCount = 0;
      
      const replyMessage = await message.reply(`تم فك الباند من 0 والباقي: ${totalBanned}`);
      
      for (const [userId] of bannedUsers) {
        await message.guild.members.unban(userId);
        unbannedCount++;
        
        const remaining = totalBanned - unbannedCount;
        await replyMessage.edit(`فكينا ${unbannedCount} والباقي: ${remaining}`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      await replyMessage.edit('Success. unBan From All. Users');
      
    } catch (error) {
      console.error(error);
    }
  }
});

client.login('MTUxMTg2MjQ4NzM0MTg2Mjk4Mg.G2OXlv.yCinQv_nHz6KF4EOHxivIeN3N2TLMsY_9xIC74');
