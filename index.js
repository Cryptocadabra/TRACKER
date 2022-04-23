require("dotenv").config();
const {
  Telegraf,
  Markup,
  session,
  Scenes: { WizardScene, Stage },
} = require("telegraf");
const axios = require("axios");

// Telegraf
const bot = new Telegraf(process.env.BOT_TOKEN);

// Session Initialize
bot.context.db = {
  userIdList: [],
};

// Keyboard
const greetingMarkup = Markup.keyboard([
  ["🔐 Add account 🔐"],
  ["⚙️ Account details ⚙️"],
  ["📜 Statement 📜"],
  ["❓ How to connect a cashback? ❓"],
  ["👨‍💻 Support 👨‍💻"],
]).resize();

const brokerListKeyboard = Markup.keyboard([["binanceIdList"]]).resize();
const userProps = Markup.keyboard([["Remind me later"]]).resize();
// const userWalletValidation = Markup.keyboard([
//   ["Correct"],
//   ["Change address"],
// ]).resize();

const exitKeyboard = Markup.keyboard(["exit"]);

// Phrases
const brokerChose = `
<u><b>Step 1: Choosing the broker</b></u>

<i>Please choose a broker from the list below (at the moment we only work with <b>binanceIdList</b>).</i>
`;

const brokerWasChosen = `
<u><b>Step 2: ID authentication</b></u>

<i>Please enter your <b>binanceIdList</b> ID for your account that you registered using our partner link.</i>

<a href="https://www.binanceIdList.com/en/support/faq/e23f61cafb5a4307bfb32506bd39f89d">Where can I find my binanceIdList ID</a>
`;

const idNotEntered = `
You didnt enter your id
Please, enter ID
`;

const userAddressRequest = `
<u><b>Step 3: Payment details</b></u>

<i>We make cashback payments with help of <b>TronLink Wallet</b>. Please enter the address of your <b>TronLink wallet</b>.</i>

<i>We will automatically transfer money to it twice a week.</i>

<a href="www.google.com">Why TronLink?</a>
<a href="www.google.com">Registration on TronLink Wallet</a>
`;

const userEmailRequest = `
<u><b>Last step: Contact details</b></u>

<i>Please, send us your email or telegram username that we can contact you.</i>
`;

bot.use(session());

// Start
bot.start((ctx) => {
  try {
    ctx.session.user = {
      userData: {
        userFirstName: ctx.chat.first_name || "FirstName",
        userLastName: ctx.chat.last_name || "LastName",
        telegramChatID: ctx.chat.id,
        telegramUserName: ctx.chat.username,
        registrationDate: Date.now(),
      },

      binanceIdList: [],
      TRC20: null,
      contacts: [],
    };

    axios.post("http://localhost/userList", {
      data: ctx.session.user,
    });

    return ctx.replyWithHTML(
      `👋 Welcome, dear ${ctx.from.first_name}!`,
      greetingMarkup
    );
  } catch (e) {
    console.log(e);
  }
});

// Stages
const brokerHandler = Telegraf.on("text", async (ctx) => {
  await ctx.replyWithHTML(brokerWasChosen, {
    disable_web_page_preview: true,
    reply_markup: { remove_keyboard: true },
  });

  return ctx.wizard.next();
});

const userIdHandler = Telegraf.hears(/^[0-9]+$/, async (ctx) => {
  const userMessage = ctx.message.text;

  if (userMessage) {
    ctx.session.user.binanceIdList.push(userMessage);
  } else {
    await ctx.replyWithHTML(idNotEntered);
  }

  await ctx.replyWithHTML(
    `🥳 Great! ID <code>${
      ctx.session.user.binanceIdList[ctx.session.user.binanceIdList.length - 1]
    }</code> was added.`
  );

  await ctx.replyWithHTML(userAddressRequest, {
    disable_web_page_preview: true,
  });

  return ctx.wizard.next();
});

const userWalletHandler = Telegraf.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  ctx.session.user.TRC20 = userMessage;

  await ctx.replyWithHTML(
    `
    👍 Done! Address <code>${ctx.session.user.TRC20}</code> was added.

<i>We want to remind you that you can change it at any time in your account settings.</i>
    `
  );

  await ctx.replyWithHTML(userEmailRequest);

  return ctx.wizard.next();
});

const userEmailHandler = Telegraf.on("text", async (ctx) => {
  const userMessage = ctx.message.text;

  ctx.session.user.contacts.push(userMessage);

  await ctx.replyWithHTML(
    `👍 Great! Now we can contact you <code>${
      ctx.session.user.contacts[ctx.session.user.contacts.length - 1]
    } </code>`,
    greetingMarkup
  );

  // axios.post("https://cryptocadabra-data-server.herokuapp.com/userList", {
  //   binanceIdList: [...ctx.session.user.binanceIdList],
  //   TRC20: ctx.session.user.TRC20,
  //   contacts: [...ctx.session.user.contacts],
  // });

  return ctx.scene.leave();
});

// WizardScenes
const infoScene = new WizardScene(
  "infoScene",
  brokerHandler,
  userIdHandler,
  userWalletHandler,
  userEmailHandler
);

infoScene.enter((ctx) => ctx.replyWithHTML(brokerChose, brokerListKeyboard));

const stage = new Stage([infoScene]);

bot.use(stage.middleware());
// Scene enter
bot.hears("🔐 Add account 🔐", (ctx) => {
  ctx.scene.enter("infoScene");
});

bot.hears("📜 Statement 📜", (ctx) => {
  if (ctx.session.user.binanceIdList.length === 0) {
    return ctx.replyWithHTML(`😔 Oh no, unfortunately we can't find your account statement.
    
<i>Please, add a new account using the <b>Add account</b> command list below</i>.
    `);
  } else {
    axios
      .get("https://cryptocadabra-data-server.herokuapp.com/userData")
      .then((response) => {
        const data = response.data.userDataOnServer;

        const getUserData = data.find((el) => {
          return (
            el["Friend''s ID (Spot)"] ==
            ctx.session.user.binanceIdList[
              ctx.session.user.binanceIdList.length - 1
            ]
          );
        });

        ctx.reply(`${getUserData["Friend''s ID (Spot)"]}`);
      })
      .catch((error) => {
        console.log(error.response);
      });
  }
});

bot.hears("⚙️ Account details ⚙️", async (ctx) => {
  if (ctx.session.user.binanceIdList.length === 0) {
    ctx.replyWithHTML(`😢 Unfortunately, ${ctx.chat.id} you can't view your <b>account details</b> due to you don't have any added accounts yet
    
<i>Please, add a new account using the <b>Add account</b> command list below</i>.
    `);
  } else {
    await ctx.replyWithHTML(`
  📝 <b>Your account information:</b>

<b>binanceIdList ID List:</b> <code>${ctx.session.user.binanceIdList.join(
      " "
    )}</code>
<b>TRC20 Address:</b> <code>${ctx.session.user.TRC20}</code>
<b>Contacts:</b> <code>${ctx.session.user.contacts.join(" ")}</code>`);
  }
});

// Scene leave
stage.hears("exit", (ctx) => ctx.scene.leave());

bot.launch();

// ctx.chat.id
