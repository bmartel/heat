import 'reflect-metadata';
import { createConnection } from 'typeorm';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import typeDefs from './schema';
import resolvers from './resolvers';
import { PORT, TypeORM } from './config';

const server = new ApolloServer({ typeDefs, resolvers });

createConnection(TypeORM)
  .then(async () => {
    // create express app
    const app = express();

    server.applyMiddleware({ app });

    // start express server
    app.listen({ port: PORT }, () =>
      console.log(
        `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`,
      ),
    );

    // insert new users for test
    //await connection.manager.save(connection.manager.create(User, {
    //    firstName: "Timber",
    //    lastName: "Saw",
    //    age: 27
    //}));
    //await connection.manager.save(connection.manager.create(User, {
    //    firstName: "Phantom",
    //    lastName: "Assassin",
    //    age: 24
    //}));
  })
  .catch((error) => console.log(error));
