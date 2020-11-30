import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import NotFound from './components/NotFound/NotFound';
import { ProvideAuth } from './hooks/use-auth';
import Navbar from './components/Navbar/Navbar';
import { Container } from '@material-ui/core';
import Signup from './components/Signup';

function App() {
  return (<ProvideAuth>
    <Container>
      <Router>
        <Navbar />
        <Switch>
          <Route path="/" exact={true}>
            <Home />
          </Route>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    </Container>
  </ProvideAuth>);
}

export default App;
