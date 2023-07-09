import { Component } from "react";
import Cookies from "js-cookie";
import styles from "./index.module.css";
import Loader from "react-loader-spinner";
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { BsSearch, BsEmojiSmile } from "react-icons/bs";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { v4 as uuidv4 } from "uuid";
import Message from "../Message";
import socketIOClient from "socket.io-client";
import userEvent from "@testing-library/user-event";
const iChatJwtToken = Cookies.get("ichat_jwt_token");

const apiStatusConstants = {
  initial: "INITIAL",
  success: "SUCCESS",
  failure: "FAILURE",
  inProgress: "IN_PROGRESS",
};

class Home extends Component {
  state = {
    socket: null,
    apiStatus: "IN_PROGRESS",
    userDetails: {},
    showAddContactsView: false,
    phoneNo: null,
    contactname: null,
    showMessagesView: false,
    activeContact: null,
    messageInput: "",
    MessagesList: [],
  };

  async componentDidMount() {
    await this.getUserProfile();
    this.initializeSocketConnection();
  }

  initializeSocketConnection = () => {
    const { userDetails } = this.state;
    const socket = socketIOClient(
      "https://b71b-103-137-198-235.ngrok-free.app"
    );

    socket.on("newMessage", (newMessageDetils) => {
      this.updateMessagesList(newMessageDetils);
    });

    socket.on("connect", () => {
      // console.log("gh", socket);
      socket.emit("storeSocketId", userDetails.phoneNo);
    });

    this.setState({ socket });
  };

  onClickLogout = () => {
    const { history } = this.props;

    Cookies.remove("ichat_jwt_token");
    history.replace("/login");
  };

  getUserProfile = async () => {
    this.setState({
      apiStatus: apiStatusConstants.inProgress,
    });
    const iChatJwtToken = Cookies.get("ichat_jwt_token");

    const apiUrl = "https://b71b-103-137-198-235.ngrok-free.app/profile";
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
      },
      method: "GET",
    };
    console.log("fuck");
    const response = await fetch(apiUrl, options);
    console.log(response);
    if (response.ok) {
      const fetchedData = await response.json();

      this.setState({
        userDetails: fetchedData,
        apiStatus: apiStatusConstants.success,
      });
    } else {
      this.setState({
        apiStatus: apiStatusConstants.failure,
      });
    }
  };

  LoadHomePage = () => {
    const { apiStatus } = this.state;

    switch (apiStatus) {
      case apiStatusConstants.success:
        return this.renderUserProfileView();
      case apiStatusConstants.failure:
        return this.renderFailureView();
      case apiStatusConstants.inProgress:
        return this.renderLoadingView();
      default:
        return <h1>rt</h1>;
    }
  };

  renderLoadingView = () => (
    <div className="home-loader-container">
      <Loader type="ThreeDots" color="#0b69ff" height="50" width="50" />
    </div>
  );

  ToggleAddContactsView = () => {
    this.setState({ showAddContactsView: true });
  };

  onchangePhoneno = (event) => {
    this.setState({ phoneNo: event.target.value });
  };

  onchangeContactname = (event) => {
    this.setState({ contactname: event.target.value });
  };

  Addcontact = async (event) => {
    event.preventDefault();

    const { phoneNo, contactname } = this.state;
    const userDetails = { phoneNo, contactname };
    const apiUrl = "https://b71b-103-137-198-235.ngrok-free.app/addContact";
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(userDetails),
    };
    const response = await fetch(apiUrl, options);
    if (response.ok) {
      const fetchedData = await response.json();
      console.log(fetchedData);
    } else {
      const fetchedData = await response.json();
      console.log(fetchedData);
    }
  };

  SetMessagesList = () => {
    const { activeContact, userDetails } = this.state;
    const activeContactDetails = userDetails.contacts.find(
      (contact) => contact.name === activeContact
    );
    this.setState({
      MessagesList: [...activeContactDetails.messages],
    });
  };

  updateMessagesList = (newMessageDetils) => {
    const { MessagesList } = this.state;
    console.log([...MessagesList, newMessageDetils]);
    this.setState({
      MessagesList: [...MessagesList, newMessageDetils],
    });
  };

  displayChatView = (contactName) => {
    this.setState(
      { showMessagesView: true, activeContact: contactName },
      this.SetMessagesList
    );
  };

  updateMsgValue = (event) => {
    this.setState({ messageInput: event.target.value });
  };

  postMsg = async (event, phoneNo) => {
    const { socket } = this.state;
    if (event.key === "Enter" && this.state.messageInput !== "") {
      const { messageInput, userDetails } = this.state;
      // const logoColor = user_logo_colors[randomNumber];
      const msg = messageInput;
      const MsgSentTime = new Date();
      // console.log(MsgSentTime);
      // console.log(typeof MsgSentTime);
      const id = uuidv4();
      const MessageDetails = {
        msg,
        id,

        MsgSentTime,
      };
      const ToUser = { phoneNo };
      const MessageSendingDetails = {
        ToUser,
        MessageDetails,
      };
      const apiUrl = "https://b71b-103-137-198-235.ngrok-free.app/sendMessage";
      const options = {
        headers: {
          Authorization: `Bearer ${iChatJwtToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(MessageSendingDetails),
      };

      const response = await fetch(apiUrl, options);
      if (response.ok) {
        const fetchedData = await response.json();
        // console.log(fetchedData);

        const newMessage = { message: msg, time: MsgSentTime, type: "sent" };
        this.updateMessagesList(newMessage);
        console.log("ready to recieve");
      } else {
        const fetchedData = await response.json();
        console.log(fetchedData);
      }
    }
  };

  renderUserProfileView = () => {
    const {
      userDetails,
      showAddContactsView,
      phoneNo,
      contactname,
      showMessagesView,
      activeContact,
      messageInput,
      MessagesList,
    } = this.state;

    const activeContactDetails = userDetails.contacts.find(
      (contact) => contact.name === activeContact
    );
    // console.log("activeContactDetails", activeContactDetails);
    return (
      <div className={styles.bg}>
        <div className={styles["chats-conatiner"]}>
          <button type="button" onClick={this.onClickLogout}>
            LogOut
          </button>
          {userDetails.contacts.length === 0 && !showAddContactsView && (
            <>
              <h1>Your contacts list is empty</h1>
              <button
                type="button"
                className={styles.x}
                onClick={this.ToggleAddContactsView}
              >
                Add Contacts
              </button>
            </>
          )}
          {showAddContactsView && (
            <div>
              <p>Enter phone No to get started</p>
              <form onSubmit={this.Addcontact}>
                <label htmlFor="phoneNo">Phone No</label>
                <input
                  type="search"
                  className={styles.searc}
                  value={phoneNo}
                  onChange={this.onchangePhoneno}
                  id="phoneNo"
                />

                <label htmlFor="contactName">Contact Name</label>
                <input
                  className={styles.s}
                  placeholder="Enter the name of contact you want to save"
                  value={contactname}
                  onChange={this.onchangeContactname}
                  id="contactName"
                />
                <button className={styles["search-utton"]} type="submit">
                  Add
                </button>
              </form>
            </div>
          )}
          {!(userDetails.contacts.length === 0) && (
            <>
              <div className={styles.chatsHeading}>
                <h1>Chats</h1>
                <button type="button" onClick={this.ToggleAddContactsView}>
                  <AiOutlinePlusCircle />
                </button>
              </div>
              <div className={styles["search-container"]}>
                <input type="search" className={styles.search} />
                <button type="button" className={styles["search-button"]}>
                  <BsSearch className="icon" size="40" />
                </button>
              </div>
              <div className={styles["user-contacts"]}>
                {userDetails.contacts.map((contact) => (
                  <div
                    onClick={() => this.displayChatView(contact.name)}
                    key={contact.phoneNo}
                    className={styles["contact-item"]}
                  >
                    <p className={styles["contact-logo"]}>{contact.name[0]}</p>
                    <p>{contact.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className={styles["messages-container"]}>
          {!showMessagesView && (
            <h1>
              Ichat get started .select a chat to see the messages here and get
              started
            </h1>
          )}
          {showMessagesView && MessagesList.length === 0 && (
            <div className={styles["messages-container2"]}>
              <h1>
                Your chat history is empty start messaging to see the messages
                here
              </h1>

              <div className={styles["msg-input-container"]}>
                <input
                  className={styles["message-input"]}
                  value={messageInput}
                  placeholder="Type Message"
                  onChange={this.updateMsgValue}
                  onKeyUp={(event) =>
                    this.postMsg(event, activeContactDetails.phoneNo)
                  }
                  id="MessageInput"
                />
                <button
                  className="emoji-icon"
                  type="button"
                  onClick={this.toggleEmojiPicker}
                >
                  <BsEmojiSmile />
                </button>
              </div>
            </div>
          )}
          {showMessagesView && !(MessagesList.length === 0) && (
            <div className={styles.Allmessages}>
              <div className={styles.messages}>
                {MessagesList.map((messageDetails) => {
                  return <Message messageDetails={messageDetails} />;
                })}
              </div>
              <div className={styles["msg-input-container"]}>
                <input
                  className={styles["message-input"]}
                  value={messageInput}
                  placeholder="Type Message"
                  onChange={this.updateMsgValue}
                  onKeyUp={(event) =>
                    this.postMsg(event, activeContactDetails.phoneNo)
                  }
                  id="MessageInput"
                />

                <button
                  className="emoji-icon"
                  type="button"
                  onClick={this.toggleEmojiPicker}
                >
                  <BsEmojiSmile />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  renderFailureView = () => {
    return <h1>Oops something went wrong</h1>;
  };

  render() {
    return (
      <div>
        {this.LoadHomePage()}
        {/* <h1>sd</h1> */}
      </div>
    );
  }
}
export default Home;
