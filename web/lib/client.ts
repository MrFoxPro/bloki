import { getSdk } from './schema.auto'
import { createGraphQLClient } from '@solid-primitives/graphql'

const client = createGraphQLClient('/api', {
   cache: 'no-cache',
})
export const gqlClient = Object.assign(getSdk(client), client)


