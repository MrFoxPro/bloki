import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown; }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
};

export type Block = {
    __typename?: 'Block';
    documentId: Scalars['Int'];
    height: Scalars['Int'];
    id: Scalars['Int'];
    width: Scalars['Int'];
    x: Scalars['Int'];
    y: Scalars['Int'];
};

export type BlokiDocument = {
    __typename?: 'BlokiDocument';
    id: Scalars['Int'];
    layout: Array<Block>;
    layoutOptions: LayoutOptions;
    shared: Scalars['Boolean'];
    title: Scalars['String'];
    workspaceId: Scalars['Int'];
};

export type BlokiWorkspace = {
    __typename?: 'BlokiWorkspace';
    documents: Array<BlokiDocument>;
    id: Scalars['Int'];
    title: Scalars['String'];
    users: Array<User>;
};

export enum GridRenderMethod {
    Canvas = 'CANVAS',
    Dom = 'DOM'
}

export type LayoutOptions = {
    __typename?: 'LayoutOptions';
    fGridHeight: Scalars['Int'];
    fGridWidth: Scalars['Int'];
    gap: Scalars['Int'];
    mGridHeight: Scalars['Int'];
    mGridWidth: Scalars['Int'];
    showGridGradient: Scalars['Boolean'];
    showResizeAreas: Scalars['Boolean'];
    size: Scalars['Int'];
};

export enum Locale {
    Detusch = 'DETUSCH',
    English = 'ENGLISH',
    Russian = 'RUSSIAN'
}

export type RootQuery = {
    __typename?: 'RootQuery';
    me?: Maybe<User>;
};

export type User = {
    __typename?: 'User';
    gridRenderMethod: GridRenderMethod;
    id: Scalars['Int'];
    locale: Locale;
    name: Scalars['String'];
    selectedDocumentId: Scalars['Int'];
    selectedWorkspaceId: Scalars['Int'];
    workspaces: Array<BlokiWorkspace>;
};

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'RootQuery', me?: { __typename?: 'User', id: number, name: string, workspaces: Array<{ __typename?: 'BlokiWorkspace', id: number, title: string, documents: Array<{ __typename?: 'BlokiDocument', id: number, workspaceId: number, title: string, shared: boolean; }>; }>; } | null; };


export const MeDocument = gql/* GraphQL */`
    query me {
  me {
    id
    name
    workspaces {
      id
      title
      documents {
        id
        workspaceId
        title
        shared
      }
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?: Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
    return {
        me(variables?: MeQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<MeQuery> {
            return withWrapper((wrappedRequestHeaders) => client.request<MeQuery>(MeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'me', 'query');
        }
    };
}
export type Sdk = ReturnType<typeof getSdk>;
