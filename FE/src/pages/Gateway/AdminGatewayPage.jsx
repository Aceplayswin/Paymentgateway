import { useCallback, useEffect, useState } from "react";
import Badge from "../../components/Badge";
import { listGateways, setGatewayStatus } from "../../services/adminGateway";
import { showServerErrorToast, showServerSuccessToast } from "../../utils/toast";

// Admin gateway control. Acquiring credentials are configured in the server
// environment (.env) — never entered here. The admin only sees which gateways
// are connected and decides which one is active. Merchants and end users never
// learn which processor actually settles their payments; to them it's "Paygate".

function AdminGatewayPage() {
  const [gateways, setGateways] = useState([]);
  const [onlyOneConnected, setOnlyOneConnected] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listGateways();
      setGateways(res.data?.gateways || []);
      setOnlyOneConnected(Boolean(res.data?.onlyOneConnected));
      setActiveCount(res.data?.activeCount || 0);
    } catch (error) {
      setGateways([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (gateway) => {
    const next = gateway.active ? "inactive" : "active";
    if (next === "inactive") {
      const ok = window.confirm(
        `Deactivating ${gateway.label} will stop routing payments through it. Continue?`,
      );
      if (!ok) return;
    }

    setBusyProvider(gateway.gatewayProvider);
    try {
      const res = await setGatewayStatus(gateway.gatewayProvider, next);
      showServerSuccessToast(res.message || `${gateway.label} marked ${next}.`);
      setGateways(res.data?.gateways || []);
      setOnlyOneConnected(Boolean(res.data?.onlyOneConnected));
      setActiveCount(res.data?.activeCount || 0);
    } catch (error) {
      showServerErrorToast(error);
    } finally {
      setBusyProvider(null);
    }
  };

  // A connected gateway can't be deactivated when it's the only connected one,
  // or when it's the last gateway still active (payments need one acquirer).
  const isLastActive = (gateway) => gateway.active && activeCount <= 1;
  const deactivateLocked = (gateway) =>
    gateway.active && (onlyOneConnected || isLastActive(gateway));

  const badgeStatus = (gateway) => {
    if (!gateway.connected) return "disabled";
    return gateway.active ? "active" : "disabled";
  };

  return (
    <section>
      <header className="content-header">
        <div>
          <h1>Gateway</h1>
          <p>
            Choose which acquiring gateway processes payments. Credentials are configured
            securely in the server environment — they are never entered or shown here.
            Merchants and customers only ever see Paygate; the underlying processor stays
            hidden.
          </p>
        </div>
      </header>

      {loading ? (
        <p className="table-empty">Loading gateways…</p>
      ) : gateways.length === 0 ? (
        <p className="table-empty">No gateways available.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {gateways.map((gateway) => {
            const locked = deactivateLocked(gateway);
            const busy = busyProvider === gateway.gatewayProvider;
            return (
              <div key={gateway.gatewayProvider} className="ds-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <h3 style={{ margin: 0 }}>{gateway.label}</h3>
                  <Badge status={badgeStatus(gateway)} />
                </div>

                {gateway.connected ? (
                  <dl className="api-key-meta" style={{ marginBottom: "1.25rem" }}>
                    <div>
                      <dt>Status</dt>
                      <dd>{gateway.active ? "Active — receiving payments" : "Inactive"}</dd>
                    </div>
                    <div>
                      <dt>Environment</dt>
                      <dd>
                        {gateway.environment === "production"
                          ? "Production (live)"
                          : "Sandbox (test)"}
                      </dd>
                    </div>
                    <div>
                      <dt>Key ID</dt>
                      <dd>
                        <code>{gateway.keyId}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Webhook</dt>
                      <dd>{gateway.webhookConfigured ? "Configured" : "Not configured"}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="muted" style={{ marginBottom: "1.25rem" }}>
                    Not connected. Add this gateway's credentials to the server
                    environment to enable it.
                  </p>
                )}

                <div className="api-key-card__actions">
                  <button
                    type="button"
                    className={gateway.active ? "outline-btn" : "primary-btn"}
                    disabled={!gateway.connected || busy || locked}
                    onClick={() => handleToggle(gateway)}
                    title={
                      locked
                        ? "At least one gateway must stay active."
                        : undefined
                    }
                  >
                    {busy
                      ? "Working…"
                      : gateway.active
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                  {locked ? (
                    <span className="muted" style={{ fontSize: "0.8rem" }}>
                      Can't deactivate — at least one gateway must stay active.
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminGatewayPage;
