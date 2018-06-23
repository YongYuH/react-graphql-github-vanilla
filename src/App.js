import React, { Component } from 'react';
import axios from 'axios';
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

const ADD_STAR = `
  mutation ($repositoryId: ID!) {
    addStar(input: { starrableId:$repositoryId }) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

const REMOVE_STAR = `
  mutation ($repositoryId: ID!) {
    removeStar(input: { starrableId:$repositoryId }) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

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
        id
        name
        url
        viewerHasStarred
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

const starMutationToRepository = (repositoryId, mutationType) => {
  let query = '';
  if (mutationType === 'ADD_STAR') {
    query = ADD_STAR;
  } else {
    query = REMOVE_STAR;
  }

  return axiosGitHubGraphQL.post('', {
    query,
    variables: { repositoryId },
  });
};

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

const resolveStarMutation = (mutationResult, mutationType) => prevState => {
  let mutationTypeKey = '';
  const { data } = mutationResult.data;
  if (mutationType === 'ADD_STAR') {
    mutationTypeKey = 'addStar';
  } else {
    mutationTypeKey = 'removeStar';
  }
  const { viewerHasStarred } = data[mutationTypeKey].starrable;

  return {
    ...prevState,
    organization: {
      ...prevState.organization,
      repository: {
        ...prevState.organization.repository,
        viewerHasStarred,
      },
    },
  };
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
          ...data.organization.repository.issues,
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

  onStarRepository = (repositoryId, viewerHasStarred) => {
    let mutationType = '';
    if (!viewerHasStarred) {
      mutationType = 'ADD_STAR';
    } else {
      mutationType = 'REMOVE_STAR';
    }
    starMutationToRepository(repositoryId, mutationType).then(mutationResult =>
      this.setState(resolveStarMutation(mutationResult, mutationType)),
    );
  };

  onSubmit = event => {
    this.onFetchFromGitHub(this.state.path);
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
              onFetchMoreIssues={this.onFetchMoreIssues}
              onStarRepository={this.onStarRepository}
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
  onStarRepository,
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
        onStarRepository={onStarRepository}
        repository={organization.repository}
      />
    </div>
  );
};

const Repository = ({
  onFetchMoreIssues,
  onStarRepository,
  repository,
}) => (
  <div>
    <p>
      <strong>In Repository</strong>
      <a href={repository.url}>
        {repository.name}
      </a>
    </p>

    <button
      onClick={() => onStarRepository(repository.id, repository.viewerHasStarred)}
      type="button"
    >
      {
        repository.viewerHasStarred ? 'Unstar' : 'Star'
      }
    </button>

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
