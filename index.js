require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const telegramToken = process.env.TELEGRAM_API_TOKEN;
const djangoApiToken = process.env.DJANGO_API_TOKEN;

const data = require("./affirmations.json");

function returnAffirmation() {
  let affirmation =
    data.affirmations[Math.floor(Math.random() * data.affirmations.length)];
  return `${affirmation}\n\nUnfortunately, I can't read your message. If you're trying to contact scuzzy, please message @scuzzyfox !`;
}

async function addToDB(id, token) {
  let url = "https://api.scuzzyfox.com/telegram/";

  let tokenKeyword = "";
  let toSend = {
    chat_id: id,
  };
  try {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `${tokenKeyword} ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toSend),
    });

    if (!response.ok) {
      throw new Error("Could not add to database");
    }
  } catch {
    throw new Error("Could not add to database");
  }
}

async function removeFromDB(id, token) {
  let url = "https://api.scuzzyfox.com/telegram/";
  let tokenKeyword = "";
  let toSend = {
    chat_id: id,
  };

  let response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `${tokenKeyword} ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toSend),
  });
  if (!response.ok) {
    throw new Error("Could not remove from database");
  }
}

async function readAllFromDB(token) {
  let url = "https://api.scuzzyfox.com/telegram/";

  let tokenKeyword = "";
  let response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `${tokenKeyword} ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Could not read from database");
  }

  // the response should be an array of chat_ids
  return await response.json();
}

console.log("Starting bot.");

const bot = new TelegramBot(telegramToken, { polling: true });

bot.onText(/\/start/, function onStart(msg) {
  addToDB(msg.chat.id, djangoApiToken)
    .then(() => {
      bot.sendMessage(
        msg.chat.id,
        "Thank you for subscribing! You will now be notified whenever Scuzzy opens for commissions. I suggest setting a special notification sound for this chat/bot!"
      );
    })
    .catch((err) => {
      console.log(err);
      bot.sendMessage(
        msg.chat.id,
        "Sorry, something went wrong in trying to subscribe you. Please try again in a bit or contact @scuzzyfox for help."
      );
    });
});

bot.onText(/\/unsubscribe/, function onUnsubscribe(msg) {
  removeFromDB(msg.chat.id, djangoApiToken)
    .then(() => {
      bot.sendMessage(
        msg.chat.id,
        "You have been unsubscribed from notifications. If you'd like to subscribe again, please message /start."
      );
    })
    .catch((err) => {
      console.log(err);
      bot.sendMessage(
        msg.chat.id,
        "Sorry, something went wrong in trying to unsubscribe you. Please try again in a bit or contact @scuzzyfox for help."
      );
    });
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "To subscribe, please message /start.\nTo unsubscribe, please message /unsubscribe."
  );
});

bot.on("message", (msg) => {
  // if message matches pattern of /word then return
  if (msg.text.match(/\/[a-zA-Z0-9]+/)) return;

  bot.sendMessage(msg.chat.id, returnAffirmation());
});

console.log("Bot started.");
