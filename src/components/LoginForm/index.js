import styles from "./index.module.css";
import { Component } from "react";
import Cookies from "js-cookie";
import { Redirect } from "react-router-dom";
class LoginForm extends Component {
  state = {
    phoneNo: "",
    errorMsg: "",
    isOTPGenerated: false,
    isOTPVerified: false,
    showSubmitError: false,
    otp: null,
  };

  onSubmitSuccess = (iChatJwtToken) => {
    const { history } = this.props;

    Cookies.set("ichat_jwt_token", iChatJwtToken, {
      expires: 30,
    });
    history.replace("/");
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
    const { phoneNo } = this.state;
    const userDetails = { phoneNo };
    console.log(userDetails);
    const url = "https://apis-ichat.onrender.com/loginOtp";
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
    const url = "https://apis-ichat.onrender.com/loginVerifyOtp"; // Replace with your server-side API endpoint for verifying OTP
    console.log(JSON.stringify(userDetails));
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Set the Content-Type header
      },
      body: JSON.stringify(userDetails),
    };

    try {
      const response = await fetch(url, options);
      //   console.log(response)
      if (response.ok) {
        const data = await response.json();
        // console.log(data)
        this.setState({
          isOTPVerified: true,
        });
        this.onSubmitSuccess(data.iChatJwtToken);
      } else {
        const data = await response.json();
        throw new Error(data.error_msg);
      }
    } catch (error) {
      this.onSubmitFailure(error.message);
      console.log(error.message);
    }
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
    const { phoneNo, otp, isOTPGenerated } = this.state;
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
          <form onSubmit={this.handleSubmit}>
            {!isOTPGenerated && (
              <>
                <label htmlFor="PhoneNo">PHONE NUMBER</label>
                <input
                  id="PhoneNo"
                  type="text"
                  value={phoneNo}
                  onChange={this.onChangePhoneNo}
                />
                <button type="submit">Get Otp</button>
                <p>
                  Not Registered yet?Click <a href="/register">here</a> to
                  register
                </p>
              </>
            )}
            {isOTPGenerated && (
              <>
                <label htmlFor="otp">OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={this.onChangeotp}
                />
                <button type="submit">Login</button>
                <p>
                  is otp has been sent to your number enter the otp to continue
                </p>
              </>
            )}
          </form>
          </div>
        </div>
      </div>
    );
  }
}
export default LoginForm;
