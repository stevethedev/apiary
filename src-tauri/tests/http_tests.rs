use apiary_lib::commands::http::execute_request;
use apiary_lib::http::cancellation::CancellationRegistry;
use apiary_lib::models::request::{AuthPayload, HttpRequestPayload};
use wiremock::matchers::{header, method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

fn client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .unwrap()
}

fn payload(method: &str, url: String) -> HttpRequestPayload {
    HttpRequestPayload {
        method: method.to_string(),
        url,
        headers: vec![],
        body: None,
        auth: AuthPayload::None,
    }
}

#[tokio::test]
async fn sends_a_get_request_and_parses_the_response() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/users"))
        .respond_with(ResponseTemplate::new(200).set_body_string("[]"))
        .mount(&server)
        .await;

    let result = execute_request(
        &client(),
        &CancellationRegistry::default(),
        "req-1".to_string(),
        payload("GET", format!("{}/users", server.uri())),
    )
    .await
    .expect("request should succeed");

    assert_eq!(result.status_code, 200);
    assert_eq!(result.body, "[]");
    assert_eq!(result.body_size_bytes, 2);
}

#[tokio::test]
async fn sends_custom_headers_and_a_json_body() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/items"))
        .and(header("x-custom", "hello"))
        .respond_with(ResponseTemplate::new(201))
        .mount(&server)
        .await;

    let mut req = payload("POST", format!("{}/items", server.uri()));
    req.headers = vec![("x-custom".to_string(), "hello".to_string())];
    req.body = Some(r#"{"name":"widget"}"#.to_string());

    let result = execute_request(
        &client(),
        &CancellationRegistry::default(),
        "req-2".to_string(),
        req,
    )
    .await
    .expect("request should succeed");

    assert_eq!(result.status_code, 201);
}

#[tokio::test]
async fn applies_bearer_auth_as_an_authorization_header() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/me"))
        .and(header("authorization", "Bearer secret-token"))
        .respond_with(ResponseTemplate::new(200))
        .mount(&server)
        .await;

    let mut req = payload("GET", format!("{}/me", server.uri()));
    req.auth = AuthPayload::Bearer {
        token: "secret-token".to_string(),
    };

    let result = execute_request(
        &client(),
        &CancellationRegistry::default(),
        "req-3".to_string(),
        req,
    )
    .await
    .expect("request should succeed");

    assert_eq!(result.status_code, 200);
}

#[tokio::test]
async fn applies_api_key_auth_as_a_query_param() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/data"))
        .and(query_param("api_key", "abc123"))
        .respond_with(ResponseTemplate::new(200))
        .mount(&server)
        .await;

    let mut req = payload("GET", format!("{}/data", server.uri()));
    req.auth = AuthPayload::ApiKey {
        key: "api_key".to_string(),
        value: "abc123".to_string(),
        placement: "query".to_string(),
    };

    let result = execute_request(
        &client(),
        &CancellationRegistry::default(),
        "req-4".to_string(),
        req,
    )
    .await
    .expect("request should succeed");

    assert_eq!(result.status_code, 200);
}

#[tokio::test]
async fn follows_redirects() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/old"))
        .respond_with(
            ResponseTemplate::new(302).insert_header("Location", format!("{}/new", server.uri())),
        )
        .mount(&server)
        .await;
    Mock::given(method("GET"))
        .and(path("/new"))
        .respond_with(ResponseTemplate::new(200).set_body_string("landed"))
        .mount(&server)
        .await;

    let result = execute_request(
        &client(),
        &CancellationRegistry::default(),
        "req-5".to_string(),
        payload("GET", format!("{}/old", server.uri())),
    )
    .await
    .expect("request should succeed");

    assert_eq!(result.status_code, 200);
    assert_eq!(result.body, "landed");
}

#[tokio::test]
async fn reports_a_timeout_as_a_typed_error() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/slow"))
        .respond_with(ResponseTemplate::new(200).set_delay(std::time::Duration::from_secs(2)))
        .mount(&server)
        .await;

    let fast_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_millis(100))
        .build()
        .unwrap();

    let result = execute_request(
        &fast_client,
        &CancellationRegistry::default(),
        "req-6".to_string(),
        payload("GET", format!("{}/slow", server.uri())),
    )
    .await;

    match result {
        Err(apiary_lib::http::error::HttpError::Timeout { .. }) => {}
        other => panic!("expected a Timeout error, got {other:?}"),
    }
}

#[tokio::test]
async fn rejects_an_invalid_url_before_sending() {
    let result = execute_request(
        &client(),
        &CancellationRegistry::default(),
        "req-7".to_string(),
        payload("GET", "not-a-url".to_string()),
    )
    .await;

    match result {
        Err(apiary_lib::http::error::HttpError::InvalidUrl { .. }) => {}
        other => panic!("expected an InvalidUrl error, got {other:?}"),
    }
}

#[tokio::test]
async fn cancelling_an_in_flight_request_reports_cancelled() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/forever"))
        .respond_with(ResponseTemplate::new(200).set_delay(std::time::Duration::from_secs(5)))
        .mount(&server)
        .await;

    let registry = CancellationRegistry::default();
    let request_id = "req-8".to_string();
    let http_client = client();

    let send_future = execute_request(
        &http_client,
        &registry,
        request_id.clone(),
        payload("GET", format!("{}/forever", server.uri())),
    );

    tokio::pin!(send_future);

    // Give the task a moment to register itself, then cancel it.
    tokio::select! {
        () = tokio::time::sleep(std::time::Duration::from_millis(50)) => {
            let was_cancelled = registry.cancel(&request_id);
            assert!(was_cancelled, "expected an in-flight request to be registered");
        }
        _ = &mut send_future => panic!("request should not have completed yet"),
    }

    match send_future.await {
        Err(apiary_lib::http::error::HttpError::Cancelled { .. }) => {}
        other => panic!("expected a Cancelled error, got {other:?}"),
    }
}
