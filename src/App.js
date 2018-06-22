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

const GET_ISSUES_OF_REPOSITORY = `
  query (
    $cursor: String,
    $organization: String!,
    $repository: String!,
  ) {
    organization(login: $organization) {
      name
      url
      repository(name: $repository) {
        name
        url
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const getIssuesOfRepository = (path, cursor) => {
  const [organization, repository] = path.split('/');
  return axiosGitHubGraphQL.post('', {
    query: GET_ISSUES_OF_REPOSITORY,
    variables: {
      cursor,
      organization,
      repository,
    },
  });
};

const resolveIssuesQuery = (queryResult, cursor) => prevState => {
  const {
    data,
    errors,
  } = queryResult.data;

  if (!cursor) {
    return {
      errors,
      organization: data.organization,
    };
  }

  const { edges: oldIssues } = prevState.organization.repository.issues;
  const { edges: newIssues } = data.organization.repository.issues;

  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    errors,
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization  .repository.issues,
          edges: updatedIssues,
        }
      }
    }
  };
};

class App extends Component {
  state = {
    errors: null,
    organization: null,
    path: 'the-road-to-learn-react/the-road-to-learn-react',
  };

  componentDidMount() {
    this.onFetchFromGitHub(this.state.path);
  }

  onChange = event => {
    this.setState({ path: event.target.value });
  };

  onFetchFromGitHub = (path, cursor) => {
    getIssuesOfRepository(path, cursor).then(queryResult =>
      this.setState(resolveIssuesQuery(queryResult, cursor)),
    );
  };

  onFetchMoreIssues = () => {
    const {
      endCursor,
    } = this.state.organization.repository.issues.pageInfo;

    this.onFetchFromGitHub(this.state.path, endCursor);
  };

  onSubmit = event => {
    this.onFetchFromGitHub(this.state.path);
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
              onFetchMoreIssues={this.onFetchMoreIssues}
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
  onFetchMoreIssues,
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
      <Repository
        onFetchMoreIssues={onFetchMoreIssues}
        repository={organization.repository}
      />
    </div>
  );
};

const Repository = ({
  onFetchMoreIssues,
  repository,
}) => (
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

            <ul>
              {
                issue.node.reactions.edges.map(reaction => (
                  <li key={reaction.node.id}>
                    {reaction.node.content}
                  </li>
                ))
              }
            </ul>
          </li>
        ))
      }
    </ul>

    <hr />
    {
      repository.issues.pageInfo.hasNextPage && (
        <button onClick={onFetchMoreIssues}>More</button>
      )
    }
  </div>
);

export default App;
