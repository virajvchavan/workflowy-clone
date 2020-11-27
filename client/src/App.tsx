import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import './App.css';

function Home() {
  return <div>home</div>;
}

function NotFound() {
  return <div>not found</div>;
}

function App() {
  useEffect(() => {
    window.fetch('/api/notes')
      .then(response => response.json())
      .then(json => console.log(json))
      .catch(error => console.log(error));
  }, []);

  return <Router>
      <Switch>
        <Route path='/' exact component={Home} />
        <Route component={NotFound} />
      </Switch>
    </Router>
}

export default App;
