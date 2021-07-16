const http = require('http');
const wa = require("@open-wa/wa-automate");
const mime = require('mime-types');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 8081;

wa.create().then(async (client) => {
  backUpContacts(client);
  backUpChats(client);
  backUpMedia(client);
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
  writeFile("./backup/contacts.json", contacts);
}

const backUpChats = async (client) => {
  await client.getAllChatIds().then((ids) => {
    ids.map(async (id) => {
      await client.getAllMessagesInChat(id, true).then((message) => {
        const filename = `./backup/chat/${id}.json`;
        writeFile(filename, JSON.stringify(message));
      })
    })
  });
}

const backUpMedia = async (client) => {
  await client.getAllChatIds().then((ids) => {
    ids.map(async (id) => {
      await client.getAllMessagesInChat(id, true).then((messages) => {
        messages.map(async(message)=>{
          if (message.mimetype) {
            const filename = `${message.t}.${mime.extension(message.mimetype)}`;
            let mediaData = await wa.decryptMedia(message).catch((err)=>{
              if(err.response.status == 404) {
                mediaData = wa.decryptMedia(client.forceStaleMediaUpdate(message.id));
                writeFile(filename, mediaData);
              }
            })
          writeFile(filename, mediaData);
          }
        })
      })
    })
  });
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
