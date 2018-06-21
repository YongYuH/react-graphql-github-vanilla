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

const GET_ISSUES_OF_REPOSITORY  = `
  {
    organization(login: "the-road-to-learn-react") {
      name
      url
      repository(name: "the-road-to-learn-react") {
        name
        url
        issues(last: 5) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
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
      .post('', { query: GET_ISSUES_OF_REPOSITORY  })
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
      repository,
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
      <Repository repository={organization.repository} />
    </div>
  );
};

const Repository = ({ repository }) => (
  <div>
    <p>
      <strong>In Repository</strong>
      <a href={repository.url}>
        {repository.name}
      </a>
    </p>

    <ul>
      {
        repository.issues.edges.map(issue => (
          <li key={issue.node.id}>
            <a href={issue.node.url}>
              {issue.node.title}
            </a>
          </li>
        ))
      }
    </ul>
  </div>
);

export default App;
