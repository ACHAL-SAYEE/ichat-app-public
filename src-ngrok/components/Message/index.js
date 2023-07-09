import "./index.css";

var audio = new Audio('ting.mp3');
console.log(audio)

const Message = (props) => {
  const { messageDetails } = props;
  const { message, time, type } = messageDetails;
  const messageAlignmentClass = type === "sent" ? "right" : "left";
  if (type == "left") {
    audio.play();
  }
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
