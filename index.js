require("dotenv").config();

const getImagesFromApi = require("./utils/getImagesFromApi.js");
const getAudioFromApi = require("./utils/getAudioFromApi.js");
const getVideoFromApi = require("./utils/getVideoFromApi.js");
const randomNumber = require("./utils/randomNumber.js");

const TelegramApi = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramApi(token, { polling: true });

/*Implementation*/

const categorySelections = {
  parse_mode: "HTML",
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Category Selections", callback_data: "category-selections" }],
    ],
  }),
};

const categoryOptions = {
  parse_mode: "HTML",
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [
        { text: "Images", callback_data: "images" },
        { text: "Video", callback_data: "video" },
        { text: "Audio", callback_data: "audio" },
      ],
    ],
  }),
};

bot.setMyCommands([
  { command: "/start", description: "Welcome message" },
  { command: "/category", description: "Category selection" },
]);

const currentState = { state: "initial" };

// Messages

bot.on("message", (message) => {
  const text = message.text;
  const chatId = message.chat.id;
  const userName = message.chat.first_name;

  if (text === "/start") {
    sendStartMessage(chatId, userName);
    currentState.state = "initial";
  } else if (text === "/category") {
    sendCategoryMessage(chatId);
    currentState.state = "initial";
  } else if (currentState.state === "initial") {
    bot.sendMessage(chatId, "Вы не выбрали категорию.");
  }

  switch (currentState.state) {
    case "images":
      sendImages(chatId, text);
      break;
    case "audio":
      sendAudio(chatId, text);
      break;

    case "video":
      sendVideo(chatId, text);
      break;
  }
});

// Handler Buttons

bot.on("callback_query", (message) => {
  const valueBtn = message.data;
  const chatId = message.from.id;

  if (valueBtn === "category-selections") {
    sendCategoryMessage(chatId);
  } else if (valueBtn === "images") {
    currentState.state = "images";
    const textMessage = `<b>Введите ваш запрос</b>\n\nЗапрос должен быть на английском языке, например —\n<b>Nature</b>, <b>Tigers</b>, <b>People</b> — или более конкретным, например, <b>People group at work</b>\n\nBot отправит вам фотографии.`;
    bot.sendMessage(chatId, textMessage, { parse_mode: "HTML" });
  } else if (valueBtn === "audio") {
    currentState.state = "audio";
    const textMessage = `<b>Введите имя исполнителя или название аудио</b>\n\nЗапрос должен быть на английском языке, например —\n<b>Lady Gaga</b>, <b>Rihanna</b>, <b>Britney Spears</b> — или более конкретным, например, <b>Lady Gaga - Poker Face</b>.\n\nBot отправит вам аудио.`;
    bot.sendMessage(chatId, textMessage, { parse_mode: "HTML" });
  } else if (valueBtn === "video") {
    currentState.state = "video";
    const textMessage = `<b>Введите название интересующего вас видео</b>\n\nЗапрос должен быть на английском языке, например —\n<b>Animals</b>, <b>Films</b>, <b>Funny</b>.\n\nBot отправит вам видео.`;
    bot.sendMessage(chatId, textMessage, { parse_mode: "HTML" });
  }
});

// Functions

async function sendStartMessage(id, userName) {
  const textMessage = `<b>Приветствую вас ${userName}</b> \n\nЧто умеет этот Bot? \n\nBot ищет фотографии, видео и аудио \nна любую тему по вашему запросу и отправляет их вам.\n\n Выбрать категорию &#128071;`;
  await bot.sendMessage(id, textMessage, categorySelections);
}

async function sendCategoryMessage(id) {
  const textMessage = `<b>Выберите интересующую вас категорию:</b>\n\n- Фотографии\n- Видео\n- Аудио`;
  await bot.sendMessage(id, textMessage, categoryOptions);
}

/*Send images*/

async function sendImages(chatId, text) {
  const data = getImagesFromApi(text);

  data.then(async (res) => {
    if (res.photos.length < 5 || res.total_results === 0) {
      await bot.sendMessage(
        chatId,
        "Фотографий по данному запросу у меня нет(Или запрос введен некорректно), попробуйте еще раз."
      );
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    } else {
      const images = res.photos.map((image) => {
        return {
          type: "photo",
          media: image.src.medium,
        };
      });
      await bot.sendMediaGroup(chatId, images);
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    }
  });
}

/*Send audio*/

async function sendAudio(chatId, text) {
  const data = getAudioFromApi(text);

  data.then(async (res) => {
    if (res.error) {
      await bot.sendMessage(
        chatId,
        `Error: ${res.error.message} (Повторите запрос позже)`
      );
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    } else if (res.data.length === 0 || res.total === 0) {
      bot.sendMessage(
        chatId,
        "Аудио по данному запросу у меня нет(Или запрос введен некорректно), попробуйте еще раз."
      );
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    } else {
      const results = res.data.length;

      if (results <= 10) {
        const arrayAudio = res.data.map((item) => {
          return {
            type: "audio",
            media: item.preview,
          };
        });
        await bot.sendMediaGroup(chatId, arrayAudio);
      } else if (results > 10) {
        const arrayAudio = [];

        for (let i = 0; i < 10; i++) {
          const object = res.data[i];
          arrayAudio.push({
            type: "audio",
            media: object.preview,
          });
        }
        await bot.sendMediaGroup(chatId, arrayAudio);
      }
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    }
  });
}

/*Send video*/

async function sendVideo(chatId, text) {
  const data = getVideoFromApi(text);

  data.then(async (res) => {
    if (res.error) {
      await bot.sendMessage(
        chatId,
        `Error: Code ${res.error.code}, Message: ${res.error.message}`
      );
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    } else if (res.items.length === 0 || res.pageInfo.totalResults === 0) {
      bot.sendMessage(
        chatId,
        "Видео по данному запросу у меня нет(Или запрос введен некорректно), попробуйте еще раз."
      );
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    } else {
      const results = res.items.length;
      const random = randomNumber(results);
      const id = res.items[random].id.videoId;
      const link = `https://www.youtube.com/watch?v=${id}`;
      await bot.sendMessage(chatId, link);
      await sendCategoryMessage(chatId);
      currentState.state = "initial";
    }
  });
}
