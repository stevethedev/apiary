use std::collections::HashMap;
use std::sync::Mutex;

use tokio::task::AbortHandle;

/// Registry of in-flight requests keyed by the frontend-generated request
/// ID, so a `cancel_request` command can abort the matching tokio task.
#[derive(Default)]
pub struct CancellationRegistry {
    handles: Mutex<HashMap<String, AbortHandle>>,
}

impl CancellationRegistry {
    pub fn register(&self, request_id: String, handle: AbortHandle) {
        self.handles.lock().unwrap().insert(request_id, handle);
    }

    pub fn unregister(&self, request_id: &str) {
        self.handles.lock().unwrap().remove(request_id);
    }

    pub fn cancel(&self, request_id: &str) -> bool {
        match self.handles.lock().unwrap().remove(request_id) {
            Some(handle) => {
                handle.abort();
                true
            }
            None => false,
        }
    }
}
