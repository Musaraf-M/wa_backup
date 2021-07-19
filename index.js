const http = require('http');
const wa = require("@open-wa/wa-automate");
const mime = require('mime-types');
const fs = require('fs');

const testNumber = "";
const hostname = '127.0.0.1';
const port = 8081;

wa.create().then(async (client) => {
  await Promise.all([
    backUpContacts(client),
    backUpChats(client),
    backUpMedia(client),
    // backUpChatMsgs(client,`${testNumber}@c.us`)
  ]).then(() => {
    console.log("completed");
  })
});

const writeFile = (name, data) => {
  fs.writeFile(name, data, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log(`${name} saved!`);
  });
}


const server = http.createServer((req, res) => {
  res.statusCode = 200;
});

const backUpContacts = async (client) => {
  const contacts = await client.getAllContacts().then((cnts) => { return JSON.stringify(cnts) });
  writeFile("./backup/contacts.txt", contacts);
}

const backUpChats = async (client) => {
  let runCount = 0;
  await client.getAllChatIds().then((ids) => {
    ids.map(async (id) => {
      await client.loadAndGetAllMessagesInChat(id, true).then((message) => {
        const filename = `./backup/chat/${id}.txt`;
        writeFile(filename, JSON.stringify(message));
        runCount++;
        console.log(`${runCount} chat backedup`);
      }).catch(() => {
        runCount++;
        console.log(`${runCount} error on backup with id ${id}`);
      });
    });
  console.log(`${ids.length} chat retrevied please wait while backup is in process`);
  });
}

const backUpMedia = async (client) => {
  await client.getAllChatIds().then((ids) => {
    ids.map(async (id) => {
      await client.loadAndGetAllMessagesInChat(id, true).then((messages) => {
        messages.map(async (message) => {
          if (message.mimetype) {
            const filename = `./backup/media/${message.sender.id}/${message.t}.${mime.extension(message.mimetype)}`;
            let mediaData = await wa.decryptMedia(message).then(() => {
              fs.mkdirSync(`./backup/media/${message.sender.id}`, { recursive: true })
              writeFile(filename, mediaData);
            }).catch(() => {
              console.log(`cannot get ${message.t}.${mime.extension(message.mimetype)}`);
            });
          }
        });
      });
    });
  });
}

const backUpChatMsgs = async (client, id) => {
  client.loadAndGetAllMessagesInChat(id, true).then((messages) => {
    messages.map(async (message) => {
      if (message.mimetype) {
        const filename = `./backup/media/${message.sender.id}/${message.t}.${mime.extension(message.mimetype)}`;
        let mediaData = await wa.decryptMedia(message)
        fs.mkdirSync(`./backup/media/${message.sender.id}`, { recursive: true })
        writeFile(filename, mediaData);
      }
    });
  });
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
