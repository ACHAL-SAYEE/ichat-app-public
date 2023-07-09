const express = require("express");
const cors = require("cors");
const path = require("path");
const twilio = require("twilio");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
app.use(cors()); 
app.use(express.json());

const server = http.createServer(app); 
const io = socketIO(server, {
  cors: { origin: "http://localhost:3000" }, 
});

const dbURI = "mongodb://localhost:27017/ichat"; 
const accountSid = "";//twilo accountSid you get after signing up 
const authToken = "";//twilo authToken you get after signing up 
const client = new twilio(accountSid, authToken);

let registerOtp = null;
let loginOtp = null;

const initializeDBAndServer = async () => {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    app.set("socket", io);

    server.listen(3007, () => {
      console.log("Server running on port 3007");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

const authenticateToken = (request, response, next) => {
  let iChatJwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    iChatJwtToken = authHeader.split(" ")[1];
  }
  if (iChatJwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(iChatJwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.phoneNo = payload.phoneNo;
        next();
      }
    });
  }
};

initializeDBAndServer();

const userSchema = new mongoose.Schema({
  name: String,
  phoneNo: String,
  contacts: [
    {
      name: String,
      phoneNo: String,
      messages: Array,
    },
  ],
  unIdentifiedNumbers: [
    {
      phoneNo: String,
      messages: Array,
    },
  ],
  socketId: String,
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.status(200).send("This server is now public");
});

app.post("/registerOtp", async (request, response) => {
  const { phoneNo } = request.body;
  console.log(phoneNo);
  try {
    const user = await User.findOne({ phoneNo });
    console.log(user);
    if (!user) {
      registerOtp = Math.floor(100000 + Math.random() * 900000);
      response.status(200);
      response.send({ otp: registerOtp });

      const textmessage = `Your otp to register for ichat app is ${registerOtp}`;
      client.messages
        .create({
          body: textmessage,
          to: `+91${phoneNo}`,
          from: "+16183531862",
        })
        .then((message) => console.log(message.body));
    } else {
      response.status(401);
      response.send({
        error_msg:
          "This number is already registered. Please try a different number",
      });
    }
  } catch (e) {
    console.log(e);
    response.status(500);
    response.send({ error_msg: "Failed to check user" });
  }
});

app.post("/loginOtp", async (request, response) => {
  const { phoneNo } = request.body;
  console.log(phoneNo);
  try {
    const user = await User.findOne({ phoneNo });
    console.log(user);
    if (!user) {
      response.status(400);
      response.send({
        error_msg: `There does not exist any account with ${phoneNo}.Please try a different number`,
      });
    } else {
      loginOtp = Math.floor(100000 + Math.random() * 900000);
      response.status(200);
      response.send({ otp: loginOtp });

      const textmessage = `Your otp to login for ichat app is ${loginOtp}`;
      client.messages
        .create({
          body: textmessage,
          to: `+91${phoneNo}`,
          from: "+16183531862",
        })
        .then((message) => console.log(message.body));
    }
  } catch (e) {
    console.log(e);
    response.status(500);
    response.send({ error_msg: "Failed to check user" });
  }
});

app.post("/registerVerifyOtp", async (req, res) => {
  const { phoneNo, otp, name } = req.body;
  console.log(otp);
  console.log(registerOtp);
  if (otp == registerOtp) {
    try {
      const user = new User({
        name,
        phoneNo,
        contacts: [],
        unIdentifiedNumbers: [],
        socketId: "",
      });
      await user.save();
      res.status(200);
      res.send({ success_message: "user successfully registered" });
    } catch (e) {
      console.log(e);
      res.status(500);
      res.send({ error_msg: "Failed to register user" });
    }
  } else {
    res.status(400);
    res.send({ error_msg: "Invalid Otp" });
  }
});

app.post("/loginVerifyOtp", async (req, res) => {
  const { phoneNo, otp } = req.body;
  console.log(otp);
  console.log(loginOtp);
  if (otp == loginOtp) {
    const payload = {
      phoneNo: phoneNo,
    };
    const iChatJwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
    res.send({ iChatJwtToken: iChatJwtToken });
  } else {
    res.status(400);
    res.send({ error_msg: "Invalid Otp" });
  }
});

app.get("/profile/", authenticateToken, async (request, response) => {
  const { phoneNo } = request;
  try {
    const userDetails = await User.findOne({ phoneNo });
    response.send(userDetails);
  } catch (e) {
    console.log(e);
    response.status(500);
    response.send({ error_msg: "Failed to fetch user details" });
  }
});

app.post("/addContact", authenticateToken, async (request, response) => {
  console.log("called");
  const { phoneNo, contactname } = request.body;
  const currentUserPhoneNo = request.phoneNo;
  if (phoneNo === currentUserPhoneNo) {
    response.status(400);
    response.send({
      error_msg: "You cannot add yourself to your contacts list",
    });
  } else {
    const userDetails = await User.findOne({ phoneNo: phoneNo });
    const currentUserDetails = await User.findOne({
      phoneNo: currentUserPhoneNo,
    });
    let YourContacts = await User.findOne({
      phoneNo: currentUserPhoneNo,
      contacts: { $elemMatch: { phoneNo: phoneNo } },
    });
    console.log(YourContacts);

    if (!(YourContacts === null)) {
      response.status(400);
      response.send({
        error_msg: "This number is already in your contacts list",
      });
    } else {
      if (userDetails === null) {
        response.status(400);
        response.send({ error_msg: `${phoneNo} is not on ichat yet` });
      } else {
        try {
          await User.updateOne(
            { phoneNo: currentUserPhoneNo },
            {
              $set: {
                contacts: [
                  ...currentUserDetails.contacts,
                  { name: contactname, phoneNo: phoneNo, messages: [] },
                ],
              },
            }
          );
          response.status(200).send({ success_msg: `user exists on ichat` });
        } catch (error) {
          console.log(error);
          response.status(500).send({ error_msg: "Failed to update contacts" });
        }
      }
    }
  }
});

app.post("/sendMessage", authenticateToken, async (request, response) => {
  const currentUserPhoneNo = request.phoneNo;
  const { ToUser, MessageDetails } = request.body;
  const Sendtime = new Date(MessageDetails.MsgSentTime);
  const socket = request.app.get("socket");
  try {
    await User.updateOne(
      { phoneNo: currentUserPhoneNo, "contacts.phoneNo": ToUser.phoneNo },
      {
        $push: {
          "contacts.$.messages": {
            message: MessageDetails.msg,
            time: Sendtime,
            type: "sent",
          },
        },
      }
    );
    const findToUser = await User.findOne({
      phoneNo: ToUser.phoneNo,
      "contacts.phoneNo": currentUserPhoneNo,
    });

    if (findToUser === null) {
    } else {
      const recipientSocketId = findToUser.socketId;
      console.log(recipientSocketId); 
      if (recipientSocketId === "") {
      } else {
        const MessageDetilstoSendToRecipent = {
          from: currentUserPhoneNo,
          message: MessageDetails.msg,
          time: Sendtime,
          type: "received",
        };
        socket
          .to(recipientSocketId)
          .emit("newMessage", MessageDetilstoSendToRecipent);
      }

      await User.updateOne(
        {
          phoneNo: ToUser.phoneNo,
          "contacts.phoneNo": currentUserPhoneNo,
        },
        {
          $push: {
            "contacts.$.messages": {
              message: MessageDetails.msg,
              time: Sendtime,
              type: "recieved",
            },
          },
        }
      );

      response.status(200).send({ success_msg: "Message sent successfully" });
    }
  } catch (error) {
    console.log(error);
    response.status(500).send({ error_msg: "Failed to send message" });
  }
});

io.on("connection", (socket) => {
  socket.on("storeSocketId", async (phoneNo) => {
    try {
      await User.updateOne({ phoneNo }, { $set: { socketId: socket.id } });
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      await User.updateOne(
        { socketId: socket.id },
        { $unset: { socketId: "" } }
      );
    } catch (error) {
      console.log(error);
    }
  });
});
