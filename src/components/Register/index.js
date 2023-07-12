import styles from "./index.module.css";
import Cookies from "js-cookie";
import { Redirect } from "react-router-dom";
import { Component } from "react";
import socketIOClient from "socket.io-client";
const socket = socketIOClient("https://apis-ichat.onrender.com");

class Register extends Component {
  state = {
    name: "",
    phoneNo: "",
    errorMsg: "",
    isOTPGenerated: false,
    isOTPVerified: false,
    showSubmitError: false,
    otp: null,
  };

  onSubmitFailure = (errorMsg) => {
    this.setState({ showSubmitError: true, errorMsg });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { isOTPGenerated, isOTPVerified } = this.state;

    if (!isOTPGenerated) {
      this.generateOTP();
    } else if (!isOTPVerified) {
      this.verifyOTP();
    }
  };

  generateOTP = async () => {
    const { phoneNo, name } = this.state;
    const userDetails = { phoneNo, name };
    console.log(userDetails);
    const url = "https://apis-ichat.onrender.com/registerOtp";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userDetails),
    };
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const data = await response.json();

        console.log(data);
        this.setState({
          isOTPGenerated: true,
          showSubmitError: false,
        });

       
          socket.emit("storeregistrantsocketid", phoneNo);
      } else {
        const data = await response.json();
        console.log(data);
        this.onSubmitFailure(data.error_msg);
        // throw new Error(data.error_msg);
      }
    } catch (error) {
      this.onSubmitFailure(error.message);
    }
  };

  verifyOTP = async () => {
    const { phoneNo, otp, name } = this.state;
    const userDetails = { phoneNo, otp, name };
    const url = "https://apis-ichat.onrender.com/registerVerifyOtp"; // Replace with your server-side API endpoint for verifying OTP
    console.log(JSON.stringify(userDetails));
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Set the Content-Type header
      },
      body: JSON.stringify(userDetails),
      //   body: userDetails,
    };

    try {
      const response = await fetch(url, options);
      console.log(response);
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        this.setState({
          isOTPVerified: true,
        });
        const { history } = this.props;
        history.push("/login");
      } else {
        const data = await response.json();
        throw new Error(data.error_msg);
      }
    } catch (error) {
      this.onSubmitFailure(error.message);
      console.log(error.message);
    }
  };

  onChangeName = (e) => {
    this.setState({ name: e.target.value });
  };

  onChangePhoneNo = (e) => {
    this.setState({ phoneNo: e.target.value });
  };

  onChangeotp = (e) => {
    this.setState({ otp: e.target.value });
  };

  render() {
    const iChatJwtToken = Cookies.get("ichat_jwt_token");
    if (iChatJwtToken !== undefined) {
      return <Redirect to="/" />;
    }
    const { isOTPGenerated, isOTPVerified, showSubmitError, errorMsg } =
      this.state;
    return (
      <div className={styles.bg}>
        <h1 className={styles.heading}>Welcome To iChat App</h1>
        <div className={styles.x}>
          <div className={styles["login-register-container"]}>
            <div className={styles["logo-container"]}>
              <img
                src="/images/iChatLogo.png"
                alt="logo"
                className={styles.logo}
              />
              <h1>iChat</h1>
            </div>
            {!isOTPGenerated && (
              <form onSubmit={this.handleSubmit}>
                <div className={styles.InputField}>
                  <label htmlFor="name">NAME</label>
                  <input id="name" type="text" onChange={this.onChangeName} />
                </div>
                <div className={styles.InputField}>
                  <label htmlFor="PhoneNo">PHONE NUMBER</label>
                  <input
                    id="PhoneNo"
                    type="text"
                    onChange={this.onChangePhoneNo}
                  />
                </div>
                <button className={styles["register-button"]} type="submit">
                  Register
                </button>
                <p className={styles.error_para}>{errorMsg}</p>
                <p>
                  Already Registered?Click <a href="/login">here</a> to login
                </p>
              </form>
            )}
            {isOTPGenerated && (
              <form onSubmit={this.handleSubmit}>
                <div className={styles.InputField}>
                  <label htmlFor="otp">OTP</label>
                  <input id="otp" type="text" onChange={this.onChangeotp} />
                </div>
                <button className={styles["register-button"]} type="submit">
                  Verify Otp
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }
}
export default Register;
