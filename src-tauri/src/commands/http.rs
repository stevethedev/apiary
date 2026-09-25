use std::time::Instant;

use reqwest::{Method, Url};
use tauri::State;

use crate::http::auth::{apply_header_auth, apply_query_auth};
use crate::http::cancellation::CancellationRegistry;
use crate::http::error::{classify_reqwest_error, HttpError};
use crate::http::HttpState;
use crate::models::request::{HttpRequestPayload, HttpResponseResult};

/// The actual request-execution logic, independent of Tauri's `State`
/// wrapper so it can be unit-tested with a plain `reqwest::Client` and
/// registry against a local mock server.
///
/// # Errors
///
/// Returns [`HttpError`] if the URL or method is invalid, the request
/// fails to send (network/DNS/TLS/timeout), the response body can't be
/// read, or the request is cancelled.
pub async fn execute_request(
    client: &reqwest::Client,
    cancellations: &CancellationRegistry,
    request_id: String,
    payload: HttpRequestPayload,
) -> Result<HttpResponseResult, HttpError> {
    let mut url = Url::parse(&payload.url).map_err(|e| HttpError::InvalidUrl {
        message: e.to_string(),
    })?;
    apply_query_auth(&mut url, &payload.auth);

    let method = Method::from_bytes(payload.method.as_bytes()).map_err(|_| HttpError::InvalidUrl {
        message: format!("Unsupported HTTP method: {}", payload.method),
    })?;

    let mut builder = client.request(method, url);
    for (key, value) in &payload.headers {
        builder = builder.header(key, value);
    }
    builder = apply_header_auth(builder, &payload.auth);
    if let Some(body) = payload.body.clone() {
        builder = builder.body(body);
    }

    let started = Instant::now();
    let task = tokio::spawn(async move { builder.send().await });
    cancellations.register(request_id.clone(), task.abort_handle());

    let join_result = task.await;
    cancellations.unregister(&request_id);

    let response = match join_result {
        Ok(send_result) => send_result.map_err(|e| classify_reqwest_error(&e))?,
        Err(join_err) if join_err.is_cancelled() => {
            return Err(HttpError::Cancelled {
                message: "Request was cancelled.".to_string(),
            })
        }
        Err(join_err) => {
            return Err(HttpError::Network {
                message: join_err.to_string(),
            })
        }
    };

    let status = response.status();
    let headers: Vec<(String, String)> = response
        .headers()
        .iter()
        .map(|(name, value)| {
            (
                name.to_string(),
                value.to_str().unwrap_or_default().to_string(),
            )
        })
        .collect();

    let bytes = response.bytes().await.map_err(|e| classify_reqwest_error(&e))?;
    let body = String::from_utf8_lossy(&bytes).into_owned();

    Ok(HttpResponseResult {
        status_code: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        headers,
        body_size_bytes: bytes.len(),
        body,
        duration_ms: u64::try_from(started.elapsed().as_millis()).unwrap_or(u64::MAX),
    })
}

/// # Errors
///
/// Returns [`HttpError`] if the request fails to resolve, connect, or
/// complete — see [`execute_request`].
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub async fn send_request(
    state: State<'_, HttpState>,
    request_id: String,
    payload: HttpRequestPayload,
) -> Result<HttpResponseResult, HttpError> {
    execute_request(&state.client, &state.cancellations, request_id, payload).await
}

/// # Errors
///
/// Never actually fails — an unknown `request_id` is simply a no-op — but
/// returns `Result` to match Tauri's command-error-channel convention.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri's IPC layer always hands commands owned values.
pub fn cancel_request(state: State<'_, HttpState>, request_id: String) -> Result<(), HttpError> {
    state.cancellations.cancel(&request_id);
    Ok(())
}
