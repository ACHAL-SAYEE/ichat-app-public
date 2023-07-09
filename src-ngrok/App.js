import LoginForm from "./components/LoginForm";
import Register from "./components/Register";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import { Route, Switch } from "react-router-dom";

function App() {
  return (
    <Switch>
      <Route exact path="/login" component={LoginForm} />
      <Route exact path="/register" component={Register} />
      <ProtectedRoute exact path="/" component={Home} />
    </Switch>
  );
}

export default App;
