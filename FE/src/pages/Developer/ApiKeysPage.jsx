import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../../components/Badge";
import { listApiKeys, generateApiKey, revokeApiKey } from "../../services/developer";
import { showServerErrorToast, showServerSuccessToast } from "../../utils/toast";

const MODES = [
  { id: "test", label: "Test mode", hint: "For sandbox / development integration." },
  { id: "live", label: "Live mode", hint: "For real payments in production." },
];

function maskKeyId(keyId) {
  if (!keyId) return "—";
  if (keyId.length <= 12) return keyId;
  return `${keyId.slice(0, 12)}…${keyId.slice(-4)}`;
}

function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyMode, setBusyMode] = useState("");
  // Holds the one-time secret just after generation: { mode, keyId, secret }.
  const [revealed, setRevealed] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listApiKeys();
      setKeys(res.data?.keys || []);
    } catch (error) {
      setKeys([]);
      showServerErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const keyForMode = (mode) => keys.find((k) => k.mode === mode) || null;

  const handleGenerate = async (mode) => {
    const existing = keyForMode(mode);
    if (existing) {
      const ok = window.confirm(
        `Regenerating your ${mode} key will immediately invalidate the current key. ` +
          `Any integration using it will stop working until you update the secret. Continue?`,
      );
      if (!ok) return;
    }

    setBusyMode(mode);
    try {
      const res = await generateApiKey(mode);
      setRevealed({
        mode,
        keyId: res.data?.keyId,
        secret: res.data?.secret,
      });
      showServerSuccessToast(res.message || "API key generated.");
      await load();
    } catch (error) {
      showServerErrorToast(error);
    } finally {
      setBusyMode("");
    }
  };

  const handleRevoke = async (mode) => {
    const ok = window.confirm(`Revoke the ${mode} API key? This cannot be undone.`);
    if (!ok) return;
    setBusyMode(mode);
    try {
      await revokeApiKey(mode);
      showServerSuccessToast("API key revoked.");
      if (revealed?.mode === mode) setRevealed(null);
      await load();
    } catch (error) {
      showServerErrorToast(error);
    } finally {
      setBusyMode("");
    }
  };

  const copy = (value) => {
    navigator.clipboard?.writeText(value).then(
      () => showServerSuccessToast("Copied to clipboard."),
      () => {},
    );
  };

  return (
    <section>
      <header className="content-header content-header--with-actions">
        <div>
          <h1>API Keys</h1>
          <p>
            Use these credentials to integrate our payment gateway into your website or app.
            See the <Link to="/developers/docs">API Documentation</Link> for the integration guide.
          </p>
        </div>
      </header>

      {revealed?.secret ? (
        <div className="ds-card" style={{ borderColor: "#16a34a", marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>
            Your new {revealed.mode} secret — copy it now
          </h3>
          <p className="muted">
            This is the only time the secret will be shown. Store it securely; you cannot
            retrieve it again. If you lose it, regenerate the key.
          </p>
          <div className="key-reveal-row">
            <code className="key-reveal-code">{revealed.secret}</code>
            <button type="button" className="outline-btn" onClick={() => copy(revealed.secret)}>
              Copy secret
            </button>
          </div>
          <button
            type="button"
            className="outline-btn"
            style={{ marginTop: "0.75rem" }}
            onClick={() => setRevealed(null)}
          >
            I've stored it — dismiss
          </button>
        </div>
      ) : null}

      {loading ? (
        <p className="table-empty">Loading API keys…</p>
      ) : (
        <div className="api-key-grid">
          {MODES.map((mode) => {
            const key = keyForMode(mode.id);
            const busy = busyMode === mode.id;
            return (
              <div key={mode.id} className="ds-card api-key-card">
                <div className="api-key-card__head">
                  <h3>{mode.label}</h3>
                  {key ? (
                    <Badge status="active" />
                  ) : (
                    <Badge status="disabled" />
                  )}
                </div>
                <p className="muted">{mode.hint}</p>

                {key ? (
                  <dl className="api-key-meta">
                    <div>
                      <dt>Key ID (public)</dt>
                      <dd>
                        <code>{maskKeyId(key.keyId)}</code>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => copy(key.keyId)}
                        >
                          copy
                        </button>
                      </dd>
                    </div>
                    <div>
                      <dt>Secret</dt>
                      <dd>
                        <code>sk_{mode.id}_••••{key.secretLast4 || "????"}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Last used</dt>
                      <dd>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="muted">No key yet. Generate one to start integrating.</p>
                )}

                <div className="api-key-card__actions">
                  <button
                    type="button"
                    className="primary-btn"
                    disabled={busy}
                    onClick={() => handleGenerate(mode.id)}
                  >
                    {busy ? "Working…" : key ? "Regenerate" : "Generate key"}
                  </button>
                  {key ? (
                    <button
                      type="button"
                      className="outline-btn"
                      disabled={busy}
                      onClick={() => handleRevoke(mode.id)}
                    >
                      Revoke
                    </button>
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

export default ApiKeysPage;
