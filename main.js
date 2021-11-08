const http = require("http");
const wa = require("@open-wa/wa-automate");
const mime = require("mime-types");
const fs = require("fs");
const mapLimit = require("async/mapLimit");

const hostname = "127.0.0.1";
const port = 8081;

const start = async () => {
  const client = await wa.create();

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });

  const dir = "./backup";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  await backUpContacts(client);
  await backUpChats(client, null);
  await backUpMedia();
  console.log("completed all");
};

const writeFile = (name, data) => {
  fs.writeFileSync(name, data);
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;
});

const backUpContacts = async (client) => {
  console.log("starting contact backup");
  const contacts = await client.getAllContacts();
  writeFile("./backup/contacts.json", JSON.stringify(contacts, null, 2));
  console.log("completed the contact backup");
};

const getChatIds = async (client, chatIds) => {
  if (!chatIds) {
    const ids = await client.getAllChatIds();
    const sortedIds = [...ids].sort();
    writeFile("./backup/chat-ids.json", JSON.stringify(sortedIds, null, 2));
    return sortedIds;
  }

  return chatIds;
};

const backUpChats = async (client, chatIds) => {
  console.log("starting chat backup");

  const sortedIds = await getChatIds(client, chatIds);

  const chatsCount = sortedIds.length;

  console.log(`${chatsCount} chats found. Please wait for the backup...`);

  const dir = "./backup/chat";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  mapLimit(
    sortedIds,
    2,
    async (id) => {
      try {
        console.log(`starting [${id}]`);
        const messages = await client.loadAndGetAllMessagesInChat(
          id,
          true,
          true
        );
        const filename = `./backup/chat/${id}.json`;
        writeFile(filename, JSON.stringify(messages, null, 2));
        console.log(`compeled [${id}]`);
      } catch (err) {
        console.log(`error on [${id}]`);
      }
    },
    (err) => {
      if (err) console.log("error on chat backup");
      else console.log("completed the chat backup");
    }
  );
};

const backUpMedia = async () => {
  console.log("starting media backup");

  const dir = "./backup/chat";
  let filenames = fs.readdirSync(dir);

  const allMessages = filenames
    .map((file) => {
      const path = `${dir}/${file}`;
      const messages = JSON.parse(fs.readFileSync(path));
      return messages;
    })
    .flat();

  mapLimit(
    allMessages,
    2,
    async (message) => {
      if (message.mimetype) {
        await getMedia(message);
      }
    },
    (err) => {
      if (err) console.log("error on media backup");
      else console.log("completed the media backup");
    }
  );
};

const getMedia = async (message) => {
  const { sender, mimetype, t: timestamp } = message;
  const extension = mime.extension(mimetype);
  const filename = `./backup/media/${sender.id}/${timestamp}.${extension}`;
  try {
    const mediaData = await wa.decryptMedia(message);
    fs.mkdirSync(`./backup/media/${sender.id}`, { recursive: true });
    writeFile(filename, mediaData);
  } catch (error) {
    console.log(`cannot get ${sender.id}/${timestamp}.${extension}`);
  }
};

start();
