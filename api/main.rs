use std::net::SocketAddr;

use axum::{
   extract::{
      ws::{Message, WebSocket},
      State, TypedHeader, WebSocketUpgrade,
   },
   headers,
   http::StatusCode,
   response::IntoResponse,
   routing::{get, put},
   Json, Router,
};
use serde::{Deserialize, Serialize};

#[tokio::main]
async fn main() {
   // tracing_subscriber::fmt::init();
   let edb = edgedb_tokio::create_client().await.unwrap();
   println!("Bloki api is starting...");

   axum::Server::bind(&SocketAddr::from(([127, 0, 0, 1], 3001)))
      .serve(
         Router::with_state(edb)
            .route("/", get(root))
            .route("/ws", get(ws_handler))
            .route("/users", put(create_user))
            .into_make_service(),
      )
      .await
      .unwrap();
}

async fn root(State(edb): State<edgedb_tokio::Client>) -> &'static str {
   let result: String = edb
      .query_required_single(r#"select "Hello world!""#, &())
      .await
      .unwrap();
   println!("{result}");
   return r#"Hello, World!"#;
}

async fn create_user(Json(payload): Json<CreateUser>) -> impl IntoResponse {
   let user = User {
      id: 1337,
      username: payload.username,
   };
   (StatusCode::CREATED, Json(user))
}

#[derive(Deserialize)]
struct CreateUser {
   username: String,
}

#[derive(Serialize)]
struct User {
   id: u64,
   username: String,
}

async fn ws_handler(
   ws: WebSocketUpgrade,
   user_agent: Option<TypedHeader<headers::UserAgent>>,
) -> impl IntoResponse {
   if let Some(TypedHeader(user_agent)) = user_agent {
      println!("`{}` connected", user_agent.as_str());
   }
   ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
   if let Some(msg) = socket.recv().await {
      if let Ok(msg) = msg {
         match msg {
            Message::Text(t) => {
               println!("client sent str: {:?}", t);
            }
            Message::Binary(_) => {
               println!("client sent binary data");
            }
            Message::Ping(_) => {
               println!("socket ping");
            }
            Message::Pong(_) => {
               println!("socket pong");
            }
            Message::Close(reason) => {
               let r = reason.unwrap();
               println!("client disconnected. reason: {} code: {}", r.reason, r.code);
               return;
            }
         }
      } else {
         println!("client disconnected");
         return;
      }
   }
   // tokio::spawn(async move {
   //    loop {
   //       if socket.send(Message::Text(String::from("Hi!"))).await.is_err() {
   //          println!("client disconnected");
   //          return;
   //       }
   //       tokio::time::sleep(std::time::Duration::from_secs(1)).await;
   //    }
   // });
}
