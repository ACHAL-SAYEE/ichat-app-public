import React, { useEffect } from "react";
import "./index.css";
// import tingSound from "./ting.mp3";

// var audio = new Audio("/ting.mp3");

// console.log(audio);

const Message = (props) => {
  const { messageDetails } = props;
  const { message, time, type } = messageDetails;
  // useEffect(() => {
  //   if (type === "left") {
  //     const audio = new Audio(tingSound);
  //     audio.play();
  //   }
  // }, [type]);
  // if (type === "recieved") {
  //   audio.play();
  // }
  const messageAlignmentClass = type === "sent" ? "right" : "left";

  const MessageColorClass = type === "sent" ? "sentMessage" : "recievedMessage";
  const MsgSentTime = new Date(time);
  const currentHour = MsgSentTime.getHours();
  const currentMinute = MsgSentTime.getMinutes();
  return (
    <div className={`chat-item ${messageAlignmentClass}`}>
      <div className="msg-info">
        <p>
          {currentHour}:{currentMinute}
        </p>
      </div>
      <p className={`message-content ${MessageColorClass}`}>{message}</p>
    </div>
  );
};
export default Message;
