import { getSdk } from './schema.auto';
import { GraphQLClient } from 'graphql-request';
// import { encode, decode,  } from '@msgpack/msgpack';

const client = new GraphQLClient('/api', {
   cache: 'no-cache',
   // headers: {
   // 	'content-type': 'application/msgpack'
   // },
   // jsonSerializer: { parse: decode, stringify: encode }
});
export const gqlClient = Object.assign(getSdk(client), client);
