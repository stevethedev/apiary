use std::collections::HashMap;
use std::sync::{Mutex, MutexGuard};

use tokio::task::AbortHandle;

/// Registry of in-flight requests keyed by the frontend-generated request
/// ID, so a `cancel_request` command can abort the matching tokio task.
#[derive(Default)]
pub struct CancellationRegistry {
    handles: Mutex<HashMap<String, AbortHandle>>,
}

impl CancellationRegistry {
    /// Recovers from a poisoned mutex instead of panicking — same
    /// rationale as `DbState::connection`: one panicking request shouldn't
    /// permanently break cancellation for every request after it.
    fn handles(&self) -> MutexGuard<'_, HashMap<String, AbortHandle>> {
        self.handles.lock().unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    pub fn register(&self, request_id: String, handle: AbortHandle) {
        self.handles().insert(request_id, handle);
    }

    pub fn unregister(&self, request_id: &str) {
        self.handles().remove(request_id);
    }

    pub fn cancel(&self, request_id: &str) -> bool {
        match self.handles().remove(request_id) {
            Some(handle) => {
                handle.abort();
                true
            }
            None => false,
        }
    }
}
