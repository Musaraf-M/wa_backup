const http = require('http');
const wa = require("@open-wa/wa-automate");
const mime = require('mime-types');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 8081;

wa.create().then(async (client) => {
  // backUpContacts(client);
  // backUpChats(client);

      await client.getAllMessagesInChat("918248505510@c.us", true).then((messages) => {
        messages.map(async(message)=>{
          // if (message.mimetype) {
          //   const filename = `${message.t}.${mime.extension(message.mimetype)}`;
          //   const mediaData = await wa.decryptMedia(message);
            
          //   fs.writeFile(filename, mediaData, function(err) {
          //     if (err) {
          //       return console.log(err);
          //     }
          //     console.log('The file was saved!');
          //   });
          // }
          console.log(message.content);
        })
      })
});


const server = http.createServer((req, res) => {
  res.statusCode = 200;
});

const backUpContacts = async (client) => {
  const contacts = await client.getAllContacts().then((cnts) => { return JSON.stringify(cnts) });
  fs.writeFile("./backup/contacts.json", contacts, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log('Contacts saved!');
  });
}

const backUpChats = async (client) => {
  await client.getAllChatIds().then((ids) => {
    ids.map(async (id) => {
      await client.getAllMessagesInChat(id, true).then((message) => {
        const filename = `./backup/chat/${id}.json`;
        fs.writeFile(filename, JSON.stringify(message), function (err) {
          if (err) {
            return console.log(err);
          }
          console.log(`Chat ${id} saved!`);
        });
      })
    })
  });
}

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
