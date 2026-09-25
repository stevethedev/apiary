use reqwest::{RequestBuilder, Url};

use crate::models::request::AuthPayload;

/// Applies an API-key auth config to the URL's query string, if that's
/// where it's placed. Must run before the request builder is created from
/// the URL, since a `RequestBuilder` is already bound to its URL.
pub fn apply_query_auth(url: &mut Url, auth: &AuthPayload) {
    if let AuthPayload::ApiKey {
        key,
        value,
        placement,
    } = auth
    {
        if placement == "query" {
            url.query_pairs_mut().append_pair(key, value);
        }
    }
}

/// Applies header-based auth (Bearer, Basic, or a header-placed API key) to
/// the request builder.
pub fn apply_header_auth(builder: RequestBuilder, auth: &AuthPayload) -> RequestBuilder {
    match auth {
        AuthPayload::None => builder,
        AuthPayload::Bearer { token } => builder.bearer_auth(token),
        AuthPayload::Basic { username, password } => {
            builder.basic_auth(username, Some(password))
        }
        AuthPayload::ApiKey {
            key,
            value,
            placement,
        } => {
            if placement == "header" {
                builder.header(key, value)
            } else {
                builder
            }
        }
    }
}
