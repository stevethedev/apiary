use std::error::Error as _;

use serde::Serialize;

/// A typed, developer-friendly error the frontend can pattern-match on to
/// show a clear message — never a raw stack trace as the primary UI.
#[derive(Debug, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum HttpError {
    Network { message: String },
    Dns { message: String },
    Timeout { message: String },
    InvalidUrl { message: String },
    Tls { message: String },
    Cancelled { message: String },
    InvalidResponse { message: String },
}

/// Classifies a reqwest error into one of our developer-facing categories.
/// reqwest doesn't expose a distinct DNS-failure predicate, so a connect
/// error whose source chain mentions DNS resolution is reported as `Dns`;
/// everything else stays `Network`.
pub fn classify_reqwest_error(err: reqwest::Error) -> HttpError {
    if err.is_timeout() {
        return HttpError::Timeout {
            message: "The request timed out.".to_string(),
        };
    }
    if err.is_builder() {
        return HttpError::InvalidUrl {
            message: err.to_string(),
        };
    }
    if err.is_connect() {
        let looks_like_dns = format!("{err:#}").to_lowercase().contains("dns");
        if looks_like_dns {
            return HttpError::Dns {
                message: format!("Could not resolve host: {err}"),
            };
        }
        return HttpError::Network {
            message: format!("Could not connect: {err}"),
        };
    }
    if let Some(source) = err.source() {
        if format!("{source}").to_lowercase().contains("tls")
            || format!("{source}").to_lowercase().contains("certificate")
        {
            return HttpError::Tls {
                message: err.to_string(),
            };
        }
    }
    HttpError::Network {
        message: err.to_string(),
    }
}
