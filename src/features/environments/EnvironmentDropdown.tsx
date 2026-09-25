import { useEnvironmentStore } from "./environmentStore";

const NONE_VALUE = "__none__";

/** A second, more visible surface for switching the active environment,
 * right next to Send — the sidebar's EnvironmentSwitcher remains the place
 * to create/edit environments and their variables. */
export function EnvironmentDropdown() {
  const environments = useEnvironmentStore((s) => s.environments);
  const setActive = useEnvironmentStore((s) => s.setActive);
  const clearActive = useEnvironmentStore((s) => s.clearActive);
  const activeId = environments.find((e) => e.isActive)?.id ?? NONE_VALUE;

  if (environments.length === 0) {
    return <span className="px-1 text-xs text-text-muted">No environments</span>;
  }

  return (
    <select
      title="Active environment"
      value={activeId}
      onChange={(e) => {
        if (e.target.value === NONE_VALUE) void clearActive();
        else void setActive(e.target.value);
      }}
      className="h-8 max-w-[160px] rounded-sm border border-surface-3 bg-surface-2 px-2 text-sm text-text-secondary outline-none focus:border-accent"
    >
      <option value={NONE_VALUE}>No Environment</option>
      {environments.map((environment) => (
        <option key={environment.id} value={environment.id}>
          {environment.name}
        </option>
      ))}
    </select>
  );
}
