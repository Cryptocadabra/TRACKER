require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

// Telegraf
const bot = new Telegraf(process.env.BOT_TOKEN);

// Greeting message
bot.start(async (ctx) => {
  try {
    await ctx.replyWithHTML(
      `<b>👋 Welcome, dear ${ctx.chat.first_name}! </b> 

My name is Wally. I'm a robot assistant in Cryptocadabra.
`,
      Markup.inlineKeyboard([
        [Markup.button.callback("📲 Add account 📲", "account")],
        [Markup.button.callback("📜 Statement 📜", "statement")],
        [
          Markup.button.callback(
            "❓ How to connect a cashback? ❓",
            "instruction"
          ),
        ],
        [Markup.button.callback("👨‍💻 Support 👨‍💻", "support")],
      ])
    );
  } catch (e) {
    console.log(e);
  }
});

// Event Handlers
bot.action("account", async (ctx) => {
  try {
    await ctx.answerCbQuery();
  } catch (e) {
    console.log(e);
  }
});

bot.launch();
