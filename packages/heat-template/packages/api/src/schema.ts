import { gql } from 'apollo-server-express';

const Schema = gql`
  type Query {
    hello: String
  }
`;

export default Schema;
