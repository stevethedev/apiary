use std::time::Duration;

use reqwest::redirect::Policy;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
const MAX_REDIRECTS: usize = 10;

/// Builds the shared reqwest client: TLS verification stays on (no silent
/// cert bypass), redirects are followed up to a sane limit, and responses
/// are transparently decompressed.
///
/// # Panics
///
/// Panics if the TLS backend fails to initialize — this only happens if
/// the platform's root certificate store is unreadable, which would make
/// the app unusable regardless, so failing fast at startup is intentional.
#[must_use]
pub fn build_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(REQUEST_TIMEOUT)
        .redirect(Policy::limited(MAX_REDIRECTS))
        .gzip(true)
        .brotli(true)
        .deflate(true)
        .build()
        .expect("failed to build reqwest client")
}
