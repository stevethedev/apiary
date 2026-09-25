pub mod auth;
pub mod cancellation;
pub mod client;
pub mod error;

use cancellation::CancellationRegistry;

/// Tauri-managed state: one shared reqwest client plus the in-flight
/// request registry, so cancellation and connection pooling both work
/// across command invocations.
pub struct HttpState {
    pub client: reqwest::Client,
    pub cancellations: CancellationRegistry,
}

impl Default for HttpState {
    fn default() -> Self {
        Self {
            client: client::build_client(),
            cancellations: CancellationRegistry::default(),
        }
    }
}
