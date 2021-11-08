const http = require("http");
const wa = require("@open-wa/wa-automate");
const mime = require("mime-types");
const fs = require("fs");
const async = require("async");

const hostname = "127.0.0.1";
const port = 8081;

const browserId = "9186d6e4-bf53-4641-97a9-f4f828c5e990";

wa.create({
  headless: false,
  useChrome: true,
  browserWSEndpoint: `ws://127.0.0.1:9222/devtools/browser/${browserId}`,
})
  .then(async (client) => {
    await Promise.all([
      // backUpContacts(client),
      backUpChats(client),
    ]);
  })
  .catch((err) => {
    console.log(err);
  });

const writeFile = (name, data) => {
  fs.writeFile(name, data, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log(`${name} saved!`);
  });
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;
});

const backUpContacts = async (client) => {
  const contacts = await client.getAllContacts().then((cnts) => {
    return JSON.stringify(cnts);
  });
  writeFile("./backup/contacts.txt", contacts);
};

const runBackup = async() =>{
  async.mapLimit(temp, 2, async (id) => {
    console.log(`${id} chat backup in progress`);
    return await client
      .loadAndGetAllMessagesInChat(id, true)
      .then((message) => {
        console.log(`${id} chat received`);
        const filename = `./backup/chat/${id}.txt`;
        writeFile(filename, JSON.stringify(message));
        runCount++;
        console.log(`${runCount} chat backedup`);
      })
      .catch(() => {
        runCount++;
        console.log(`${runCount} error on backup with id ${id}`);
      });
    })
}

let runCount = 0;
const backUpChats = async (client) => {
  await client
    .getAllChatIds()
    .then(async (ids) => {
      const temp = ids.slice(0,999);
      const temp1 = ids.slice(1000,1999);
      const temp2 = ids.slice(2000);

      console.log("Chat backup initiated");
      await runBackup(temp);
      await runBackup(temp1);
      await runBackup(temp2);
      });
      console.log(
        `${ids.length} chat retrevied please wait while backup is in process`
      );
    }
};

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

// fs.readFile("./backup/contacts.txt", (err, data) => {
//   if (err) {
//     console.error(err)
//     return
//   }
//   console.log(JSON.parse(data))
// })

// const browserId="8c1832c4-930d-4d41-ba4e-f4e5204cffff";

// wa.create({
//   headless: false,
//   useChrome: true,
//   sessionData:"eyJXQUJyb3dzZXJJZCI6Ilwid0s1V3BjQ1hZM3dTWGt1QkN0SUovdz09XCIifQ==",
//   browserWSEndpoint:`ws://127.0.0.1:9222/devtools/browser/${browserId}`
// }).then(async (client) => {
//   await Promise.all([
//     // backUpContacts(client),
//     backUpChats(client),
//     // backUpMedia(client),
//     // backUpChatMsgs(client,`${testNumber}@c.us`)
//   ])
// }).catch((err)=>{
//   console.log(err);
// })

// const backUpMedia = async (client) => {
//   await client.getAllChatIds().then((ids) => {
//     ids.map(async (id) => {
//       await client.loadAndGetAllMessagesInChat(id, true).then((messages) => {
//         messages.map(async (message) => {
//           if (message.mimetype) {
//             const filename = `./backup/media/${message.sender.id}/${message.t}.${mime.extension(message.mimetype)}`;
//             let mediaData = await wa.decryptMedia(message).then(() => {
//               fs.mkdirSync(`./backup/media/${message.sender.id}`, { recursive: true })
//               writeFile(filename, mediaData);
//             }).catch(() => {
//               console.log(`cannot get ${message.t}.${mime.extension(message.mimetype)}`);
//             });
//           }
//         });
//       });
//     });
//   });
// }

// const backUpChatMsgs = async (client, id) => {
//   client.loadAndGetAllMessagesInChat(id, true).then((messages) => {
//     messages.map(async (message) => {
//       if (message.mimetype) {
//         const filename = `./backup/media/${message.sender.id}/${message.t}.${mime.extension(message.mimetype)}`;
//         let mediaData = await wa.decryptMedia(message)
//         fs.mkdirSync(`./backup/media/${message.sender.id}`, { recursive: true })
//         writeFile(filename, mediaData);
//       }
//     });
//   });
// }
