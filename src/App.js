import React, { Component } from 'react';
import axios from 'axios';
import logo from './logo.svg';
import './App.css';

const TITLE = 'React GraphQL GitHub Client';

const axiosGitHubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${
      process.env.REACT_APP_GITHUB_PERSONAL_ACCESS_TOKEN
    }`,
  },
});

const GET_ORGANIZATION = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
    }
  }
`;

class App extends Component {
  state = {
    errors: null,
    organization: null,
    path: 'the-road-to-learn-react/the-road-to-learn-react',
  };

  componentDidMount() {
    this.onFetchFromGitHub();
  }

  onChange = event => {
    this.setState({ path: event.target.value });
  };

  onFetchFromGitHub = () => {
    axiosGitHubGraphQL
      .post('', { query: GET_ORGANIZATION })
      .then(result =>
        this.setState(() => ({
          errors: result.data.errors,
          organization: result.data.data.organization,
        })),
      );
  };

  onSubmit = event => {
    // fetch data

    event.preventDefault();
  };

  render() {
    const {
      errors,
      organization,
      path,
    } = this.state;
    return (
      <div>
        <h1>{TITLE}</h1>
        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">
            Show open issues for https://github.com/
          </label>
          <input
            id="url"
            onChange={this.onChange}
            style={{ width: '300px' }}
            type="text"
            value={path}
          />
          <button type="submit">Search</button>
        </form>
        <hr />
        {
          organization ? (
            <Organization
              errors={errors}
              organization={organization}
            />
          ) : (
            <p>No information yet ...</p>
          )
        }
      </div>
    );
  }
}

const Organization = ({
  errors,
  organization,
}) => {
  if (errors) {
    return (
      <p>
        <strong>Something went wrong:</strong>
        {errors.map(error => error.message).join(' ')}
      </p>
    );
  }

  return (
    <div>
      <p>
        <strong>issues from Organization: </strong>
        <a href={organization.url}>
          {organization.name}
        </a>
      </p>
    </div>
  );
};

export default App;
